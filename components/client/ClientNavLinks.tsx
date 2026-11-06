'use client';

/**
 * Client (family) portal navigation links. Client component so it can highlight
 * the active route via usePathname(). Matches the mock's nav exactly:
 * Dashboard · Browse · My care · Messages · My profile · Billing · Help
 *
 * Phase C: renders a coral badge next to "Messages" when the user has unread
 * messages. The count comes from the layout's server-side query at page-load
 * time; real-time updates after that are driven by InboxRealtimeRefresh on
 * the messages pages + the layout re-rendering on navigation.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/client/dashboard', label: 'Dashboard' },
  { href: '/client/browse', label: 'Browse' },
  { href: '/client/my-care', label: 'My care' },
  { href: '/client/messages', label: 'Messages' },
  { href: '/client/profile', label: 'My profile' },
  { href: '/client/billing', label: 'Billing' },
  { href: '/client/help', label: 'Help' },
];

export function ClientNavLinks({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {LINKS.map((link) => {
        const active = isActive(link.href);
        const isMessages = link.href === '/client/messages';
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'px-3 py-2 text-sm nav-active inline-flex items-center gap-1.5'
                : 'px-3 py-2 text-sm hover:text-coral transition inline-flex items-center gap-1.5'
            }
          >
            {link.label}
            {isMessages && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-mono font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
