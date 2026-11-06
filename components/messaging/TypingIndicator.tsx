'use client';

/**
 * TypingIndicator — three-dot animated bubble that appears above the
 * composer when the other party is typing in this thread.
 *
 * Pulls state from ThreadLiveContext via the useThreadLive hook. Renders
 * nothing when otherIsTyping is false.
 */

import { useThreadLive } from './ThreadLiveChannel';

export function TypingIndicator({ otherName }: { otherName: string }) {
  const { otherIsTyping } = useThreadLive();
  if (!otherIsTyping) return null;

  return (
    <div className="px-6 pb-2 flex items-center gap-2 text-xs text-ink/60">
      <div className="flex items-end gap-1 bg-white border border-ink/10 rounded-2xl rounded-bl-sm px-3 py-2">
        <span className="typing-dot" />
        <span className="typing-dot" style={{ animationDelay: '120ms' }} />
        <span className="typing-dot" style={{ animationDelay: '240ms' }} />
      </div>
      <span className="italic">{otherName.split(' ')[0]} is typing…</span>
      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5BA9B8;
          animation: typingBob 1s infinite ease-in-out;
        }
        @keyframes typingBob {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
