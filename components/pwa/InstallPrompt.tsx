'use client';

/**
 * InstallPrompt — a small, dismissible "Add Kindred to your home screen" card.
 *
 * - Android / desktop Chrome: uses the native beforeinstallprompt event.
 * - iOS Safari: there is no install event, so we show the Share → Add to
 *   Home Screen hint instead.
 * - Hidden when already installed (display-mode: standalone) or dismissed.
 */

import { useEffect, useState } from 'react';
import { KindredMark } from '@/components/KindredMark';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = 'kindred_install_dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || readDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIos) {
      setShowIos(true);
      setHidden(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode: just hide for this visit */
    }
    setHidden(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Kindred"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] z-[60] bg-white border border-ink/10 rounded-2xl shadow-xl p-4 flex gap-3 items-start"
    >
      <KindredMark size={40} className="rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">Get the Kindred app</div>
        {showIos && !deferred ? (
          <p className="text-xs text-ink/65 mt-1 leading-relaxed">
            Tap <span className="font-semibold">Share</span>, then{' '}
            <span className="font-semibold">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-xs text-ink/65 mt-1 leading-relaxed">
            Messages and jobs, one tap from your home screen.
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {deferred && (
            <button
              type="button"
              onClick={install}
              className="bg-ink text-cream text-xs font-medium rounded-full px-4 py-2 hover:bg-deepteal transition"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-ink/60 rounded-full px-3 py-2 hover:bg-mist transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
