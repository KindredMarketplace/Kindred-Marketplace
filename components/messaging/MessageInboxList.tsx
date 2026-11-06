'use client';

/**
 * MessageInboxList — shared inbox list used by both client and CNA portals.
 *
 * Handles the Conversations vs Requests tab toggle in-browser (no extra
 * server round-trip needed since we load both lists at once from the server
 * page). Renders the appropriate empty state per tab, including the helpful
 * "this is how requests work" callout on the recipient-side empty state.
 *
 * Special rendering for hire-created empty threads: when started_via='hire'
 * and there's no first message yet, we show "✓ New connection — say hello"
 * in italic so the row reads as an inviting prompt instead of looking broken.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { InboxThread } from '@/lib/messaging-shared';
import { isUserOnline } from '@/lib/messaging-shared';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function avatarClass(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `av-${(hash % 7) + 1}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MessageInboxList({
  conversations,
  requests,
  basePath,
  activeThreadId,
}: {
  conversations: InboxThread[];
  requests: InboxThread[];
  /** "/client/messages" or "/cna/messages" — used to build links. */
  basePath: '/client/messages' | '/cna/messages';
  /** When viewing a specific thread, highlight that row in the list. */
  activeThreadId?: string;
}) {
  const [tab, setTab] = useState<'conversations' | 'requests'>(
    conversations.length > 0
      ? 'conversations'
      : requests.length > 0
        ? 'requests'
        : 'conversations',
  );

  const list = tab === 'conversations' ? conversations : requests;

  return (
    <>
      <div className="flex items-center gap-1 mt-3 border-b border-ink/10">
        <button
          onClick={() => setTab('conversations')}
          className={`px-3 py-2 text-xs border-b-2 transition ${
            tab === 'conversations'
              ? 'font-medium border-deepteal text-deepteal'
              : 'text-ink/60 hover:text-ink border-transparent'
          }`}
        >
          Conversations
          <span className="ml-1.5 text-[10px] text-ink/50 font-mono">{conversations.length}</span>
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-3 py-2 text-xs border-b-2 transition relative ${
            tab === 'requests'
              ? 'font-medium border-deepteal text-deepteal'
              : 'text-ink/60 hover:text-ink border-transparent'
          }`}
        >
          Requests
          {requests.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <EmptyState tab={tab} basePath={basePath} requestsCount={requests.length} />
        ) : (
          <div>
            {list.map((t) => {
              const isActive = t.id === activeThreadId;
              const isEmptyHire = !t.lastMessagePreview && t.startedVia === 'hire';
              return (
                <Link
                  key={t.id}
                  href={`${basePath}/${t.id}`}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-ink/10 transition ${
                    isActive ? 'bg-mist/40' : 'hover:bg-mist/30'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full ${avatarClass(t.otherName)} flex items-center justify-center text-cream font-display text-sm font-medium`}
                    >
                      {initials(t.otherName)}
                    </div>
                    {isUserOnline(t.otherLastActiveAt) && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 bg-sage rounded-full ring-2 ring-white"
                        title="Active recently"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-sm truncate ${t.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}
                      >
                        {t.otherName}
                      </span>
                      <span className="text-[10px] font-mono text-ink/50 flex-shrink-0">
                        {relativeTime(t.lastMessageAt)}
                      </span>
                    </div>
                    {t.otherSubtitle && (
                      <div className="text-[11px] text-ink/55 truncate">{t.otherSubtitle}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-xs truncate flex-1 ${
                          t.unreadCount > 0
                            ? 'text-ink font-medium'
                            : isEmptyHire
                              ? 'text-deepteal italic'
                              : t.lastMessagePreview
                                ? 'text-ink/60'
                                : 'text-ink/50 italic'
                        }`}
                      >
                        {t.iStarted && t.status === 'pending_request' && t.lastMessagePreview && (
                          <span className="text-ink/40 not-italic">You: </span>
                        )}
                        {t.lastMessagePreview
                          ? t.lastMessagePreview
                          : isEmptyHire
                            ? '✓ New connection — say hello'
                            : 'No messages yet'}
                      </p>
                      {t.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold flex-shrink-0">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({
  tab,
  basePath,
  requestsCount,
}: {
  tab: 'conversations' | 'requests';
  basePath: '/client/messages' | '/cna/messages';
  requestsCount: number;
}) {
  const isClient = basePath === '/client/messages';

  if (tab === 'requests') {
    return (
      <div className="p-6">
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📥</div>
          <p className="text-sm font-medium mb-1">No new requests</p>
          <p className="text-xs text-ink/60 max-w-[14rem] mx-auto">
            {isClient
              ? 'Cold messages from new caregivers would land here. Right now caregivers don\u2019t cold-message families — they apply to your job posts instead.'
              : 'When a family messages you for the first time, you\u2019ll see it here. Reply to move the conversation into your main inbox.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-center py-6">
        <div className="text-3xl mb-2">💬</div>
        <p className="text-sm font-medium mb-1">No active conversations yet</p>
        <p className="text-xs text-ink/60 max-w-[14rem] mx-auto">
          {isClient
            ? 'Reach out to a caregiver from Browse, or message an applicant on one of your job posts.'
            : 'Conversations appear here once a family messages you and you reply.'}
        </p>
      </div>

      {requestsCount > 0 && (
        <div className="bg-mist/40 border border-ink/10 rounded-xl p-3 text-xs text-ink/70 leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-ink mb-1">
            <span>📥</span> You have {requestsCount} message{' '}
            {requestsCount === 1 ? 'request' : 'requests'}
          </div>
          Tap the <strong>Requests</strong> tab above to review them.
        </div>
      )}
    </div>
  );
}
