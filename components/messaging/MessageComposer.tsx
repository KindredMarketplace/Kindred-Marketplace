'use client';

/**
 * MessageComposer — the textarea + send button at the bottom of a thread.
 *
 * Phase D polish:
 *   - Calls sendTyping() from the ThreadLiveContext on every keystroke (the
 *     hook itself debounces to fire at most once per 2s). Other side sees
 *     the typing dots within milliseconds.
 *   - Has an EmojiPickerButton next to attach. Picked emoji is inserted at
 *     the current cursor position (or appended if no selection), then the
 *     textarea is refocused.
 *
 * Keyboard: Enter sends, Shift+Enter inserts a newline. Standard chat UX.
 * On send: clears the textarea AND broadcasts a `stop_typing` event so the
 * other side's dots disappear instantly.
 */

import { useState, useTransition, useRef } from 'react';
import { sendMessageAction } from '@/app/messages/actions';
import { useThreadLive } from './ThreadLiveChannel';
import { EmojiPickerButton } from './EmojiPickerButton';

export function MessageComposer({
  threadId,
  recipientName,
  disabled = false,
  disabledReason,
}: {
  threadId: string;
  recipientName: string;
  /** True when the conversation is closed (declined/blocked) or otherwise locked. */
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { sendTyping } = useThreadLive();

  function submit() {
    if (!body.trim() || pending || disabled) return;
    setError(null);
    const fd = new FormData();
    fd.set('thread_id', threadId);
    fd.set('body', body.trim());
    startTransition(async () => {
      const res = await sendMessageAction(fd);
      if (res.ok) {
        setBody('');
      } else {
        setError(res.error);
      }
    });
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    // Restore caret position just after the inserted emoji on next tick.
    requestAnimationFrame(() => {
      el.focus();
      const newPos = start + emoji.length;
      el.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <div className="p-4 border-t border-ink/10 bg-cream">
      <div
        className={`flex items-end gap-2 bg-white border rounded-2xl p-2 ${
          disabled ? 'border-ink/10 opacity-60' : 'border-ink/15 focus-within:border-teal'
        }`}
      >
        <EmojiPickerButton onPick={insertEmoji} disabled={disabled || pending} />
        <button
          className="w-9 h-9 flex items-center justify-center text-ink/40"
          title="Attach (coming soon)"
          disabled
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            // Only broadcast typing when the user is adding content (not on
            // backspace-to-empty). The hook debounces, so calling on every
            // keystroke is cheap.
            if (e.target.value.length > 0 && !disabled) sendTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? disabledReason ?? 'This conversation is closed.' : `Message ${recipientName.split(' ')[0]}…`}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none max-h-32"
          disabled={disabled || pending}
        />
        <button
          onClick={submit}
          disabled={disabled || pending || !body.trim()}
          className="bg-deepteal text-cream w-10 h-10 rounded-full flex items-center justify-center hover:bg-inkdark transition disabled:bg-ink/30 disabled:hover:bg-ink/30"
          aria-label="Send"
        >
          →
        </button>
      </div>
      {error && (
        <div className="text-[11px] text-coral mt-2 px-2">{error}</div>
      )}
      <div className="text-[10px] text-ink/40 font-mono mt-2 px-2 flex items-center gap-2">
        <span>🔒</span>
        <span>Messages are encrypted. Only you and {recipientName.split(' ')[0]} can read them.</span>
      </div>
    </div>
  );
}
