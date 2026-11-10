/**
 * Shared header for the admin pages: brand, section links, back link, log out.
 */

import Link from 'next/link';
import { logoutAction } from '../(auth)/actions';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/people', label: 'People' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/verifications', label: 'Documents' },
  { href: '/admin/leads', label: 'Leads' },
];

export function AdminHeader({ section, email }: { section: string; email?: string | null }) {
  return (
    <header className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-display text-xl whitespace-nowrap">
            Kindred <span className="text-stone-400">/ Admin</span>
          </Link>
          <span className="hidden sm:inline rounded-full bg-coral/30 px-3 py-0.5 text-xs font-medium text-coral">
            Staff only
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {email && <span className="hidden md:inline text-stone-400">{email}</span>}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-stone-700 px-3 py-1.5 text-stone-300 hover:bg-stone-800"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto text-sm">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`whitespace-nowrap px-3 py-2 border-b-2 ${
              section === s.label ? 'border-coral text-white' : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
        err ? 'border-coral/40 bg-coral/10 text-stone-800' : 'border-sage/50 bg-sage/15 text-stone-800'
      }`}
    >
      {err ?? ok}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active: 'bg-sage/25 text-stone-800',
    pending: 'bg-stone-100 text-stone-600',
    suspended: 'bg-coral/20 text-stone-800',
    deleted: 'bg-stone-200 text-stone-500',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls[status] ?? 'bg-stone-100'}`}>
      {status}
    </span>
  );
}
