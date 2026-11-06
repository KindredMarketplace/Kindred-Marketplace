/**
 * /caregiver-resources — ported from Front-End/Homepage/caregiver-resources.html, honest.
 *
 * The mock had a featured guide, nine full articles with fabricated authors
 * (Imani M., Marisol R., etc.), and eight downloadable toolkits — none of which
 * exist. This is the honest version: the hub concept and the topics we intend to
 * cover, with a clear "being written" state instead of fake content or fake
 * downloads and fake bylines.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const TOPICS: [string, string][] = [
  ['New to Kindred', 'Setting up a profile that books, writing a strong first message, what to expect on a first shift.'],
  ['Clinical skills', 'Safe transfers and body mechanics, vitals, and the practical things that protect you and your client.'],
  ['Dementia care', 'Sundowning, communication when memory fades, and small environmental changes that help.'],
  ['Self-care & burnout', 'Caregiving burnout is a slow leak — how experienced CNAs stay in the work for the long haul.'],
  ['The business of caregiving', 'Setting your rate, raising it well, and building a practice you own.'],
  ['Taxes & 1099 money', 'Self-employment tax, deductions, and health insurance as an independent caregiver.'],
];

const TOOLKITS = [
  ['📋', 'Shift handoff template'],
  ['💊', 'Medication tracking log'],
  ['🚨', 'Emergency contact card'],
  ['📅', 'Care plan worksheet'],
  ['📝', 'Incident report template'],
  ['📊', 'Tax & mileage tracker'],
];

export default function CaregiverResourcesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Caregiver resources</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Everything you need to <span className="italic font-medium text-gradient">do this well.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Articles, guides, and toolkits — written by experienced caregivers, for caregivers.
          We&apos;re building this library now, and we&apos;d rather it be real than rushed.
        </p>
      </section>

      {/* Being written — honest */}
      <section className="max-w-[1100px] mx-auto px-6 pb-12">
        <div className="bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-8 lg:p-10 text-center">
          <div className="inline-flex bg-cream/20 border border-cream/30 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-widest mb-4">
            In progress
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-light leading-tight mb-3">The library is being written.</h2>
          <p className="text-cream/90 leading-relaxed max-w-2xl mx-auto">
            The first guides are coming from real, experienced caregivers — not stock filler with
            invented bylines. When they&apos;re ready, they&apos;ll appear here.
          </p>
        </div>
      </section>

      {/* What we'll cover (honest topic roadmap) */}
      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">What we&apos;ll cover</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">The topics on the way</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICS.map(([title, body]) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <h3 className="font-display text-xl font-medium leading-snug mb-2">{title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Toolkits — honest "coming" */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Free toolkits</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-3">
            Print-ready resources for <span className="italic font-medium">real shifts</span>
          </h2>
          <p className="text-sm text-ink/60 mb-8">Coming soon — practical templates you&apos;ll actually use on the job.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLKITS.map(([icon, title]) => (
              <div key={title} className="bg-white border border-ink/10 rounded-2xl p-5 flex items-center gap-3">
                <div className="text-2xl">{icon}</div>
                <div>
                  <div className="font-display text-base font-medium">{title}</div>
                  <p className="text-xs text-ink/50 font-mono uppercase tracking-wider">Coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-[900px] mx-auto px-6">
        <h3 className="font-display text-3xl md:text-4xl font-light mb-3">Want these in your inbox first?</h3>
        <p className="text-ink/70 mb-6">Join Kindred as a caregiver and you&apos;ll get them as they&apos;re published.</p>
        <Link href="/apply" className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Apply now →</Link>
      </section>

      <SiteFooter />
    </div>
  );
}
