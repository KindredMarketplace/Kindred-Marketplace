/**
 * /about — ported from Front-End/Homepage/about.html, made honest:
 *   - removed the fictional founder backstory (siblings "Nick & Ana Alemán",
 *     grandmother "Lola"), the four fabricated team members, and the fake
 *     metrics (1,847 CNAs / 312 families / 5 cities).
 *   - KEPT the values — they're genuinely Kindred's — with the two that implied
 *     an operating history reframed as commitments, and dignity added (the core
 *     brand value).
 *   - the founder's personal story is left as an honest, fill-in placeholder so
 *     it can be told in the founder's own words.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const VALUES: [string, string][] = [
  ['Caregivers keep what they charge.', 'Our service fee is paid by the family, on top — never taken out of the caregiver\u2019s rate. This is non-negotiable, even when it would make our economics easier.'],
  ['Families and caregivers choose each other.', 'No algorithmic forced matches, no paying for placement. The relationship is the product — we just make the introduction safe.'],
  ['Verification, not surveillance.', 'We vet thoroughly because families need confidence. We don\u2019t track caregivers between shifts or mine their lives off the clock.'],
  ['Honest pricing, no surprise fees.', 'You\u2019ll see the all-in cost before you book. If anything ever changes, you\u2019ll see the change clearly — never buried in a quiet email.'],
  ['Caregivers come first in a conflict.', 'If a family mistreats a caregiver, we side with the caregiver. That\u2019s a commitment we intend to honor even when it costs us a paying customer.'],
  ['Dignity, always.', 'The people receiving care are adults with histories, preferences, and pride. We will never build anything that infantilizes them. This is the heart of Kindred.'],
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-24 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">About Kindred</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-6">
          We&apos;re building the care system{' '}
          <span className="italic font-medium text-gradient">we wish our families had.</span>
        </h1>
        <p className="text-xl text-ink/75 max-w-3xl leading-relaxed">
          Kindred connects Florida families directly with vetted, independent CNAs — no agency in the
          middle taking the bigger half. Caregivers set their own rates and keep what they charge.
          Families find someone they actually trust. That&apos;s the whole idea.
        </p>
      </section>

      {/* STORY (honest placeholder — to be told in the founder's own words) */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">The why</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-6">Why we started this</h2>
          <div className="space-y-5 text-ink/80 leading-relaxed">
            <p>
              Kindred is founder-led, built by someone who has done this work — and saw, up close, how
              the system treats the people doing the caring. Skilled caregivers paid a fraction of
              what families are charged. Agencies taking the cream off the top. Good people leaving a
              field that needs them.
            </p>
            <p>
              We think the people doing some of the most important work in healthcare deserve to be
              paid like the professionals they are — and that families deserve to find them without a
              middleman in the way.
            </p>
            <p className="text-sm text-ink/55 italic">
              (The founder&apos;s full story goes here, in their own words — coming soon.)
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">What we believe</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-10">The lines we won&apos;t cross</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {VALUES.map(([title, body]) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="font-display text-xl font-medium mb-2">{title}</div>
              <p className="text-sm text-ink/75 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHERE WE ARE (honest, no fabricated metrics) */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Where we are today</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-6">Early, and on purpose</h2>
          <p className="text-ink/75 leading-relaxed max-w-2xl mb-8">
            We&apos;re a small founding team, starting in Gainesville and the surrounding North Central
            Florida counties. Right now we&apos;re vetting our founding caregivers — one real interview
            at a time — and getting the fundamentals right before we grow. Florida-first, carefully,
            for as long as it takes to do this well.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              ['Gainesville', 'Where we\u2019re starting'],
              ['Founding caregivers', 'Being vetted now'],
              ['Florida-first', 'Then state by state, slowly'],
            ].map(([big, small]) => (
              <div key={big} className="bg-white border border-ink/10 rounded-2xl p-5">
                <div className="font-display text-2xl font-medium">{big}</div>
                <div className="text-xs text-ink/60 font-mono uppercase tracking-widest mt-1">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-[900px] mx-auto px-6">
        <h3 className="font-display text-3xl md:text-4xl font-light mb-3">Want to be part of this?</h3>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/apply" className="bg-coral text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Apply as a CNA</Link>
          <Link href="/browse" className="bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Find a caregiver</Link>
          <Link href="/careers" className="bg-white border border-ink/15 px-6 py-3 rounded-full text-sm hover:bg-mist transition">Join the team</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
