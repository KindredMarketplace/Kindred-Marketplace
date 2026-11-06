/**
 * /pricing — ported from Front-End/Homepage/pricing.html, made honest.
 *
 * The fee model is an OPEN decision (tracker Q2), so the mock's hard numbers
 * (12% / 9% service fees, the $716.80 worked example, "$48–62/hr vs agency",
 * the caregiver take-home tables, "direct deposit within 24h", GPS Sunday
 * charge, SOC 2 + HIPAA + AHCA) are all removed. This page commits only to the
 * pricing PRINCIPLES that are actually decided:
 *   - caregivers set their own rate and keep 100% of it;
 *   - the service fee is paid by the family, on top — never taken from the CNA;
 *   - the all-in price is always shown before you book;
 *   - the exact fee is being finalized before launch.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Pricing</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Honest, <span className="italic font-medium text-gradient">no-surprise pricing.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Caregivers set their own hourly rate. Families pay a small service fee on top — for
          vetting, secure payments, and support. You always see the all-in total before you book.
        </p>
      </section>

      {/* THE TWO SIDES */}
      <section className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white border border-ink/10 rounded-3xl p-7">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For families</div>
            <h2 className="font-display text-2xl font-medium mb-3">What you pay</h2>
            <p className="text-sm text-ink/75 leading-relaxed mb-4">
              You pay the caregiver&apos;s rate, plus a Kindred service fee on top. No subscription, no
              setup cost, and the full hourly total is shown before you ever confirm a booking.
            </p>
            <ul className="space-y-2.5 text-sm">
              {['Browse and message caregivers for free', 'Free meet-and-greets before you commit', 'Vetting and secure payments included in the fee', 'The all-in price shown up front — no surprises'].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-deepteal mt-0.5">✓</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-ink/10 rounded-3xl p-7">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For caregivers</div>
            <h2 className="font-display text-2xl font-medium mb-3">What you keep</h2>
            <p className="text-sm text-ink/75 leading-relaxed mb-4">
              You keep <strong className="text-deepteal">100% of the rate you set</strong>. The service
              fee is paid by the family, on top — it never comes out of your pocket. We don&apos;t take
              a cut of your rate.
            </p>
            <ul className="space-y-2.5 text-sm">
              {['Set your own hourly rate', 'Keep every dollar of it', 'Get paid promptly after each shift', 'A 1099 each January, with tax guidance'].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-deepteal mt-0.5">✓</span> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* STRUCTURE (conceptual, no fabricated numbers) */}
      <section className="bg-mist/40 py-16 mt-8">
        <div className="max-w-[760px] mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">How it adds up</div>
            <h2 className="font-display text-3xl md:text-4xl font-light">The whole structure, <span className="italic font-medium">in plain view</span></h2>
          </div>
          <div className="bg-white border border-ink/10 rounded-3xl p-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-ink/10">
                <span className="text-sm">The caregiver&apos;s hourly rate <span className="text-ink/50">(they keep all of it)</span></span>
                <span className="font-mono text-ink/40">rate</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-ink/10">
                <span className="text-sm">+ Kindred service fee <span className="text-ink/50">(paid by you, on top)</span></span>
                <span className="font-mono text-ink/40">fee</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-display text-lg font-medium">= Your all-in hourly cost</span>
                <span className="font-mono text-deepteal">shown before you book</span>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white border border-teal/30 rounded-2xl p-5 text-sm leading-relaxed text-ink/80">
            <strong>On the exact fee:</strong> we&apos;re finalizing our service fee before launch, so
            we&apos;re not going to publish a number we might change. Whatever it lands at, two things
            stay true — caregivers keep 100% of their rate, and you&apos;ll always see the full price
            before you pay a cent.
          </div>
        </div>
      </section>

      {/* FACILITIES */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="bg-white border border-ink/10 rounded-3xl p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For facilities</div>
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">Custom pricing, coming after launch</h2>
            <p className="text-sm text-ink/75 leading-relaxed max-w-xl">
              For assisted living, memory care, and skilled nursing, we&apos;ll offer volume pricing on
              a single monthly invoice once the facilities side opens. If you&apos;d like early access,
              we&apos;d love to talk.
            </p>
          </div>
          <Link href="/contact" className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition whitespace-nowrap">
            Talk to us →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="font-display text-3xl font-light text-center mb-10">Common questions</h2>
          <div className="space-y-3">
            <Faq q="How much is the service fee?">
              We&apos;re finalizing it before launch, so we won&apos;t quote a number we might change.
              What&apos;s fixed: it&apos;s paid by the family on top of the caregiver&apos;s rate, it&apos;s
              never taken from the caregiver, and you&apos;ll see the full all-in price before you book.
            </Faq>
            <Faq q="Is there a minimum number of hours?">
              No minimum. Some families book a single short visit; others arrange many hours a week.
              You arrange what you need with your caregiver.
            </Faq>
            <Faq q="Are caregivers employees of Kindred?">
              No — caregivers on Kindred are independent professionals (1099), not Kindred employees,
              and you&apos;re not their employer of record either. They set their own rates and choose
              their own clients.
            </Faq>
            <Faq q="Can I use long-term care insurance or VA benefits?">
              Most LTC policies reimburse for in-home CNA care, and some veterans qualify for help.
              Kindred is building tools to generate the documentation you&apos;d need to file.{' '}
              <Link href="/insurance-billing" className="text-deepteal underline">More on insurance &amp; billing →</Link>
            </Faq>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-[900px] mx-auto px-6">
        <h3 className="font-display text-3xl md:text-4xl font-light mb-3">Ready to start?</h3>
        <p className="text-ink/70 mb-6">Browsing is free, and you only need an account to message or book.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/browse" className="bg-coral text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Browse caregivers</Link>
          <Link href="/apply" className="bg-white border border-ink/15 px-6 py-3 rounded-full text-sm hover:bg-mist transition">Apply as a CNA</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="bg-white border border-ink/10 rounded-2xl p-5 group">
      <summary className="font-medium cursor-pointer flex items-center justify-between">
        {q}
        <span className="text-deepteal text-xl group-open:rotate-45 transition">+</span>
      </summary>
      <p className="text-sm text-ink/75 mt-3 leading-relaxed">{children}</p>
    </details>
  );
}
