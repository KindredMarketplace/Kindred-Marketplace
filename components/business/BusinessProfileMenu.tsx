'use client';

/**
 * BusinessProfileMenu — the "Carla · Director of Nursing" dropdown in the
 * utility bar (ported from the mock's profile link). Client component because
 * it toggles open/closed and closes on outside-click. Sign-out is a server
 * action passed in from the layout.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function BusinessProfileMenu({
  name,
  roleLabel,
  email,
  initials,
  avatarClass,
  logoutAction,
}: {
  name: string;
  roleLabel: string;
  email: string;
  initials: string;
  avatarClass: string;
  logoutAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:text-sage transition"
      >
        <span
          className={`w-6 h-6 rounded-full ${avatarClass} flex items-center justify-center text-cream font-medium text-[10px]`}
        >
          {initials}
        </span>
        <span className="font-medium">
          {name}
          {roleLabel ? <span className="opacity-70"> · {roleLabel}</span> : null}
        </span>
        <span className="opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-cream text-ink rounded-2xl shadow-2xl border border-ink/10 py-2 w-60 z-50">
          <div className="px-4 py-3 border-b border-ink/10">
            <div className="text-sm font-medium">{name}</div>
            {roleLabel && <div className="text-xs text-ink/60">{roleLabel}</div>}
            {email && <div className="text-xs text-ink/50 truncate mt-0.5">{email}</div>}
          </div>
          <Link href="/business/settings" className="block px-4 py-2 text-sm hover:bg-mist transition">
            Facility settings
          </Link>
          <Link href="/business/team" className="block px-4 py-2 text-sm hover:bg-mist transition">
            Team &amp; permissions
          </Link>
          <Link href="/business/invoices" className="block px-4 py-2 text-sm hover:bg-mist transition">
            Invoices &amp; billing
          </Link>
          <div className="border-t border-ink/10 my-1" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="block w-full text-left px-4 py-2 text-sm hover:bg-mist transition text-coral"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
