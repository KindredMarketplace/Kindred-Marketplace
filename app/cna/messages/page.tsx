/**
 * /cna/messages — caregiver inbox. Mirror of /client/messages.
 *
 * Real-data-only: loads this caregiver's threads via loadInbox(). Splits into
 * Conversations vs Requests. Requests = cold outreach OR application-review
 * messages from families that the CNA hasn't yet replied to. Replying once
 * promotes the thread to Conversations automatically.
 */

import { redirect } from 'next/navigation';
import { loadInbox } from '@/lib/messaging';
import { MessageInboxList } from '@/components/messaging/MessageInboxList';
import { getViewer } from '@/lib/viewer';
// NOTE: <InboxRealtimeRefresh /> is mounted in app/cna/layout.tsx, which wraps
// this page. Mounting another instance here would try to subscribe to the same
// channel name on the same Supabase client and throw "cannot add postgres_changes
// callbacks after subscribe()". One per render tree is enough — the layout's
// instance keeps this page's inbox live too.

export const dynamic = 'force-dynamic';

export default async function CnaMessagesPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const { conversations, requests } = await loadInbox(supabase, user.id, 'cna');
  const totalThreads = conversations.length + requests.length;

  return (
    <main className="flex-1 max-w-kindred w-full mx-auto px-6 py-6 grid lg:grid-cols-12 gap-0 lg:gap-6 fade-up">
      {/* INBOX */}
      <aside className="lg:col-span-4 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh]">
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
        />
      </aside>

      {/* CHAT VIEW — empty state until a thread is selected */}
      <section className="lg:col-span-8 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh] mt-6 lg:mt-0">
        <div className="flex-1 flex items-center justify-center p-10 bg-creamdark/30">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="font-display text-2xl font-medium mb-2">Your messages live here</h3>
            <p className="text-sm text-ink/60 leading-relaxed">
              {totalThreads > 0
                ? 'Pick a conversation on the left to start reading.'
                : 'Apply to jobs, and replies from families show up here. New families who message you cold land in your Requests tab — reply to start the conversation.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
