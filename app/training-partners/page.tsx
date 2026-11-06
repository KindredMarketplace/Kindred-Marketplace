/**
 * /training-partners — ported from Front-End/Homepage/training-partners.html, honest.
 *
 * The mock listed five fabricated partner schools (real college names, invented
 * addresses, cohort sizes, "since 2024", "100% job-match") and a "full tuition
 * paid up front / 100% graduate job-match" pitch tied to the Pathway free
 * bootcamp. No schools are signed, and training is Phase 2. So: the real
 * school-recruitment pitch stays (honestly, no guarantees), the fake partner
 * cards become an honest "none signed yet" state, and the Pathway CTA is gone.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default function TrainingPartnersPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Training partners</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Florida&apos;s CNA programs,{' '}
          <span className="italic font-medium text-gradient">working with Kindred.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          We&apos;re building partnerships with state-approved CNA programs across Florida — starting
          in the North Central region — so future caregivers can train at a good school and join
          Kindred once they&apos;re certified.
        </p>
      </section>

      {/* No partners signed yet — honest */}
      <section className="max-w-[1100px] mx-auto px-6 pb-12">
        <div className="bg-white border border-ink/10 rounded-3xl p-8 md:p-10 text-center">
          <div className="text-3xl mb-3">🌱</div>
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">Partner programs are coming.</h2>
          <p className="text-ink/70 leading-relaxed max-w-xl mx-auto">
            We&apos;re in early conversations with schools and haven&apos;t signed partners yet — so
            rather than list programs we don&apos;t have, we&apos;ll add each one here as it comes
            online. Check back soon.
          </p>
        </div>
      </section>

      {/* For training schools — honest pitch (no guarantees) */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For training schools</div>
            <h2 className="font-display text-3xl md:text-4xl font-light leading-tight mb-4">
              Run a CNA program? <span className="italic font-medium">Let&apos;s talk.</span>
            </h2>
            <p className="text-ink/75 leading-relaxed mb-4">
              We&apos;re looking for a small number of founding school partners in North Central
              Florida. The idea is simple: we send you motivated, qualified students, and we welcome
              your graduates onto Kindred once they pass the state exam.
            </p>
            <p className="text-ink/75 leading-relaxed mb-6">
              We&apos;re still designing exactly how the partnership works — which is the honest
              reason to reach out now and help shape it.
            </p>
            <Link href="/contact" className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">
              Become a founding partner →
            </Link>
          </div>
          <div className="bg-white border border-ink/10 rounded-3xl p-7">
            <div className="font-display text-lg font-medium mb-4">What we&apos;re offering partners</div>
            <ul className="space-y-3 text-sm">
              {[
                'A pipeline of motivated, pre-screened applicants',
                'A place for your graduates to work once certified',
                'Curriculum input aligned to real home-care work',
                'Co-marketing as a founding Kindred partner',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-deepteal mt-0.5">✓</span> {item}</li>
              ))}
            </ul>
            <p className="text-xs text-ink/55 mt-4">
              We&apos;ll describe specific terms here once they&apos;re real — no guarantees we
              can&apos;t back yet.
            </p>
          </div>
        </div>
      </section>

      {/* CTA — experienced CNAs apply now */}
      <section className="max-w-[900px] mx-auto px-6 py-16 text-center">
        <h3 className="font-display text-3xl md:text-4xl font-light mb-3">Already a certified CNA?</h3>
        <p className="text-ink/70 mb-6">You don&apos;t need a program — you can apply to Kindred today.</p>
        <Link href="/apply" className="inline-flex bg-coral text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Apply now →</Link>
      </section>

      <SiteFooter />
    </div>
  );
}
