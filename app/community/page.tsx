/**
 * /community — ported from Front-End/Homepage/community.html, honest.
 *
 * The mock had five fabricated upcoming events (real venues, fake dates/hosts)
 * and three fake member testimonials. Community is a Phase-2 idea (moderation is
 * hard, and there are no members yet). So: the vision of what the community will
 * offer stays, the fake events become an honest "coming once we have members"
 * state, and the fake testimonials are dropped. No become-a-CNA or school
 * pathway promos: Kindred is for caregivers who are already working.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const FEATURES: [string, string, string][] = [
  ['💬', 'Discussion spaces', 'Places to talk through dementia care, hospice, rate-setting, hard days, and self-care, with other caregivers instead of a corporate office.'],
  ['🗓', 'Local meetups', 'Coffee and conversation in the areas Kindred serves. Some educational, some just venting over pastries. Both matter.'],
  ['🎓', 'Skills workshops', 'Sessions on dementia, safe transfers, hospice, and the business side of working on your own, live with recordings.'],
  ['🤝', 'Mentor matching', 'Caregivers newer to independent work paired with experienced ones who have been in their shoes. Real talk, no expectations.'],
  ['📚', 'Continuing education', 'Help finding Florida continuing-education options that fit around a working caregiver\u2019s schedule.'],
  ['🧾', 'Working on your own', 'Plain guidance on setting your rate, agreeing on terms with families, and handling your own taxes.'],
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Kindred Community</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Caregiving can be lonely.{' '}
          <span className="italic font-medium text-gradient">It doesn&apos;t have to be.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          We&apos;re building a space for Kindred caregivers to swap stories, ask hard questions, and
          remind each other this work matters. Member-only, no recruiters, and coming as our community
          grows.
        </p>
      </section>

      {/* What it'll include */}
      <section className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2 text-center">What it&apos;ll include</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8 text-center">Built for the people doing the work</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(([icon, title, body]) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events — honest coming state */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Events</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-4">The calendar fills as we grow</h2>
          <p className="text-ink/70 leading-relaxed max-w-xl mx-auto">
            Workshops and meetups will be scheduled here once there are members to gather. We&apos;d
            rather show you a real calendar than a fake one, so this stays empty until it isn&apos;t.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-deepteal text-cream py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <h3 className="font-display text-4xl md:text-5xl font-light mb-3">Included with your Kindred membership</h3>
          <p className="text-cream/85 mb-7 max-w-xl mx-auto">Join as a caregiver to be part of it as it opens. No extra cost, no upsells.</p>
          <Link href="/apply" className="inline-flex bg-cream text-deepteal px-6 py-3 rounded-full text-sm font-medium hover:bg-cream/90 transition">Apply now</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
