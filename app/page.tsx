/**
 * Marketing landing page. Placeholder — fill in real copy per the
 * "Brand & Identity" + "Copy Revisions" tabs of the build tracker.
 *
 * Three-pane CTAs reflect the three-portal plan: client / CNA / business.
 */

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-kindred-gradient">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-white/90">
            Florida CNA Marketplace
          </p>
          <h1 className="font-display text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
            Compassionate care,
            <br />
            when you need it most.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            Connecting families with vetted, background-checked Certified Nursing
            Assistants across Florida. Hire directly, on your terms, with the
            trust and transparency you deserve.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup?role=client"
              className="rounded-full bg-white px-8 py-3 text-base font-semibold text-teal shadow-lg transition-transform hover:scale-105"
            >
              Find a Caregiver
            </Link>
            <Link
              href="/signup?role=cna"
              className="rounded-full border-2 border-white bg-transparent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Become a Caregiver
            </Link>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <Pillar
            tone="sage"
            title="For Families"
            body="Browse vetted CNAs in your area. Read reviews. Hire directly. We handle payments and paperwork — you focus on your loved one."
            href="/about/families"
          />
          <Pillar
            tone="teal"
            title="For Caregivers"
            body="Set your own rates. Pick your shifts. Get paid quickly. Keep more of what you earn. Build your reputation."
            href="/about/cnas"
          />
          <Pillar
            tone="sky"
            title="Become a CNA"
            body="Not certified yet? We'll connect you with trusted Florida training schools — and help you join Kindred when you're done."
            href="/become-a-cna"
          />
        </div>
      </section>

      {/* Quiet footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-stone-600">
          <p>© {new Date().getFullYear()} Kindred Marketplace. Built with care in Florida.</p>
        </div>
      </footer>
    </main>
  );
}

function Pillar({
  tone,
  title,
  body,
  href,
}: {
  tone: 'sage' | 'teal' | 'sky';
  title: string;
  body: string;
  href: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    sage: 'border-sage bg-sage/10 hover:bg-sage/15',
    teal: 'border-teal bg-teal/10 hover:bg-teal/15',
    sky: 'border-sky bg-sky/10 hover:bg-sky/15',
  };
  return (
    <Link
      href={href}
      className={`block rounded-2xl border-2 p-8 transition-colors ${toneClasses[tone]}`}
    >
      <h3 className="font-display text-2xl font-medium text-stone-900">{title}</h3>
      <p className="mt-3 text-stone-700">{body}</p>
      <p className="mt-6 text-sm font-semibold text-stone-900">Learn more →</p>
    </Link>
  );
}
