'use client';

/**
 * CNA portal navigation links. Client component so it can highlight the
 * active route via usePathname(). Matches the mock's nav exactly:
 * Dashboard · Find jobs · My schedule · Messages · Membership · [Get insured] · Resources
 *
 * Phase C: renders a coral badge next to "Messages" when the caregiver has
 * unread messages. The count comes from the layout's server-side query at
 * page-load; real-time updates after that are driven by InboxRealtimeRefresh
 * which lives in the layout and triggers router.refresh() on changes.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PortalMobileMenu } from '@/components/PortalMobileMenu';

const LINKS = [
  { href: '/cna/dashboard', label: 'Dashboard' },
  { href: '/cna/jobs', label: 'Find jobs' },
  { href: '/cna/schedule', label: 'My schedule' },
  { href: '/cna/messages', label: 'Messages' },
  { href: '/cna/compliance', label: 'Credentials' },
  { href: '/cna/membership', label: 'Membership' },
];

export function CnaNavLinks({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="hidden xl:flex items-center gap-1">
      {LINKS.map((link) => {
        const active = isActive(link.href);
        const isMessages = link.href === '/cna/messages';
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'px-2 2xl:px-3 py-2 text-sm whitespace-nowrap nav-active inline-flex items-center gap-1.5'
                : 'px-2 2xl:px-3 py-2 text-sm whitespace-nowrap hover:text-coral transition inline-flex items-center gap-1.5'
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
      <Link
        href="/cna/get-insured"
        className="nav-insure whitespace-nowrap px-3 py-1.5 ml-1 rounded-full text-xs font-medium transition"
      >
        🛡️ Get insured
      </Link>
      <Link
        href="/cna/resources"
        className={
          isActive('/cna/resources')
            ? 'px-2 2xl:px-3 py-2 text-sm whitespace-nowrap nav-active'
            : 'px-2 2xl:px-3 py-2 text-sm whitespace-nowrap hover:text-coral transition'
        }
      >
        Resources
      </Link>
    </nav>
  );
}

/** Phone / small-screen version of the same links (☰ menu). */
export function CnaMobileMenu({
  unreadCount = 0,
  logoutAction,
}: {
  unreadCount?: number;
  logoutAction: () => Promise<void>;
}) {
  return (
    <PortalMobileMenu
      links={[
        ...LINKS.map((l) => ({ ...l, badge: l.href === '/cna/messages' ? unreadCount : undefined })),
        { href: '/cna/resources', label: 'Resources' },
        { href: '/cna/get-insured', label: '🛡️ Get insured', accent: true },
      ]}
      logoutAction={logoutAction}
    />
  );
}
