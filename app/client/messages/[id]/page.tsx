/**
 * /client/messages/[id] — family-side view of one message thread.
 *
 * Server-rendered: loads the thread, its messages, and the other user's
 * profile data. Ownership-gated: the logged-in user must be a participant
 * (RLS will return null otherwise — we 404 to be safe).
 *
 * The right pane uses the shared MessageThreadView component. The left pane
 * reuses the same MessageInboxList from the inbox page, with the current
 * thread highlighted.
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadInbox, loadUserPresence } from '@/lib/messaging';
import { MessageInboxList } from '@/components/messaging/MessageInboxList';
import { MessageThreadView, type RenderedMessage, type ThreadHeaderInfo } from '@/components/messaging/MessageThreadView';

export const dynamic = 'force-dynamic';

export default async function ClientMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load thread + ownership-check in one query.
  const { data: thread } = await supabase
    .from('message_threads')
    .select(
      'id, participant_a, participant_b, status, started_by, started_via',
    )
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) notFound();
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    notFound();
  }

  const otherUserId =
    thread.participant_a === user.id ? thread.participant_b : thread.participant_a;

  // Resolve the other user's display info — they should be a CNA when we're
  // in the family portal.
  const { data: otherCna } = await supabase
    .from('cna_profiles')
    .select('display_name, last_name, years_experience, tier, hourly_rate_cents')
    .eq('user_id', otherUserId)
    .maybeSingle();

  const otherName = otherCna
    ? `${otherCna.display_name}${otherCna.last_name ? ' ' + otherCna.last_name[0] + '.' : ''}`
    : 'Caregiver';
  const otherSubtitle = otherCna
    ? otherCna.years_experience
      ? `CNA · ${otherCna.years_experience} yrs exp`
      : 'CNA'
    : null;

  // Messages in this thread, oldest first. read_at is needed for the
  // single-/double-check read receipt UI under sent messages.
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, body, created_at, sender_id, read_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const messages: RenderedMessage[] = (msgs ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    fromMe: m.sender_id === user.id,
    readAt: m.read_at,
  }));

  const otherLastActiveAt = await loadUserPresence(supabase, otherUserId);

  const header: ThreadHeaderInfo = {
    threadId: thread.id,
    status: thread.status as ThreadHeaderInfo['status'],
    startedVia: thread.started_via as ThreadHeaderInfo['startedVia'],
    iStarted: thread.started_by === user.id,
    otherUserId,
    otherName,
    otherSubtitle,
    otherAvatarSeed: otherName,
    otherLastActiveAt,
    otherProfileHref: undefined,
  };

  // Also load the full inbox for the left pane.
  const { conversations, requests } = await loadInbox(supabase, user.id, 'client');

  return (
    <main className="flex-1 max-w-kindred w-full mx-auto px-6 py-6 grid lg:grid-cols-12 gap-0 lg:gap-6 fade-up">
      {/* INBOX */}
      <aside className="hidden lg:flex lg:col-span-4 bg-white border border-ink/10 rounded-2xl overflow-hidden flex-col h-[78vh]">
        <div className="p-5 border-b border-ink/10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Inbox</div>
              <h2 className="font-display text-2xl font-medium">Messages</h2>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages…"
              className="w-full bg-mist/40 border border-transparent rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
          </div>
        </div>
        <MessageInboxList
          conversations={conversations}
          requests={requests}
          basePath="/client/messages"
          activeThreadId={thread.id}
        />
      </aside>

      <MessageThreadView header={header} messages={messages} backHref="/client/messages" currentUserId={user.id} />
    </main>
  );
}
