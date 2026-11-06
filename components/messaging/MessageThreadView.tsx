/**
 * MessageThreadView — server component that renders the right-pane chat view
 * for ONE thread. Used by both /client/messages/[id] and /cna/messages/[id].
 *
 * Phase D polish layered in:
 *   - Wrapped in ThreadLiveProvider — runs the per-thread realtime channel
 *     for typing broadcasts + presence (am I + the other person both in this
 *     thread right now?).
 *   - Header shows a live online indicator: green pulse + "Active now" when
 *     the other person is in this thread; falls back to "Active Xm ago" from
 *     last_active_at when they're not but were recently.
 *   - Read receipts under each "from me" message: gray ✓ when sent, double
 *     teal ✓✓ when the recipient has marked it read.
 *   - TypingIndicator dots appear above the composer when the other person
 *     is typing (broadcast event, not DB-backed).
 *
 * This is still a server component (no 'use client'). The realtime/typing
 * stuff lives in the client children we mount.
 */

import Link from 'next/link';
import { MessageComposer } from './MessageComposer';
import { MarkThreadReadOnMount } from './MarkThreadReadOnMount';
import { ThreadRealtimeRefresh } from './ThreadRealtimeRefresh';
import { ThreadLiveProvider } from './ThreadLiveChannel';
import { TypingIndicator } from './TypingIndicator';
import { isUserOnline } from '@/lib/messaging';

export type ThreadHeaderInfo = {
  threadId: string;
  status: 'pending_request' | 'accepted' | 'declined' | 'blocked';
  startedVia: 'browse' | 'application_review' | 'hire' | 'system' | null;
  iStarted: boolean;
  /** The OTHER person — never the current user. */
  otherUserId: string;
  otherName: string;
  otherSubtitle: string | null;
  /** Used to render their avatar — same hash-pick as the inbox list. */
  otherAvatarSeed: string;
  /** ISO timestamp of the other party's last app activity, or null. */
  otherLastActiveAt: string | null;
  /** Optional link to the other person's profile. */
  otherProfileHref?: string;
};

