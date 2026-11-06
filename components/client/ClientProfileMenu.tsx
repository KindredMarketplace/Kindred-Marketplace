'use client';

/**
 * ClientProfileMenu — the "Sarah ▾" dropdown in the utility bar (ported from
 * the mock's profile-menu). Client component because it toggles open/closed
 * and closes on outside-click. The actual sign-out is a server action passed
 * in from the layout as `logoutAction` (rendered as a <form>).
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function ClientProfileMenu({
  firstName,
  fullName,
  email,
  initials,
  avatarClass,
  logoutAction,
}: {
  firstName: string;
  fullName: string;
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
        <span className="font-medium">{firstName}</span>
        <span className="opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-cream text-ink rounded-2xl shadow-2xl border border-ink/10 py-2 w-56 z-50">
          <div className="px-4 py-3 border-b border-ink/10">
            <div className="text-sm font-medium">{fullName}</div>
            <div className="text-xs text-ink/60 truncate">{email}</div>
          </div>
          <Link href="/client/account" className="block px-4 py-2 text-sm hover:bg-mist transition">
            Account settings
          </Link>
          <Link href="/client/profile" className="block px-4 py-2 text-sm hover:bg-mist transition">
            My profile
          </Link>
          <Link href="/client/my-care" className="block px-4 py-2 text-sm hover:bg-mist transition">
            My care plan
          </Link>
          <Link href="/client/membership" className="block px-4 py-2 text-sm hover:bg-mist transition">
            Membership
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
