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

export const dynamic = 'force-dynamic';

type Faq = { q: string; a: React.ReactNode };

const CAREGIVER_FAQS: Faq[] = [
  {
    q: 'How do I switch caregivers?',
    a: 'Go to Browse, find someone new, and message them. Schedules and notice are arranged directly between you and the caregivers you work with, so let your current caregiver know with the notice you agreed on. If you\u2019d like help thinking it through, email us.',
  },
  {
    q: "What if my caregiver can't make it?",
    a: 'They\u2019ll message you directly. Because you and your caregiver set the schedule together, it helps to agree up front on how much notice to give and what happens when a visit is missed. You pay your caregiver directly, for what the two of you agreed on.',
  },
  {
    q: 'Can I have more than one caregiver?',
    a: 'Yes, and many families do. Each arrangement (schedule, rate, and how you pay) is between you and that caregiver.',
  },
  {
    q: 'How does Kindred vet caregivers?',
    a: (<>Every caregiver meets the Kindred Standard: a personal interview, 1,500+ hours of hands-on experience, a Level 2 background check, a verified ID, and their own liability insurance. Read the details on the <Link href="/kindred-standard" className="text-deepteal hover:text-coral">Kindred Standard page</Link>.</>),
  },
];

const BILLING_FAQS: Faq[] = [
  {
    q: 'How do I pay my caregiver?',
    a: 'Directly. You and your caregiver agree on the rate, the schedule, and how you\u2019ll pay (check, bank transfer, a payment app). Kindred never processes, holds, or takes any part of what you pay for care.',
  },
  {
    q: 'What does Kindred charge?',
    a: (<>Kindred makes money only from memberships: a one-time startup fee plus a monthly fee. There&rsquo;s no service fee on care and no percentage of what you pay your caregiver. Current prices are on the <Link href="/pricing" className="text-deepteal hover:text-coral">pricing page</Link>, and you can manage your plan on your <Link href="/client/membership" className="text-deepteal hover:text-coral">Membership page</Link>.</>),
  },
  {
    q: 'Will my long-term-care insurance pay for this?',
    a: 'Some long-term-care insurance policies may reimburse families for in-home care. You file the claim with your insurer yourself, so check your policy and keep a simple record of visits, hours, and what you paid. Your caregiver can help you keep that log.',
  },
  {
    q: 'Does Medicare or Medicaid cover this?',
    a: 'Not through Kindred. Kindred is private pay only and doesn\u2019t bill Medicare, Medicaid, or any insurer. Original Medicare generally doesn\u2019t cover routine non-medical home care. Some Medicare Advantage plans offer limited in-home help through their own providers, so it\u2019s worth checking your plan.',
  },
  {
    q: 'Am I my caregiver\u2019s employer?',
    a: 'It depends on how you arrange the work. If you control when and how the work is done, you may be a household employer under IRS rules, which can mean employment taxes and a W-2. The IRS Household Employer\u2019s Tax Guide (Publication 926) explains it, and a tax professional can tell you what applies to you.',
  },
];

const SAFETY_FAQS: Faq[] = [
  {
    q: 'What if something goes wrong during a visit?',
    a: 'In an emergency, call 911 first. Once everyone is safe, email us and tell us what happened so we can review the caregiver\u2019s account.',
  },
  {
    q: "Is my family member's information private?",
    a: (<>Yes. You decide what to share with the caregivers you talk to, and we don&rsquo;t sell personal information. Our <Link href="/privacy" className="text-deepteal hover:text-coral">Privacy Policy</Link> has the details.</>),
  },
];

function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <details key={i} className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <summary className="p-5 flex items-center justify-between hover:bg-mist/30 transition">
            <span className="font-medium">{f.q}</span>
            <span className="accordion-chevron text-ink/50">▾</span>
          </summary>
          <div className="px-5 pb-5 text-sm text-ink/75 leading-relaxed border-t border-ink/10 pt-4">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

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
            Search common questions, or email us and a real person on the Kindred team will
            reply.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Try 'how do I pay my caregiver' or 'membership'"
              className="w-full pl-12 pr-4 py-4 bg-white border border-ink/15 rounded-full text-sm focus:outline-none focus:border-teal shadow-sm"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
          </div>
        </div>
      </section>

      <main className="max-w-[1100px] mx-auto px-6 pb-16">
        {/* TOPIC TILES */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <h2 className="font-display text-2xl font-medium mb-6 text-center">What do you need help with?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: '#caregivers', icon: '👥', title: 'Caregivers', sub: 'Hiring, switching, pausing' },
              { href: '#billing-faq', icon: '💳', title: 'Paying for care', sub: 'Direct pay, membership, insurance' },
              { href: '#safety', icon: '🛡️', title: 'Trust & safety', sub: 'Vetting, privacy, getting help' },
              { href: '#tech', icon: '📱', title: 'Using Kindred', sub: 'Account, messaging, settings' },
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
        <section id="caregivers" className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Caregivers</h2>
          <FaqList faqs={CAREGIVER_FAQS} />
        </section>

        <section id="billing-faq" className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Paying for care</h2>
          <FaqList faqs={BILLING_FAQS} />
        </section>

        <section id="safety" className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Trust &amp; safety</h2>
          <FaqList faqs={SAFETY_FAQS} />
        </section>

        <section id="tech" className="mb-12 fade-up" style={{ animationDelay: '.3s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Using Kindred</h2>
          <FaqList
            faqs={[
              {
                q: 'Can my sibling get access too?',
                a: 'Yes. Go to Account settings, then Family access, and invite them by email. You choose whether they can view only or also message caregivers and edit the care plan.',
              },
              {
                q: 'Is there a mobile app?',
                a: 'Kindred works great in your phone\u2019s browser today. Native apps for iOS and Android are on the roadmap.',
              },
            ]}
          />
        </section>

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
