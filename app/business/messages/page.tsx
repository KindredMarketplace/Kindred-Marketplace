/**
 * /business/messages — secure facility messaging. Ported from
 * Business-Portal/messages.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only (matches CNA/Client messages pages): real-time chat isn't
 * wired yet, so rather than the mock's fake thread filler we render the full
 * two-pane layout with honest empty states in both panes. The composer is
 * present but inert until messaging goes live.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function BusinessMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Real messages involving this facility user (none expected yet).
  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .limit(1);

  const hasMessages = (messages?.length ?? 0) > 0;

  return (
    <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 py-6 grid lg:grid-cols-12 gap-0 lg:gap-6 fade-up">
      {/* INBOX */}
      <aside className="lg:col-span-4 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh]">
        <div className="p-5 border-b border-ink/10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Inbox</div>
              <h2 className="font-display text-2xl font-medium">Messages</h2>
            </div>
            <button className="w-9 h-9 flex items-center justify-center bg-mist hover:bg-deepteal hover:text-cream rounded-full transition" title="New message">
              +
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search caregivers, shifts, or threads…"
              className="w-full bg-mist/40 border border-transparent rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
          </div>
          <div className="flex items-center gap-1 mt-3 border-b border-ink/10">
            <button className="px-3 py-2 text-xs font-medium border-b-2 tab-active relative">
              Conversations
              <span className="ml-1.5 text-[10px] text-ink/50 font-mono">0</span>
            </button>
            <button className="px-3 py-2 text-xs text-ink/60 hover:text-ink border-b-2 border-transparent transition">
              Requests
              <span className="ml-1.5 text-[10px] text-ink/40 font-mono">0</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasMessages ? (
            <p className="text-sm text-ink/60 text-center py-10">Loading your conversations…</p>
          ) : (
            <>
              <div className="text-center py-6">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm font-medium mb-1">No active conversations yet</p>
                <p className="text-xs text-ink/60 max-w-[14rem] mx-auto">
                  Threads with caregivers and your account manager will appear here. Message a CNA from
                  the roster to start one.
                </p>
              </div>

              <div className="bg-mist/40 border border-ink/10 rounded-xl p-3 text-xs text-ink/70 leading-relaxed">
                <div className="flex items-center gap-1.5 font-medium text-ink mb-1">
                  <span>📥</span> Message requests
                </div>
                When a caregiver messages your facility for the first time, it lands in{' '}
                <strong>Requests</strong> — not your main inbox. Triage on your own schedule.
              </div>
            </>
          )}
        </div>
      </aside>

      {/* CHAT PANE */}
      <section className="lg:col-span-8 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh] mt-6 lg:mt-0">
        <div className="flex-1 flex items-center justify-center p-10 bg-creamdark/30">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="font-display text-2xl font-medium mb-2">Your messages live here</h3>
            <p className="text-sm text-ink/60 leading-relaxed">
              Talk directly with caregivers about a shift, send roster-wide broadcasts ("3 NOC shifts
              tonight"), or reach your dedicated account manager. Every conversation is private,
              encrypted, and HIPAA-logged.
            </p>
          </div>
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-ink/10 bg-cream">
          <div className="flex items-end gap-2 bg-white border border-ink/15 rounded-2xl p-2 opacity-60">
            <button className="w-9 h-9 flex items-center justify-center text-ink/40" title="Attach" disabled>📎</button>
            <textarea
              rows={1}
              placeholder="Select a conversation to start messaging…"
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none max-h-32"
              disabled
            />
            <button className="bg-ink/30 text-cream w-10 h-10 rounded-full flex items-center justify-center" disabled>
              →
            </button>
          </div>
          <div className="text-[10px] text-ink/40 font-mono mt-2 px-2 flex items-center gap-2">
            <span>🔒</span>
            <span>Encrypted &amp; audit-logged. Visible only to your team and the caregiver in the thread.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
