'use client';

/**
 * Business (facility) portal navigation links. Client component so it can
 * highlight the active route via usePathname(). Matches the mock's nav exactly:
 * Dashboard · Shifts · Roster · Schedule · Timesheets · Invoices · Reports · Team
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/business/dashboard', label: 'Dashboard' },
  { href: '/business/post-shifts', label: 'Shifts' },
  { href: '/business/roster', label: 'Roster' },
  { href: '/business/schedule', label: 'Schedule' },
  { href: '/business/timesheets', label: 'Timesheets' },
  { href: '/business/invoices', label: 'Invoices' },
  { href: '/business/reports', label: 'Reports' },
  { href: '/business/team', label: 'Team' },
];

export function BusinessNavLinks() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            isActive(link.href)
              ? 'px-3 py-2 text-sm nav-active'
              : 'px-3 py-2 text-sm hover:text-coral transition'
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
