/**
 * LegalShell — shared header + footer wrapper for standalone public pages
 * (privacy, terms, hipaa, contact).
 *
 * It's a server component so it can check the session and figure out where the
 * logo should point:
 *   - Logged-in client   → /client/dashboard
 *   - Logged-in CNA      → /cna/dashboard
 *   - Logged-in business → /business/dashboard
 *   - Logged-in admin    → /admin
 *   - Logged-out visitor → /  (marketing home)
 *
 * This fixes the "logo strands me on the marketing page" bug: a logged-in user
 * reading the privacy page can always click the logo to get back to their
 * dashboard. The footer is the same shared <SiteFooter/> used everywhere.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KindredMark } from '@/components/KindredMark';
import { SiteFooter } from '@/components/SiteFooter';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  client: '/client/dashboard',
  cna: '/cna/dashboard',
  business: '/business/dashboard',
  admin: '/admin',
};

export async function LegalShell({
  current,
  children,
}: {
  current: 'privacy' | 'terms' | 'hipaa' | 'contact';
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let homeHref = '/';
  let contactHref = '/contact';
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role ?? 'client';
    homeHref = DASHBOARD_BY_ROLE[role] ?? '/';
    // Logged-in users get their in-portal help page for "Contact support".
    if (role === 'client') contactHref = '/client/help';
    else if (role === 'cna') contactHref = '/cna/help';
    else if (role === 'business') contactHref = '/business/help';
  }

  const links = [
    { href: '/privacy', label: 'Privacy', key: 'privacy' },
    { href: '/terms', label: 'Terms', key: 'terms' },
    { href: '/hipaa', label: 'HIPAA', key: 'hipaa' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* HEADER — logo points to dashboard when logged in, home when not */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-kindred mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2.5">
            <KindredMark size={40} />
            <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={
                  l.key === current
                    ? 'text-ink font-medium'
                    : 'text-ink/50 hover:text-ink transition'
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* PAGE CONTENT */}
      {children}

      {/* FOOTER — shared, single source of truth */}
      <SiteFooter contactHref={contactHref} />
    </div>
  );
}
