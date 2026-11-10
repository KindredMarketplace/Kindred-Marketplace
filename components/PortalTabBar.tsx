'use client';

/**
 * PortalTabBar — the app-style bottom navigation for the caregiver and family
 * portals on phones and tablets (below lg). Desktop keeps the top nav.
 *
 *   - 5 slots; the middle one is the main action, raised.
 *   - The current section is highlighted; Messages shows the unread count;
 *     a coral dot means "something here needs you".
 *   - The last tab, "Me", opens a sheet with everything else (profile,
 *     credentials, membership, settings, help, log out).
 *   - Slides away while scrolling down and comes back on any scroll up, so
 *     it never sits on top of what someone is reading.
 *   - Sits above the iPhone home indicator (safe-area inset).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type TabIcon = 'home' | 'chat' | 'search' | 'calendar' | 'heart' | 'user' | 'briefcase';

export type PortalTab = {
  href: string;
  label: string;
  icon: TabIcon;
  badge?: number;
  dot?: boolean;
  center?: boolean;
  /** Extra path prefixes that count as "this tab". */
  match?: string[];
};

export type SheetLink = { href: string; label: string; emoji: string; badge?: number; dot?: boolean; accent?: boolean };

export type MeSheet = {
  name: string;
  subtitle?: string | null;
  photoUrl?: string | null;
  initials: string;
  avatarClass: string;
  links: SheetLink[];
  logoutAction?: () => Promise<void>;
};

function Icon({ name, filled }: { name: TabIcon; filled?: boolean }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: filled ? 2.2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.2A8 8 0 1 1 21 12Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5C19 15.6 12 20 12 20Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} />
        </svg>
      );
    case 'user':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
  }
}

function Count({ n }: { n: number }) {
  return (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-cream">
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function PortalTabBar({ tabs, me }: { tabs: PortalTab[]; me: MeSheet }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Close the sheet on navigation; show the bar again on a new page.
  useEffect(() => {
    setSheet(false);
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
        if (y < 80 || nearBottom) setHidden(false);
        else if (y > lastY.current + 6) setHidden(true);
        else if (y < lastY.current - 6) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const isOn = (t: PortalTab) =>
    [t.href.split('?')[0], ...(t.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'));
  const meOn = !tabs.some(isOn) && me.links.some((l) => pathname === l.href.split('?')[0] || pathname.startsWith(l.href.split('?')[0] + '/'));
  const meDot = me.links.some((l) => l.dot || (l.badge ?? 0) > 0);

  return (
    <>
      <nav
        aria-label="Main"
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${
          hidden && !sheet ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="bg-cream/95 backdrop-blur-md border-t border-ink/10 shadow-[0_-6px_20px_rgba(20,38,41,0.06)] pb-[env(safe-area-inset-bottom)]">
          <ul className="grid grid-cols-5 max-w-lg mx-auto">
            {tabs.map((t) => {
              const on = isOn(t);
              if (t.center) {
                return (
                  <li key={t.href} className="flex justify-center">
                    <Link
                      href={t.href}
                      aria-current={on ? 'page' : undefined}
                      className="-mt-5 flex flex-col items-center gap-1"
                    >
                      <span
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 ring-cream transition ${
                          on ? 'bg-coral text-cream' : 'bg-deepteal text-cream'
                        }`}
                      >
                        <Icon name={t.icon} filled />
                      </span>
                      <span className={`text-[11px] leading-none ${on ? 'text-deepteal font-semibold' : 'text-ink/70'}`}>{t.label}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={on ? 'page' : undefined}
                    className={`relative flex flex-col items-center justify-center gap-1 h-16 ${on ? 'text-deepteal' : 'text-ink/55'}`}
                  >
                    <span className="relative">
                      <Icon name={t.icon} filled={on} />
                      {!!t.badge && <Count n={t.badge} />}
                      {!t.badge && t.dot && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-cream" />}
                    </span>
                    <span className={`text-[11px] leading-none ${on ? 'font-semibold' : ''}`}>{t.label}</span>
                    {on && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-deepteal" />}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setSheet(true)}
                aria-expanded={sheet}
                aria-haspopup="dialog"
                className={`relative w-full flex flex-col items-center justify-center gap-1 h-16 ${meOn || sheet ? 'text-deepteal' : 'text-ink/55'}`}
              >
                <span className="relative">
                  {me.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={me.photoUrl}
                      alt=""
                      className={`w-6 h-6 rounded-full object-cover ${meOn || sheet ? 'ring-2 ring-deepteal' : ''}`}
                    />
                  ) : (
                    <span
                      className={`w-6 h-6 rounded-full ${me.avatarClass} text-cream text-[10px] font-medium flex items-center justify-center ${
                        meOn || sheet ? 'ring-2 ring-deepteal' : ''
                      }`}
                    >
                      {me.initials}
                    </span>
                  )}
                  {meDot && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-cream" />}
                </span>
                <span className={`text-[11px] leading-none ${meOn || sheet ? 'font-semibold' : ''}`}>Me</span>
                {meOn && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-deepteal" />}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {sheet && (
        <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Your account">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-inkdark/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-cream rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))] sheet-up">
            <div className="mx-auto mt-2.5 mb-3 w-10 h-1.5 rounded-full bg-ink/15" />
            <div className="px-5 pb-4 flex items-center gap-3 border-b border-ink/10">
              {me.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.photoUrl} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <span className={`w-12 h-12 rounded-2xl ${me.avatarClass} text-cream font-display text-lg flex items-center justify-center`}>
                  {me.initials}
                </span>
              )}
              <div className="min-w-0">
                <div className="font-display text-xl font-medium truncate">{me.name}</div>
                {me.subtitle && <div className="text-xs text-ink/60 truncate">{me.subtitle}</div>}
              </div>
            </div>
            <ul className="p-2">
              {me.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-mist ${l.accent ? 'text-coral font-medium' : ''}`}
                  >
                    <span className="w-6 text-center text-lg" aria-hidden="true">{l.emoji}</span>
                    <span className="flex-1">{l.label}</span>
                    {!!l.badge && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-coral text-cream text-[11px] font-mono font-bold flex items-center justify-center">
                        {l.badge}
                      </span>
                    )}
                    {!l.badge && l.dot && <span className="w-2.5 h-2.5 rounded-full bg-coral" aria-label="needs attention" />}
                    <span className="text-ink/30" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
            {me.logoutAction && (
              <form action={me.logoutAction} className="px-4 pt-1">
                <button type="submit" className="w-full rounded-full border border-ink/15 py-3 text-sm hover:bg-mist">
                  Log out
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
