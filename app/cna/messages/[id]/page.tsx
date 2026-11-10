/**
 * /cna/messages/[id] — caregiver-side view of one message thread.
 *
 * Mirror of /client/messages/[id]. The other party is a family (client),
 * so we look up client_profiles for their name.
 */

import { notFound, redirect } from 'next/navigation';
import { loadInbox, loadUserPresence } from '@/lib/messaging';
import { MessageInboxList } from '@/components/messaging/MessageInboxList';
import {
  MessageThreadView,
  type RenderedMessage,
  type ThreadHeaderInfo,
} from '@/components/messaging/MessageThreadView';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function CnaMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: threadId } = await params;
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const { data: thread } = await supabase
    .from('message_threads')
    .select('id, participant_a, participant_b, status, started_by, started_via')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) notFound();
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    notFound();
  }

  const otherUserId =
    thread.participant_a === user.id ? thread.participant_b : thread.participant_a;

  const { data: otherClient } = await supabase
    .from('client_profiles')
    .select('name, zip')
    .eq('user_id', otherUserId)
    .maybeSingle();

  const otherName = otherClient?.name ?? 'Family';
  const otherSubtitle = otherClient?.zip ? `Family · ${otherClient.zip}` : 'Family';

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
  };

  const { conversations, requests } = await loadInbox(supabase, user.id, 'cna');

  return (
    <main className="flex-1 max-w-kindred w-full mx-auto px-6 py-6 grid lg:grid-cols-12 gap-0 lg:gap-6 fade-up">
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
          basePath="/cna/messages"
          activeThreadId={thread.id}
        />
      </aside>

      <MessageThreadView header={header} messages={messages} backHref="/cna/messages" currentUserId={user.id} />
    </main>
  );
}
