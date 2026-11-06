'use client';

/**
 * PresencePinger — drops into the portal layout and pings the server every
 * 60 seconds so the user is considered "online" in other people's inboxes.
 *
 * Pauses when the tab is hidden (visibilitychange) so we don't burn writes
 * on background tabs. Resumes on focus.
 *
 * Renders nothing.
 */

import { useEffect, useRef } from 'react';
import { pingPresenceAction } from '@/app/messages/presence-actions';

const PING_INTERVAL_MS = 60_000;

export function PresencePinger() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function startPinging() {
      // Fire immediately on (re)start, then on the interval.
      void pingPresenceAction();
      stopPinging();
      timerRef.current = setInterval(() => {
        void pingPresenceAction();
      }, PING_INTERVAL_MS);
    }

    function stopPinging() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        startPinging();
      } else {
        stopPinging();
      }
    }

    if (document.visibilityState === 'visible') {
      startPinging();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopPinging();
    };
  }, []);

  return null;
}
