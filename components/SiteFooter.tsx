/**
 * SiteFooter — the full public marketing footer (Families / Caregivers /
 * Company columns + newsletter). Used on all logged-out marketing pages.
 *
 * This is the real footer ported from KindredHomepage.html. Links point to
 * their intended routes; several destination pages are still being built.
 */

import Link from 'next/link';
import { KindredMark } from '@/components/KindredMark';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'For Families',
    links: [
      { label: 'Find care', href: '/browse' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'The Kindred Standard', href: '/kindred-standard' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Questions families ask', href: '/faq' },
    ],
  },
  {
    heading: 'For Caregivers',
    links: [
      { label: 'Apply now', href: '/apply' },
      { label: 'The Kindred Standard', href: '/kindred-standard' },
      { label: 'Caregiver resources', href: '/caregiver-resources' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
      { label: 'Trust & safety', href: '/trust-safety' },
    ],
  },
];

export function SiteFooter(_props: {
  contactHref?: string;
  contactLabel?: string;
  hipaaLabel?: string;
  suffix?: string;
  maxWidth?: string;
} = {}) {
  return (
    <footer className="bg-inkdark text-cream/80 pt-20 pb-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 pb-12 border-b border-cream/10">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <KindredMark size={36} />
              <span className="font-display text-2xl text-cream font-medium">Kindred</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              A better way to connect. Families and independent home caregivers, directly, with
              no agency in the middle.
            </p>
            <div className="flex gap-3">
              {['in', 'f', 'ig'].map((s) => (
                <span
                  key={s}
                  className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading} className="md:col-span-2">
              <h4 className="text-cream font-medium mb-4 text-sm">{col.heading}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-cream transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="md:col-span-2">
            <h4 className="text-cream font-medium mb-4 text-sm">Stay in touch</h4>
            <p className="text-xs mb-3">Caregiving tips, updates, and stories — to your inbox.</p>
            <form className="flex">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 bg-cream/10 px-3 py-2 rounded-l-full text-xs focus:outline-none border border-cream/20 border-r-0 min-w-0"
              />
              <button className="bg-coral text-cream px-4 rounded-r-full text-xs hover:bg-cream hover:text-coral transition">
                →
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/50">
          <div>© {new Date().getFullYear()} Kindred Marketplace LLC · Florida</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-cream transition">Privacy</Link>
            <Link href="/terms" className="hover:text-cream transition">Terms</Link>
            <Link href="/hipaa" className="hover:text-cream transition">HIPAA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
