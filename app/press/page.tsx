/**
 * /press — ported from Front-End/Homepage/press.html, made honest.
 *
 * The mock invented six news articles, six press releases (SOC 2, Miami
 * expansion, "Pathway graduates 100"), metrics ($24M paid, 1,847 CNAs), and
 * boilerplate claiming SOC 2 + AHCA-registered + profitable. All removed. This
 * is an honest pre-coverage press page with a real contact channel and an
 * accurate, claim-free boilerplate.
 */

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const PRESS_EMAIL = 'kindredhhcmarketplace@gmail.com';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Press &amp; media</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Kindred for <span className="italic font-medium text-gradient">journalists.</span>
        </h1>
        <p className="text-lg text-ink/75 max-w-2xl leading-relaxed">
          For reporters and researchers covering home care, the senior caregiving labor market, or
          healthcare marketplaces. We&apos;re an early-stage company — so rather than dress up a press
          page with coverage we don&apos;t have yet, here&apos;s the honest version and a direct line
          to us.
        </p>
      </section>

      {/* No coverage yet — honest */}
      <section className="max-w-[1100px] mx-auto px-6 pb-12">
        <div className="bg-white border border-ink/10 rounded-3xl p-8 md:p-10 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">We&apos;re just getting started.</h2>
          <p className="text-ink/70 leading-relaxed max-w-xl mx-auto">
            There&apos;s no press coverage or media kit to show yet — and we&apos;d rather say that
            plainly than invent a clippings page. As real coverage happens, it&apos;ll live here.
          </p>
        </div>
      </section>

      {/* Boilerplate — accurate, claim-free */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Boilerplate</div>
          <h2 className="font-display text-3xl font-light mb-6">About Kindred</h2>
          <div className="bg-white border border-ink/10 rounded-2xl p-7 text-sm leading-relaxed text-ink/85">
            <p>
              Kindred is a Florida-based marketplace that connects families directly with vetted,
              independent Certified Nursing Assistants — without a staffing agency in between.
              Caregivers set their own rates and keep what they charge; Kindred&apos;s service fee is
              paid separately by families. Every caregiver completes a real interview and full
              verification before appearing on the platform. Founded in 2025 and based in Gainesville,
              Kindred is early-stage and Florida-first.
            </p>
          </div>
        </div>
      </section>

      {/* Press contact */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="bg-white border border-ink/10 rounded-2xl p-7 max-w-xl">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Press contact</div>
          <h3 className="font-display text-2xl font-medium mb-3">Talk to us</h3>
          <p className="text-sm text-ink/75 leading-relaxed mb-5">
            For interviews, fact-checking, or background on the independent-caregiver model, reach out
            directly — a real person will respond.
          </p>
          <a href={`mailto:${PRESS_EMAIL}?subject=Press inquiry`} className="text-deepteal hover:text-coral break-all">
            ✉ {PRESS_EMAIL}
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
