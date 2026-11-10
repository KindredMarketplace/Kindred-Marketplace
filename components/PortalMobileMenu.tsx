'use client';

/**
 * PortalMobileMenu — the ☰ menu for the caregiver and family portals on
 * phones and small laptops (below xl). The full link row only fits on wide
 * screens; below that the links live in this dropdown instead of wrapping
 * down the middle of the header.
 *
 * Closes itself when the route changes, on Escape, and on a tap outside.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type PortalLink = { href: string; label: string; badge?: number; accent?: boolean };

export function PortalMobileMenu({
  links,
  logoutAction,
}: {
  links: PortalLink[];
  logoutAction?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const totalBadge = links.reduce((n, l) => n + (l.badge ?? 0), 0);

  return (
    <div ref={ref} className="hidden lg:block xl:hidden relative">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center bg-white/60"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
        {!open && totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold flex items-center justify-center">
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 max-h-[75vh] overflow-y-auto bg-white rounded-2xl border border-ink/10 shadow-xl p-2 z-50">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg hover:bg-mist ${
                isActive(l.href) ? 'bg-mist font-medium text-deepteal' : l.accent ? 'text-coral font-medium' : ''
              }`}
            >
              {l.label}
              {!!l.badge && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold flex items-center justify-center">
                  {l.badge > 99 ? '99+' : l.badge}
                </span>
              )}
            </Link>
          ))}
          {logoutAction && (
            <>
              <div className="h-px bg-ink/10 my-2" />
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-mist">
                  Log out
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