export type RenderedMessage = {
  id: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
  /** ISO timestamp when this message was marked read by the recipient. */
  readAt: string | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function avatarClass(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `av-${(hash % 7) + 1}`;
}

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** "5m ago", "2h ago", "yesterday", or a date. Used in the header subtitle. */
function relativeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function startedViaLabel(via: ThreadHeaderInfo['startedVia']): string | null {
  switch (via) {
    case 'browse':
      return 'Started from Browse';
    case 'application_review':
      return 'From an application';
    case 'hire':
      return 'After hiring';
    default:
      return null;
  }
}

export function MessageThreadView({
  header,
  messages,
  backHref,
  currentUserId,
}: {
  header: ThreadHeaderInfo;
  messages: RenderedMessage[];
  backHref: '/client/messages' | '/cna/messages';
  currentUserId: string;
}) {
  const isLocked = header.status === 'declined' || header.status === 'blocked';
  const pending = header.status === 'pending_request';
  const contextLabel = startedViaLabel(header.startedVia);

  // Online state is computed server-side from last_active_at as a fallback;
  // ThreadLiveProvider can upgrade it client-side to "right here in the thread"
  // status. We render the static version here so server-rendered output
  // already looks correct, then ThreadHeaderPresence overrides it.
  const initialOnline = isUserOnline(header.otherLastActiveAt);
  const initialAgoLabel = relativeAgo(header.otherLastActiveAt);

  const grouped: Array<{ date: string; items: RenderedMessage[] }> = [];
  for (const m of messages) {
    const key = dateLabel(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === key) {
      last.items.push(m);
    } else {
      grouped.push({ date: key, items: [m] });
    }
  }

  return (
    <ThreadLiveProvider
      threadId={header.threadId}
      currentUserId={currentUserId}
      otherUserId={header.otherUserId}
    >
      <section className="lg:col-span-8 bg-white border border-ink/10 rounded-2xl overflow-hidden flex flex-col h-[78vh] mt-6 lg:mt-0">
        <MarkThreadReadOnMount threadId={header.threadId} />
        <ThreadRealtimeRefresh threadId={header.threadId} currentUserId={currentUserId} />

        {/* Header */}
        <div className="p-4 border-b border-ink/10 flex items-center gap-4">
          <Link
            href={backHref}
            className="lg:hidden w-9 h-9 flex items-center justify-center text-ink/60 hover:bg-mist rounded-full transition"
            aria-label="Back to inbox"
          >
            ←
          </Link>
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-full ${avatarClass(header.otherAvatarSeed)} flex items-center justify-center text-cream font-display text-sm font-medium`}>
              {initials(header.otherName)}
            </div>
            {initialOnline && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 bg-sage rounded-full ring-2 ring-white"
                title="Active recently"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-medium leading-tight truncate">
              {header.otherProfileHref ? (
                <Link href={header.otherProfileHref} className="hover:text-deepteal transition">
                  {header.otherName}
                </Link>
              ) : (
                header.otherName
              )}
            </div>
            <div className="text-xs text-ink/60 flex items-center gap-2 flex-wrap">
              {initialOnline ? (
                <span className="text-sage font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                  Active now
                </span>
              ) : initialAgoLabel ? (
                <span className="text-ink/55">Active {initialAgoLabel}</span>
              ) : null}
              {header.otherSubtitle && (
                <>
                  {(initialOnline || initialAgoLabel) && <span className="text-ink/30">·</span>}
                  <span>{header.otherSubtitle}</span>
                </>
              )}
              {contextLabel && (
                <>
                  <span className="text-ink/30">·</span>
                  <span>{contextLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {pending && (
          <div className="px-4 py-2.5 bg-butter/30 border-b border-butter/50 text-xs text-ink/80 text-center">
            {header.iStarted ? (
              <>
                <strong>Waiting on {header.otherName.split(' ')[0]} to reply.</strong> The conversation
                moves to your main inbox the moment they respond.
              </>
            ) : (
              <>
                <strong>{header.otherName.split(' ')[0]} reached out.</strong> Reply to start the
                conversation — no separate accept step.
              </>
            )}
          </div>
        )}

        {isLocked && (
          <div className="px-4 py-2.5 bg-coral/15 border-b border-coral/30 text-xs text-coral text-center">
            This conversation is closed.
          </div>
        )}

        {/* Scrollback */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-creamdark/30">
          {grouped.length === 0 ? (
            <div className="text-center text-xs text-ink/50 py-10">No messages yet.</div>
          ) : (
            grouped.map((group, groupIdx) => {
              // Find the index of the LAST "from me" message in the whole list
              // (across days). Used so we only render the ✓/✓✓ status on the
              // most recent of my own messages — like iMessage.
              const allFromMe = messages
                .map((m, i) => ({ m, i }))
                .filter((x) => x.m.fromMe);
              const lastFromMeIndex = allFromMe.length > 0 ? allFromMe[allFromMe.length - 1].i : -1;

              return (
                <div key={group.date}>
                  <div className="flex justify-center mb-3">
                    <div className="bg-creamdark text-ink/70 text-[11px] font-mono px-3 py-1 rounded-full">
                      {group.date}
                    </div>
                  </div>
                  {group.items.map((m, idx) => {
                    // Compute global index for this message to compare against lastFromMeIndex.
                    let globalIdx = 0;
                    for (let g = 0; g < groupIdx; g++) globalIdx += grouped[g].items.length;
                    globalIdx += idx;
                    const isLastFromMe = m.fromMe && globalIdx === lastFromMeIndex;
                    return m.fromMe ? (
                      <div key={m.id} className="flex gap-3 items-end justify-end mb-3">
                        <div className="max-w-md">
                          <div className="bg-gradient-to-br from-deepteal to-teal text-cream rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                            {m.body}
                          </div>
                          <div className="text-[10px] text-ink/50 font-mono mt-1 mr-2 text-right flex items-center justify-end gap-1.5">
                            <span>{timeOfDay(m.createdAt)}</span>
                            {isLastFromMe && (
                              <span
                                className={m.readAt ? 'text-teal font-bold' : 'text-ink/40'}
                                title={m.readAt ? `Read ${relativeAgo(m.readAt) ?? ''}` : 'Sent'}
                                aria-label={m.readAt ? 'Read' : 'Sent'}
                              >
                                {m.readAt ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex gap-3 items-end mb-3">
                        <div className={`w-7 h-7 rounded-full ${avatarClass(header.otherAvatarSeed)} flex items-center justify-center text-cream text-xs font-medium flex-shrink-0`}>
                          {initials(header.otherName)}
                        </div>
                        <div className="max-w-md">
                          <div className="bg-white border border-ink/10 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                            {m.body}
                          </div>
                          <div className="text-[10px] text-ink/50 font-mono mt-1 ml-2">
                            {timeOfDay(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Typing dots (live; renders nothing when nobody's typing) */}
        <TypingIndicator otherName={header.otherName} />

        <MessageComposer
          threadId={header.threadId}
          recipientName={header.otherName}
          disabled={isLocked}
          disabledReason="This conversation is closed."
        />
      </section>
    </ThreadLiveProvider>
  );
}
