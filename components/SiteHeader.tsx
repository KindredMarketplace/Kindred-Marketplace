/**
 * SiteHeader — the public marketing header (top utility bar + main nav).
 *
 * Used on all logged-out marketing pages. Real links: /apply, /login, /signup,
 * /contact, /privacy, /terms, /hipaa already exist; the rest (/browse,
 * /become-a-cna, /how-it-works, /post-job, /pricing, /insurance-billing) are
 * being built page by page.
 *
 * No fabricated stats — honest service-area line instead of a made-up count.
 */

import Link from 'next/link';
import { KindredWordmark } from '@/components/KindredMark';

export function SiteHeader() {
  return (
    <>
      {/* Top utility bar */}
      <div className="bg-inkdark text-cream text-xs">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono">📍 Gainesville, FL</span>
            <span className="opacity-50 hidden md:inline">·</span>
            <span className="hidden md:inline opacity-80">
              Launching in Gainesville, Florida
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/browse" className="hover:text-sage transition hidden sm:inline">For families</Link>
            <Link href="/apply" className="hover:text-sage transition hidden sm:inline">For caregivers</Link>
            <Link href="/contact" className="hover:text-sage transition">Help</Link>
            <Link href="/login" className="font-medium hover:text-sage transition">Log in</Link>
            <Link
              href="/signup"
              className="bg-coral text-cream px-3 py-1 rounded-full hover:bg-cream hover:text-coral transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <KindredWordmark height={34} />
          </Link>

          {/* Inline search (routes to Browse) */}
          <form
            action="/browse"
            className="hidden xl:flex flex-1 min-w-0 max-w-2xl items-center bg-white border border-ink/15 rounded-full overflow-hidden focus-within:border-teal focus-within:shadow-md transition"
          >
            <input
              name="q"
              type="text"
              placeholder="Try 'overnight dementia care' or 'bilingual CNA'"
              className="flex-1 min-w-0 px-5 py-3 text-sm bg-transparent focus:outline-none"
            />
            <div className="h-6 w-px bg-ink/15" />
            <input
              name="zip"
              type="text"
              placeholder="📍 ZIP or city"
              className="w-32 shrink-0 px-4 py-3 text-sm bg-transparent focus:outline-none"
            />
            <button className="shrink-0 bg-deepteal text-cream px-5 py-2.5 m-1 rounded-full text-sm font-medium hover:bg-inkdark transition">
              Search
            </button>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex shrink-0 items-center gap-1">
            <Link href="/browse" className="px-3 py-2 text-sm hover:text-coral transition">Browse</Link>
            <Link href="/apply" className="px-3 py-2 text-sm hover:text-coral transition">Apply now</Link>
            <Link href="/how-it-works" className="px-3 py-2 text-sm hover:text-coral transition">How it works</Link>
            <Link href="/kindred-standard" className="px-3 py-2 text-sm hover:text-coral transition">Our standard</Link>
            <Link href="/pricing" className="px-3 py-2 text-sm hover:text-coral transition">Pricing</Link>
            <Link
              href="/signup"
              className="ml-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-coral transition inline-block"
            >
              Get started
            </Link>
          </nav>

          {/* Mobile menu (no-JS, uses <details>) */}
          <details className="lg:hidden relative">
            <summary className="list-none cursor-pointer w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-ink/10 shadow-xl p-2 z-50">
              <Link href="/browse" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">Browse caregivers</Link>
              <Link href="/apply" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">Apply now</Link>
              <Link href="/how-it-works" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">How it works</Link>
              <Link href="/kindred-standard" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">Our standard</Link>
              <Link href="/pricing" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">Pricing</Link>
              <div className="h-px bg-ink/10 my-2" />
              <Link href="/login" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist">Log in</Link>
              <Link href="/signup" className="block px-4 py-2.5 text-sm rounded-lg hover:bg-mist font-medium text-coral">Sign up</Link>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
