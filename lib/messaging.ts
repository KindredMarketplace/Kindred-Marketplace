/**
 * lib/messaging.ts — single source of truth for message-thread DB operations.
 *
 * This file is SERVER-ONLY. The `import 'server-only'` directive enforces
 * that — if any client component accidentally imports from here, Next.js
 * will refuse to compile. Use `lib/messaging-shared.ts` for types + pure
 * helpers that need to be importable from client components.
 *
 * The `message_threads` schema has a critical constraint:
 *   check (participant_a < participant_b)
 *
 * This means we always store the smaller UUID in participant_a. Every
 * lookup, insert, and join has to respect that ordering, or we'll silently
 * create duplicate threads or miss lookups. ALL thread reads/writes go
 * through helpers here so the rest of the app doesn't have to think about it.
 */

import type { TablesInsert } from '@/types/database.types';
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { normalizePair, threadSide, isUserOnline, type InboxThread } from './messaging-shared';

// Re-export the client-safe bits so server callers can still import them
// from `@/lib/messaging` without caring about the split.
export { normalizePair, threadSide, isUserOnline };
export type { InboxThread };

type Client = SupabaseClient<Database>;

/**
 * Find an existing thread between two users, or null. Handles the
 * participant_a < participant_b normalization for you.
 */
export async function findThreadBetween(
  supabase: Client,
  userA: string,
  userB: string,
): Promise<{ id: string; status: string; started_by: string | null } | null> {
  const { a, b } = normalizePair(userA, userB);
  const { data } = await supabase
    .from('message_threads')
    .select('id, status, started_by')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();
  return data ?? null;
}

/**
 * Get-or-create a thread between two users. Idempotent: if a thread already
 * exists (regardless of its current status), it's returned as-is. Only
 * creates a new row when there's nothing there.
 *
 * `startedBy` MUST be one of {userA, userB} — it's the participant who
 * initiated the thread. The OTHER participant is the recipient who needs
 * to reply to "accept" the thread (SMS-style implicit accept, handled by
 * the messages_update_thread_summary trigger).
 *
 * `startedVia` is informational ('browse', 'application_review', 'hire').
 * `initialStatus` defaults to 'pending_request' but can be overridden to
 * 'accepted' for the hire-without-prior-message edge case.
 */
export async function getOrCreateThread(
  supabase: Client,
  params: {
    userA: string;
    userB: string;
    startedBy: string;
    startedVia: 'browse' | 'application_review' | 'hire' | 'system';
    initialStatus?: 'pending_request' | 'accepted';
    jobId?: string | null;
    bookingId?: string | null;
  },
): Promise<
  | { ok: true; threadId: string; created: boolean }
  | { ok: false; error: string }
