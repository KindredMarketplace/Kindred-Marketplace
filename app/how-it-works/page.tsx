/**
 * /how-it-works — ported from Front-End/Homepage/how-it-works.html.
 *
 * Two audiences (families / caregivers) in an interactive tab switcher.
 * In-home care only: facilities were removed from the product in Nov 2026.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HowItWorksTabs } from './HowItWorksTabs';

export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-24 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">How it works</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          No agency. No middlemen. <br />
          <span className="italic font-medium text-gradient">Just care, direct.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Kindred is built around one idea: families and caregivers do better when they connect
          directly. We make sure everyone here has cleared a high bar, then we get out of the way.
          The relationship is yours.
        </p>
      </section>

      {/* Interactive audience tabs */}
      <HowItWorksTabs />

      {/* FAQ TEASER */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-mist/60 to-creamdark/60 border border-ink/10 rounded-3xl p-8 lg:p-10 text-center">
          <h3 className="font-display text-3xl font-medium mb-3">Still have questions?</h3>
          <p className="text-ink/70 mb-6 max-w-2xl mx-auto">
            There&apos;s more detail on pricing and on what every caregiver has to show us, or you can
            just ask us directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className="bg-deepteal text-cream px-5 py-3 rounded-full text-sm hover:bg-inkdark transition">See pricing</Link>
            <Link href="/kindred-standard" className="bg-white border border-ink/15 px-5 py-3 rounded-full text-sm hover:bg-mist transition">The Kindred Standard</Link>
            <Link href="/contact" className="bg-white border border-ink/15 px-5 py-3 rounded-full text-sm hover:bg-mist transition">Contact us</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
