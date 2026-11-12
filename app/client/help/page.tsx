/**
 * /client/help — help center. Ported from Client-Portal/help.html. Shell lives
 * in app/client/layout.tsx.
 *
 * This page is all static educational content (topic tiles, FAQ accordions,
 * contact card), no per-user data. Copy follows the business model: families
 * pay caregivers directly, Kindred earns only from memberships (prices live
 * on /pricing), and Kindred is private pay only. Contact is email only
 * (CONTACT_EMAIL) until a real phone line exists.
 *
 * Accordions use native <details>/<summary> (styled in globals.css), so no
 * client JS is needed and this stays a server component.
 */

import Link from 'next/link';
import { CONTACT_EMAIL } from '@/lib/site';
import { FAQ_GROUPS, FaqList } from '@/components/family/FamilyFaqs';

export const dynamic = 'force-dynamic';

export default function ClientHelpPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky/15 blur-3xl pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Help center</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Real questions, <span className="italic font-medium text-gradient">real humans.</span>
          </h1>
          <p className="text-ink/70 mt-4 max-w-xl mx-auto">
            Common questions below, or email us and a real person on the Kindred team will reply.
          </p>

        </div>
      </section>

      <main className="max-w-[1100px] mx-auto px-6 pb-16">
        {/* TOPIC TILES */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <h2 className="font-display text-2xl font-medium mb-6 text-center">What do you need help with?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: '#caregivers', icon: '👥', title: 'Finding a caregiver', sub: 'Checks, membership, switching' },
              { href: '#paying', icon: '💳', title: 'Paying for care', sub: 'Direct pay, membership, insurance' },
              { href: '#employer', icon: '🧾', title: 'Taxes & paperwork', sub: 'Household employer basics' },
              { href: '#safety', icon: '🛡️', title: 'Trust & safety', sub: 'Privacy, getting help' },
            ].map((t) => (
              <a key={t.href} href={t.href} className="card-hover bg-white border border-ink/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mx-auto mb-3">{t.icon}</div>
                <div className="font-display text-lg font-medium mb-1">{t.title}</div>
                <div className="text-xs text-ink/60">{t.sub}</div>
              </a>
            ))}
          </div>
        </section>

        {/* FAQs */}
        {FAQ_GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="mb-12 fade-up scroll-mt-24">
            <h2 className="font-display text-3xl font-medium mb-6">{g.title}</h2>
            <FaqList faqs={g.faqs} />
          </section>
        ))}

        {/* CONTACT CARD */}
        <section className="fade-up" style={{ animationDelay: '.35s' }}>
          <div className="bg-gradient-to-br from-butter/25 to-coral/15 border border-coral/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Still need help?</div>
              <h2 className="font-display text-3xl font-medium mb-3">Talk to a real person.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                Email us with your question and a real person on the Kindred team will reply. In an
                emergency, always call 911 first.
              </p>
            </div>
            <div className="space-y-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-sky text-cream flex items-center justify-center text-lg">✉️</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Email</div>
                  <div className="text-xs text-ink/60 font-mono break-all">{CONTACT_EMAIL}</div>
                </div>
                <span className="text-deepteal">→</span>
              </a>
              <Link href="/client/membership" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-deepteal text-cream flex items-center justify-center text-lg">⭐</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Your membership</div>
                  <div className="text-xs text-ink/60">Plan and status</div>
                </div>
                <span className="text-deepteal">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
