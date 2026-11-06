/**
 * /client/help — help center. Ported from Client-Portal/help.html. Shell lives
 * in app/client/layout.tsx.
 *
 * This page is all static educational content (topic tiles, FAQ accordions,
 * contact card) — no per-user data, so it ports essentially verbatim. The
 * support phone/email are platform constants, not fabricated user data.
 *
 * Accordions use native <details>/<summary> (styled in globals.css), so no
 * client JS is needed and this stays a server component.
 */

export const dynamic = 'force-dynamic';

type Faq = { q: string; a: React.ReactNode };

const CAREGIVER_FAQS: Faq[] = [
  {
    q: 'How do I switch caregivers?',
    a: 'Go to Browse, find someone new, and message them. Once you\u2019ve agreed on terms, you can pause your current caregiver from the Dashboard and book the new one. If you\u2019d like our help with the conversation, message Kindred Support and we\u2019ll guide you through it gently.',
  },
  {
    q: "What if my caregiver can't make it?",
    a: 'They\u2019ll message you directly. You can also broadcast the shift to other qualified caregivers nearby. No-shows are rare, and you\u2019re never charged for a shift that didn\u2019t happen.',
  },
  {
    q: 'Can I have more than one caregiver?',
    a: 'Absolutely — and many families do. Each one has separate visits, messages, and billing, but they share the same care plan, so they all know about conditions, allergies, and routines.',
  },
  {
    q: 'How does Kindred verify caregivers?',
    a: 'Every CNA on Kindred has a current Florida CNA license (verified with the state\u2019s MQA database), a Level 2 background check, and reference checks. "Verified" = all complete. "Top-Rated" = verified plus a strong track record of five-star shifts.',
  },
];

const BILLING_FAQS: Faq[] = [
  {
    q: 'When am I charged?',
    a: 'We charge once per month for the previous month\u2019s confirmed visits. You\u2019ll get an itemized email a few days before the charge — and you can see a running total any time on your Billing page.',
  },
  {
    q: 'How do I submit visits to my LTC insurance?',
    a: 'On your Billing page, download visit logs for the month you need. We auto-generate the format carriers like Genworth, John Hancock, and Mutual of Omaha require, and can set up auto-send to your carrier.',
  },
  {
    q: 'Does Medicare cover this?',
    a: 'Generally, no — original Medicare doesn\u2019t cover routine non-medical home care. Some Medicare Advantage plans do, so check yours. For most clients, this is private-pay or covered by LTC insurance.',
  },
  {
    q: "What's the service fee, exactly?",
    a: 'We charge a small platform fee on top of the caregiver\u2019s rate, lower for higher-tier caregivers. That\u2019s the only fee — no hidden charges, no booking fees, no surge pricing. It covers background checks, identity verification, payment processing, and support.',
  },
];

const SAFETY_FAQS: Faq[] = [
  {
    q: 'What if something goes wrong during a visit?',
    a: 'In an emergency, call 911 first. Then call our 24/7 incident line. For non-emergencies, open a dispute from the visit\u2019s receipt and we\u2019ll respond within one business day.',
  },
  {
    q: "Is my family member's information private?",
    a: 'Yes. The care plan (conditions, medications, allergies, routines) is only shared with caregivers you\u2019ve actively hired — never visible to anyone browsing. Messages are encrypted.',
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
            Search common questions, or talk to a real person — we answer within an hour during
            business hours.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Try 'how do I switch caregivers' or 'pause billing'"
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
              { href: '#billing-faq', icon: '💳', title: 'Billing', sub: 'Receipts, refunds, LTC claims' },
              { href: '#safety', icon: '🛡️', title: 'Trust & safety', sub: 'Verifications, incidents, disputes' },
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
          <h2 className="font-display text-3xl font-medium mb-6">Billing</h2>
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
                a: 'Yes — go to Account settings → Family access and invite them by email. You choose whether they can view-only or also message caregivers and edit the care plan.',
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
                Our support team is based in Florida and answers within an hour during business hours
                (9 AM – 7 PM ET). For care emergencies, we're available 24/7.
              </p>
            </div>
            <div className="space-y-3">
              <a href="/client/messages" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-deepteal text-cream flex items-center justify-center text-lg">💬</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Message Kindred Support</div>
                  <div className="text-xs text-ink/60">Typically replies within an hour</div>
                </div>
                <span className="text-deepteal">→</span>
              </a>
              <a href="tel:8005552273" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-sage text-cream flex items-center justify-center text-lg">📞</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Call us</div>
                  <div className="text-xs text-ink/60 font-mono">(800) 555-CARE · 24/7 for emergencies</div>
                </div>
                <span className="text-deepteal">→</span>
              </a>
              <a href="mailto:hello@kindredmarketplace.com" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-sky text-cream flex items-center justify-center text-lg">✉️</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Email</div>
                  <div className="text-xs text-ink/60 font-mono">hello@kindredmarketplace.com</div>
                </div>
                <span className="text-deepteal">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
