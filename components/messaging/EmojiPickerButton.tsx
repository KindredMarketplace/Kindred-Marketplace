'use client';

/**
 * EmojiPickerButton — small button + popup that lets the user insert an
 * emoji into a textarea at the cursor position.
 *
 * Self-contained. Uses native emoji characters which all modern browsers
 * render — no images, no external font, no extra bundle size. About 120
 * common emojis organized in five tabs (Smileys / Hearts / Hands / Care /
 * Food). If we later want every emoji ever, swap to emoji-mart or similar.
 *
 * Accessibility: button has aria-label, popup is a dialog, focus returns
 * to the textarea after pick.
 */

import { useState, useRef, useEffect } from 'react';

const CATEGORIES: Array<{ label: string; emojis: string[] }> = [
  {
    label: 'Smileys',
    emojis: [
      '😀','😄','😁','😊','😇','🙂','😉','😍','🥰','😘','😗','😙','😚','😋','😜','🤪','😎','🤩','🥳','🤗','🤔','😐','😶','🙄','😏','😴','🤤','😪','😌','🤐','🤨','😑'
    ],
  },
  {
    label: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💖','💗','💓','💞','💕','💘','💝','💟','♥️'],
  },
  {
    label: 'Hands',
    emojis: ['👋','🤚','✋','🖐️','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏','🫶'],
  },
  {
    label: 'Care',
    emojis: ['🌿','🌱','🌸','🌼','🌷','🌺','💐','☀️','🌤️','⭐','✨','💫','🕊️','🤲','👨‍⚕️','👩‍⚕️','👵','👴','👶','🏥','🚑','💊','🩺','🛏️','🚶','👨‍👩‍👧','🐕','🐈','🏡','☕'],
  },
  {
    label: 'Food',
    emojis: ['🍎','🍞','🥐','🥪','🍳','🥞','🧇','🥗','🍲','🍜','🥣','🍵','☕','🥛','🧃','🍷','🍪','🎂','🍰','🥧','🍫','🍯','🥕','🥦','🍅','🍇','🍓','🍊','🍌','🍉'],
  },
];

export function EmojiPickerButton({
  onPick,
  buttonClassName,
  disabled = false,
}: {
  onPick: (emoji: string) => void;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Insert emoji"
        title="Insert emoji"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          'w-9 h-9 flex items-center justify-center text-ink/40 hover:text-deepteal hover:bg-mist rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed'
        }
      >
        😊
      </button>

      {open && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Emoji picker"
          className="absolute bottom-12 left-0 z-50 bg-white border border-ink/15 rounded-2xl shadow-2xl w-72 overflow-hidden"
        >
          {/* Category tabs */}
          <div className="flex items-center border-b border-ink/10 bg-creamdark/40">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCat(idx)}
                className={`flex-1 text-[10px] font-mono uppercase tracking-widest py-2 transition ${
                  activeCat === idx
                    ? 'text-deepteal border-b-2 border-deepteal -mb-px bg-white'
                    : 'text-ink/50 hover:text-ink border-b-2 border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-2 max-h-56 overflow-y-auto grid grid-cols-8 gap-1">
            {CATEGORIES[activeCat].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-mist rounded-md text-lg transition"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
