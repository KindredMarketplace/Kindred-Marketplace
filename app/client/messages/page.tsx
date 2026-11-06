/**
 * /client/messages — family inbox. Ported from Client-Portal/messages.html.
 * Shell lives in app/client/layout.tsx.
 *
 * Real-data-only: loads this user's actual message threads from the database
 * via lib/messaging.loadInbox(). Splits into Conversations vs Requests via
 * the same helper, rendered by the shared MessageInboxList component. When
 * no thread is selected we show the "pick a conversation" empty state in the
 * right pane.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadInbox } from '@/lib/messaging';
import { MessageInboxList } from '@/components/messaging/MessageInboxList';
// NOTE: <InboxRealtimeRefresh /> is mounted in app/client/layout.tsx, which wraps
// this page. Mounting another instance here would try to subscribe to the same
// channel name on the same Supabase client and throw "cannot add postgres_changes
// callbacks after subscribe()". One per render tree is enough — the layout's
// instance keeps this page's inbox live too.

export const dynamic = 'force-dynamic';

export default async function ClientMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { conversations, requests } = await loadInbox(supabase, user.id, 'client');
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
          basePath="/client/messages"
        />
      </aside>

      {/* CHAT VIEW — empty state when no thread is selected */}
      <section className="lg:col-span-8 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh] mt-6 lg:mt-0">
        <div className="flex-1 flex items-center justify-center p-10 bg-creamdark/30">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="font-display text-2xl font-medium mb-2">Your messages live here</h3>
            <p className="text-sm text-ink/60 leading-relaxed">
              {totalThreads > 0
                ? 'Pick a conversation on the left to start reading.'
                : 'Reach out to a caregiver from Browse, or message an applicant on one of your job posts. Every conversation is encrypted — only you and the caregiver can read it.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
