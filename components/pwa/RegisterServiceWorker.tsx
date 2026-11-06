'use client';

import { useEffect } from 'react';

/** Registers /sw.js in production so Kindred can be installed as an app. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Non-fatal: the site works fine without it.
    });
  }, []);
  return null;
}
