/**
 * lib/messaging-shared.ts — types + pure helpers that are SAFE TO IMPORT
 * FROM CLIENT COMPONENTS.
 *
 * Lives separately from `lib/messaging.ts` because that file uses
 * `import 'server-only'` to enforce that its supabase-touching helpers
 * never get pulled into client bundles. Once `'server-only'` is in a module,
 * Next.js refuses to import ANYTHING from it into a `'use client'` component —
 * even types and pure functions. So we pull the client-safe bits out here.
 *
 * Rule of thumb: anything in this file must NOT import supabase, next/headers,
 * cookies, or any other server-only API. Everything must be pure / data-only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of one row in the inbox list (either Conversations or Requests tab).
 * Combines the thread row with denormalized fields about "the other person"
 * so the UI doesn't need to do a second lookup.
 */
export type InboxThread = {
  id: string;
  status: 'pending_request' | 'accepted' | 'declined' | 'blocked';
  startedVia: 'browse' | 'application_review' | 'hire' | 'system' | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  // "The other person" — never the current user.
  otherUserId: string;
  otherName: string;
  otherSubtitle: string | null;
  otherIsCNA: boolean;
  /** ISO timestamp of the other party's last app activity, or null if unknown. */
  otherLastActiveAt: string | null;
  /** True when the current user initiated this thread. */
  iStarted: boolean;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Normalize a pair of user ids into (smaller, larger) order. */
export function normalizePair(userA: string, userB: string): { a: string; b: string } {
  return userA < userB ? { a: userA, b: userB } : { a: userB, b: userA };
}

/**
 * Pure helper to know which side of a thread a user sits on. Used to read
 * the right unread_count_* column in the inbox query.
 */
export function threadSide(
  thread: { participant_a: string; participant_b: string },
  userId: string,
): 'a' | 'b' | null {
  if (thread.participant_a === userId) return 'a';
  if (thread.participant_b === userId) return 'b';
  return null;
}

/**
 * Quick "online now?" check based on the periodic-ping `users.last_active_at`
 * column. Anything in the last 2 minutes counts as online.
 */
export function isUserOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const last = new Date(lastActiveAt).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last < 2 * 60 * 1000;
}
