/**
 * /business/help — facility help center. Ported from
 * Business-Portal/help.html. Shell lives in app/business/layout.tsx.
 *
 * All static educational content (FAQ accordions, topic tiles, contact card) —
 * no per-user data, so it ports essentially verbatim. The support phone/email
 * are platform constants, not fabricated user data. Uses native
 * <details>/<summary> (styled in globals.css), so this stays a server
 * component with no client JS.
 */

import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Faq = { q: string; a: React.ReactNode };

const STAFFING_FAQS: Faq[] = [
  {
    q: 'How fast do shifts typically fill?',
    a: 'For facilities with an active roster, most shifts fill within an hour — sometimes within minutes. Off-roster shifts average about 4 hours. NOC and weekend shifts take longer; raising the bill rate or offering a weekend premium meaningfully speeds things up.',
  },
  {
    q: 'What if a caregiver no-shows?',
    a: 'We treat no-shows as a regulatory issue, not a customer-service one. We auto-broadcast the open shift to your full roster + qualified CNAs in your area the moment a no-show is detected, and your account manager is paged. No-show CNAs face strikes that affect their visibility on our platform — repeat offenders are removed.',
  },
  {
    q: 'Can the same caregiver work multiple shifts in a series?',
    a: "Yes. When you post bulk shifts, check 'Allow same caregiver to claim multiple shifts.' Useful for consistency — same CNA on Mon/Wed/Fri NOC means residents see familiar faces.",
  },
  {
    q: 'How do I add someone to my approved roster?',
    a: `After a CNA works a shift at your facility, head to Roster → Recently worked, and click "+ Add" on anyone you'd want back. Roster CNAs see your shifts 1 hour before they open to everyone else.`,
  },
];

const BILLING_FAQS: Faq[] = [
  {
    q: 'How does billing work?',
    a: 'Monthly invoicing on Net-30 terms, paid via ACH. Every line item traces back to an approved timesheet — if you can\u2019t explain a charge to your CFO, it shouldn\u2019t be on there. Invoices auto-generate on the 1st for the previous month and email to your AP contact.',
  },
  {
    q: 'What if I dispute a line item?',
    a: 'Open the invoice and click "Dispute" on any line. Your account manager responds within one business day and issues a credit memo if the charge is wrong. Don\u2019t worry about chasing AP — we come to you.',
  },
  {
    q: "What's the platform fee?",
    a: 'Included in the bill rate you set. There\u2019s no separate platform line item, no booking fee, no surge pricing. The bill rate you post is exactly what you pay per hour of caregiver time.',
  },
  {
    q: 'Do you handle workers\u2019 comp and payroll taxes?',
    a: 'Yes. Caregivers are paid via Kindred (we handle 1099 tax forms automatically) and we carry the platform-level liability coverage. Your facility doesn\u2019t add Kindred CNAs to your payroll or workers\u2019 comp.',
  },
];

const COMPLIANCE_FAQS: Faq[] = [
  {
    q: 'How are CNAs verified?',
    a: 'Every CNA on Kindred has a current state CNA license (verified against the state database), a Level 2 background check, current TB test, and CPR certification. Memory care shifts additionally require a dementia certification. We block shift application if any credential lapses.',
  },
  {
    q: 'Do you have a BAA on file?',
    a: 'Yes — every facility gets a Business Associate Agreement during onboarding. You can download the signed copy and your Certificate of Insurance from Settings → Compliance vault.',
  },
  {
    q: 'What about state staffing-ratio audits?',
    a: 'We retain timesheet records (clock-in/out + GPS verification) for 7 years, accessible via your Reports page or via your account manager for surveyor visits. Auditors love our audit trail — it\u2019s tighter than most in-house records.',
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

export default function BusinessHelpPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky/15 blur-3xl pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Account manager &amp; help</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Your account manager <span className="italic font-medium text-gradient">is one click away.</span>
          </h1>
          <p className="text-ink/70 mt-4 max-w-xl mx-auto">
            Most questions resolved within an hour during business hours. After hours, the on-call line
            is always staffed for shift emergencies.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Try 'late timesheet' or 'add bulk shifts'"
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
              { href: '#staffing', icon: '📋', title: 'Staffing & shifts', sub: 'Filling, no-shows, roster' },
              { href: '#billing', icon: '💳', title: 'Billing & invoices', sub: 'Net-30, disputes, payments' },
              { href: '#compliance', icon: '🛡️', title: 'Compliance', sub: 'BAA, COI, surveyor audits' },
              { href: '#account', icon: '⚙️', title: 'Account', sub: 'Team, SSO, settings' },
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
        <section id="staffing" className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Staffing &amp; shifts</h2>
          <FaqList faqs={STAFFING_FAQS} />
        </section>

        <section id="billing" className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Billing &amp; invoices</h2>
          <FaqList faqs={BILLING_FAQS} />
        </section>

        <section id="compliance" className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Compliance &amp; trust</h2>
          <FaqList faqs={COMPLIANCE_FAQS} />
        </section>

        <section id="account" className="mb-12 fade-up" style={{ animationDelay: '.3s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Account &amp; team</h2>
          <FaqList
            faqs={[
              {
                q: 'How do I add or remove a teammate?',
                a: 'Go to Team and click "+ Invite teammate." Pick a role (Admin, Scheduler, Supervisor, Billing, HR) and we\u2019ll email them a setup link. To remove someone, click "Edit" on their row and choose "Remove access."',
              },
              {
                q: 'Can my charge nurses only see their wing?',
                a: 'Yes. Assign the Supervisor role and scope them to a specific wing in their member settings. They\u2019ll only see and approve timesheets for their wing.',
              },
              {
                q: 'Do you support SAML SSO?',
                a: 'On the enterprise roadmap (Microsoft 365, Okta, Google Workspace). Talk to your account manager if you need this for go-live.',
              },
            ]}
          />
        </section>

        {/* CONTACT CARD */}
        <section className="fade-up" style={{ animationDelay: '.35s' }}>
          <div className="bg-gradient-to-br from-butter/25 to-coral/15 border border-coral/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Talk to your account manager</div>
              <h2 className="font-display text-3xl font-medium mb-3">A real human, not a ticket queue.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                Every facility gets a dedicated account manager based in Florida. They know your wings,
                your roster, and your billing contact. Reach out anytime — typical first response is
                under an hour during business hours.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/business/messages" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-deepteal text-cream flex items-center justify-center text-lg">💬</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Message your account manager</div>
                  <div className="text-xs text-ink/60">Typically replies within an hour</div>
                </div>
                <span className="text-deepteal">→</span>
              </Link>
              <a href="tel:8005552273" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-sage text-cream flex items-center justify-center text-lg">📞</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Call us</div>
                  <div className="text-xs text-ink/60 font-mono">(800) 555-CARE · 24/7 on-call for shift emergencies</div>
                </div>
                <span className="text-deepteal">→</span>
              </a>
              <a href="mailto:business@kindredmarketplace.com" className="flex items-center gap-4 p-4 bg-white border border-ink/10 rounded-2xl hover:bg-cream/60 transition">
                <div className="w-11 h-11 rounded-full bg-sky text-cream flex items-center justify-center text-lg">✉️</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Email</div>
                  <div className="text-xs text-ink/60 font-mono">business@kindredmarketplace.com</div>
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
