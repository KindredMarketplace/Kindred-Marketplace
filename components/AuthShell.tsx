/** The simple header + centered card + footer used by the password pages. */

import Link from 'next/link';
import { KindredWordmark } from '@/components/KindredMark';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 py-5 border-b border-ink/10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <KindredWordmark height={34} />
        </Link>
        <Link href="/login" className="text-sm text-deepteal font-medium hover:text-coral whitespace-nowrap">
          Log in →
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-6 py-5 text-center text-xs text-ink/40">
        <Link href="/terms" className="hover:text-ink/70 underline">Terms</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-ink/70 underline">Privacy</Link>
        {' · '}
        <span>© 2026 Kindred Marketplace LLC</span>
      </footer>
    </div>
  );
}

export const authInput =
  'w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20';
export const authButton =
  'w-full rounded-xl bg-deepteal px-4 py-2.5 font-medium text-cream shadow-sm transition hover:bg-deepteal/90 focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-60';