> {
  const { userA, userB, startedBy, startedVia, initialStatus, jobId, bookingId } = params;

  if (userA === userB) {
    return {
      ok: false,
      error:
        'You and this person are the same account, so a conversation can\u2019t be started. If you\u2019re testing both sides of a hire, sign in with a different account on the caregiver portal.',
    };
  }
  if (startedBy !== userA && startedBy !== userB) {
    return { ok: false, error: 'startedBy must be one of the two participants.' };
  }

  const { a, b } = normalizePair(userA, userB);

  // First: look it up.
  const existing = await findThreadBetween(supabase, a, b);
  if (existing) {
    return { ok: true, threadId: existing.id, created: false };
  }

  // Build the insert payload. We OMIT `accepted_at` when it would be null —
  // PostgREST's schema cache occasionally lags behind migrations (visible as
  // "Could not find the 'accepted_at' column of 'message_threads' in the
  // schema cache"), and any explicit reference to the column would fail the
  // whole insert. Omitting it lets the default (null) apply server-side and
  // sidesteps the cache. When we DO need accepted_at (initialStatus='accepted'),
  // we include it — if the schema cache is stale on that path we want to know.
  const insertPayload: Record<string, unknown> = {
    participant_a: a,
    participant_b: b,
    started_by: startedBy,
    started_via: startedVia,
    status: initialStatus ?? 'pending_request',
    job_id: jobId ?? null,
    booking_id: bookingId ?? null,
  };
  if (initialStatus === 'accepted') {
    insertPayload.accepted_at = new Date().toISOString();
  }

  const { data: inserted, error } = await supabase
    .from('message_threads')
    .insert(insertPayload as TablesInsert<'message_threads'>)
    .select('id')
    .single();

  if (error) {
    // Race: someone else just inserted the same pair. Look it up.
    if (error.code === '23505') {
      const again = await findThreadBetween(supabase, a, b);
      if (again) return { ok: true, threadId: again.id, created: false };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, threadId: inserted.id, created: true };
}

/**
 * Promote a thread to status='accepted'. Used by the hire flow when we want
 * to skip the request step entirely (the family has already chosen to work
 * with this CNA, so the thread is implicitly mutual).
 *
 * Safe to call on an already-accepted thread (no-op).
 */
export async function promoteThreadToAccepted(
  supabase: Client,
  threadId: string,
): Promise<void> {
  await supabase
    .from('message_threads')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('status', 'pending_request'); // guard against overwriting declined/blocked
}

/**
 * Load all threads for a user, split into Conversations and Requests buckets.
 * One query, then a couple of in-memory joins for the "other person" names.
 *
 * `forRole` tells us how to label the other party in the subtitle:
 *   - 'client' (logged-in user is family) → other side is a CNA, look up cna_profiles
 *   - 'cna'    (logged-in user is caregiver) → other side is a client, look up client_profiles
 */
export async function loadInbox(
  supabase: Client,
  userId: string,
  forRole: 'client' | 'cna',
): Promise<{ conversations: InboxThread[]; requests: InboxThread[] }> {
  // All threads where I'm a participant, ordered by recency.
  const { data: rows } = await supabase
    .from('message_threads')
    .select(
      'id, status, started_by, started_via, participant_a, participant_b, last_message_at, last_message_preview, unread_count_a, unread_count_b',
    )
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  const threads = rows ?? [];
  if (threads.length === 0) return { conversations: [], requests: [] };

  // Look up the "other person" for every thread in two batch queries.
  const otherIds = threads.map((t) =>
    t.participant_a === userId ? t.participant_b : t.participant_a,
  );
  const uniqueOthers = Array.from(new Set(otherIds));

  const nameMap = new Map<string, { name: string; subtitle: string | null; isCNA: boolean }>();

  // Always batch-load presence (last_active_at) from public.users for the
  // green-dot indicator. Done in parallel with the role-specific profile
  // lookup below.
  const presencePromise = supabase
    .from('users')
    .select('id, last_active_at')
    .in('id', uniqueOthers);

  if (forRole === 'client') {
    // Other side should be a CNA.
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, years_experience, tier')
      .in('user_id', uniqueOthers);
    (cnas ?? []).forEach((c) => {
      const subtitle = c.years_experience
        ? `CNA · ${c.years_experience} yrs exp`
        : 'CNA';
      nameMap.set(c.user_id, {
        name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`,
        subtitle: c.tier === 'top_rated' ? `✨ Top Rated · ${subtitle}` : subtitle,
        isCNA: true,
      });
    });
  } else {
    // Other side should be a client.
    const { data: clients } = await supabase
      .from('client_profiles')
      .select('user_id, name')
      .in('user_id', uniqueOthers);
    (clients ?? []).forEach((c) => {
      nameMap.set(c.user_id, { name: c.name, subtitle: 'Family', isCNA: false });
    });
  }

  // Resolve the presence lookup. If it failed for any reason we just leave
  // the dot off — not a fatal issue.
  const presenceMap = new Map<string, string | null>();
  const presenceResult = await presencePromise;
  (presenceResult.data ?? []).forEach((u) => {
    presenceMap.set(u.id, u.last_active_at);
  });

  // Map every thread row to an InboxThread.
  const mapped: InboxThread[] = threads.map((t) => {
    const isA = t.participant_a === userId;
    const otherUserId = isA ? t.participant_b : t.participant_a;
    const meta = nameMap.get(otherUserId);
    return {
      id: t.id,
      status: t.status as InboxThread['status'],
      startedVia: (t.started_via ?? null) as InboxThread['startedVia'],
      lastMessageAt: t.last_message_at,
      lastMessagePreview: t.last_message_preview,
      unreadCount: isA ? t.unread_count_a : t.unread_count_b,
      otherUserId,
      otherName: meta?.name ?? 'Someone',
      otherSubtitle: meta?.subtitle ?? null,
      otherIsCNA: meta?.isCNA ?? forRole === 'client',
      otherLastActiveAt: presenceMap.get(otherUserId) ?? null,
      iStarted: t.started_by === userId,
    };
  });

  // Split into Conversations vs Requests.
  // Conversations = accepted threads. Also include pending_request threads I
  //   STARTED (I already opted in by sending the first message).
  // Requests = pending_request threads addressed TO me (someone else started).
  const conversations: InboxThread[] = [];
  const requests: InboxThread[] = [];
  for (const t of mapped) {
    if (t.status === 'accepted') {
      conversations.push(t);
    } else if (t.status === 'pending_request') {
      if (t.iStarted) conversations.push(t);
      else requests.push(t);
    }
    // declined/blocked threads don't appear in either tab.
  }

  return { conversations, requests };
}

/**
 * Total unread messages for the user across all their threads. Used by the
 * nav badge. Cheap because unread counts are denormalized on message_threads
 * by the message-insert trigger.
 */
export async function loadUnreadTotal(supabase: Client, userId: string): Promise<number> {
  const { data } = await supabase
    .from('message_threads')
    .select('participant_a, participant_b, unread_count_a, unread_count_b')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);
  if (!data) return 0;
  return data.reduce((sum, t) => {
    return sum + (t.participant_a === userId ? t.unread_count_a : t.unread_count_b);
  }, 0);
}

/** Load just the last_active_at for one user. Used by the thread header. */
export async function loadUserPresence(
  supabase: Client,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('last_active_at')
    .eq('id', userId)
    .maybeSingle();
  return data?.last_active_at ?? null;
}
