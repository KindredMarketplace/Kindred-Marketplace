/**
 * /trust-safety — ported from Front-End/Homepage/trust-safety.html, made honest.
 *
 * KEPT (it's real): the verification process — re-sequenced interview-first to
 * match the pipeline we actually built (cheap human filter before expensive
 * checks).
 *
 * REMOVED (fabricated / flagged never-publish-until-real):
 *   - compliance badges + registry number (SOC 2, CARF, AHCA #NR300089, HIPAA);
 *   - insurance figures + underwriters ($2M Chubb, $25K bond);
 *   - GPS clock-in and "24/7 hotline · median 11 min";
 *   - the transparency stats (3,402 screened / 71% rejected / 11 removed).
 * These are reframed as honest commitments and "what we're building", with the
 * transparency intent kept but the invented numbers dropped.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const STEPS: [string, string][] = [
  [
    'Application + a real human interview',
    'Before we ever run an expensive check, every caregiver has a real conversation with our team — why caregiving, a hard moment with a client, how they\u2019d handle a tough situation. This is the gate. Most of the filtering happens here, with a person, not a form.',
  ],
  [
    'FL CNA license verification',
    'Cross-checked with the Florida Department of Health. Active and in good standing only — and monitored, so a lapsed license freezes new bookings.',
  ],
  [
    'FL Level 2 background check',
    'FDLE + FBI fingerprint screening through the AHCA Clearinghouse, with disqualifying offenses per Florida Statute 435.04 — including violent felonies, abuse, and financial crimes against the elderly.',
  ],
  [
    'Government ID verification',
    'A photo of a state ID matched to a live selfie, to confirm the person is who they say they are.',
  ],
  [
    'CPR / BLS certification',
    'A current American Heart Association or Red Cross card on file. If it expires, the account pauses.',
  ],
  [
    'TB clearance',
    'A current TB test or chest x-ray clearance.',
  ],
  [
    'Reference checks',
    'Two professional references contacted — for the hard questions about reliability, integrity, and judgment under pressure.',
  ],
];

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Trust &amp; safety</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Letting someone into your home takes{' '}
          <span className="italic font-medium text-gradient">trust.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Here&apos;s how we work to earn it — and what to do if something ever goes wrong. We&apos;ll
          always tell you what&apos;s real today and what we&apos;re still building.
        </p>
      </section>

      {/* VERIFICATION (real, interview-first) */}
      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">How we verify every caregiver</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">The approval process</h2>

        <div className="space-y-3">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-5 grid md:grid-cols-[60px_1fr] gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-teal text-cream flex items-center justify-center font-display text-lg">{i + 1}</div>
              <div>
                <div className="font-display text-lg font-medium">{title}</div>
                <p className="text-sm text-ink/75 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-mist/40 border border-ink/10 rounded-2xl p-5 text-sm leading-relaxed">
          <strong>Why this order matters:</strong> the human interview comes first, on purpose. The
          expensive checks only happen once a real person has decided a caregiver is worth moving
          forward with — a cheap, honest filter before anything else.
        </div>
      </section>

      {/* ACCOUNTABILITY (honest: real today vs building) */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">While care is happening</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-8">Keeping care accountable</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-deepteal mb-2">Today</div>
              <h3 className="font-display text-lg font-medium mb-2">Everything on the record</h3>
              <p className="text-sm text-ink/75 leading-relaxed">
                Messaging happens on-platform, so there&apos;s a clear record of arrangements. If
                anything feels off, you can reach a real person at Kindred and we&apos;ll look into it.
              </p>
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-coral mb-2">Building</div>
              <h3 className="font-display text-lg font-medium mb-2">Stronger on-shift protections</h3>
              <p className="text-sm text-ink/75 leading-relaxed">
                Verified clock-in and insurance-backed protections for active shifts are on our
                roadmap. When they&apos;re real and independently backed, we&apos;ll describe them here
                precisely — never with numbers we can&apos;t stand behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IF SOMETHING GOES WRONG (real routing) */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">If something goes wrong</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">What to do</h2>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-2">Urgent</div>
            <h3 className="font-display text-xl font-medium mb-2">Active emergency</h3>
            <p className="text-sm text-ink/75 leading-relaxed mb-4">
              A medical emergency or an immediate safety concern in real time.
            </p>
            <a href="tel:911" className="block bg-coral text-cream text-center py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition mb-2">Call 911 first</a>
            <Link href="/contact" className="block bg-white border border-coral text-coral text-center py-2.5 rounded-full text-sm hover:bg-coral hover:text-cream transition">Then tell us</Link>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-butter mb-2">Same day</div>
            <h3 className="font-display text-xl font-medium mb-2">A concern or incident</h3>
            <p className="text-sm text-ink/75 leading-relaxed mb-4">
              Something unprofessional or a quality issue — not an emergency, but it matters.
            </p>
            <Link href="/contact" className="block bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition">Contact our team</Link>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-sage mb-2">Anytime</div>
            <h3 className="font-display text-xl font-medium mb-2">A dispute or question</h3>
            <p className="text-sm text-ink/75 leading-relaxed mb-4">
              A billing question or a disagreement to sort out. We&apos;ll work it through with you.
            </p>
            <Link href="/contact" className="block bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition">Reach out</Link>
          </div>
        </div>
      </section>

      {/* COMMITMENTS (replaces fabricated badges) */}
      <section className="bg-deepteal text-cream py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">Compliance &amp; certifications</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-6">Earned, then shown</h2>
          <p className="text-cream/85 leading-relaxed max-w-2xl mb-4">
            Formal certifications and audits matter in healthcare — and we&apos;re building toward
            them. But we won&apos;t display a badge, a registry number, or an insurance figure until
            it&apos;s real and independently verifiable. When each one is, it&apos;ll appear here, with
            details you can check yourself.
          </p>
          <p className="text-cream/70 text-sm">
            Until then, we&apos;d rather show you nothing than show you a badge we haven&apos;t earned.
          </p>
        </div>
      </section>

      {/* TRANSPARENCY (commitment, no fabricated numbers) */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Transparency</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-6">What we&apos;ll publish openly</h2>
        <div className="bg-white border border-ink/10 rounded-3xl p-7 lg:p-9 text-sm text-ink/75 leading-relaxed">
          <p className="mb-3">
            We intend to publish a transparency report — how many applicants we screen, how many we
            turn away, and any caregivers (or families) we remove for cause. Most platforms hide those
            numbers. We want to share ours, so families and caregivers can see we take vetting
            seriously.
          </p>
          <p>
            We just won&apos;t publish numbers until they&apos;re real. As soon as we have meaningful
            data from actual operations, the first report will live here.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-mist/40 py-16 text-center">
        <div className="max-w-[900px] mx-auto px-6">
          <h3 className="font-display text-3xl md:text-4xl font-light mb-3">Have a safety question?</h3>
          <p className="text-ink/70 mb-6">Reach our team and a real person will get back to you.</p>
          <Link href="/contact" className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Contact us</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
