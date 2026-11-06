/**
 * /cna/help — help center. Ported 1:1 from CNA-Portal/help.html.
 *
 * Entirely static content (FAQs + contact). Native <details> disclosure,
 * no client JS. Internal links point to the live /cna/* routes.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';

type Faq = { q: string; a: React.ReactNode };

const TOPICS = [
  { href: '#payouts', icon: '💰', title: 'Earnings & payouts', sub: 'Fees, tiers, instant cash-out' },
  { href: '#shifts', icon: '📅', title: 'Shifts & schedule', sub: 'Cancellations, no-shows, clock-in' },
  { href: '#tier', icon: '⭐', title: 'Tier & ratings', sub: 'How tiers work, getting reviewed' },
  { href: '#safety', icon: '🛡️', title: 'Safety & disputes', sub: 'Incidents, blocking, getting help' },
];

function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <details key={i} className="bg-white border border-ink/10 rounded-2xl overflow-hidden group">
          <summary className="p-5 flex items-center justify-between hover:bg-mist/30 transition cursor-pointer list-none">
            <span className="font-medium">{f.q}</span>
            <span className="accordion-chevron text-ink/50 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-5 pb-5 text-sm text-ink/75 leading-relaxed border-t border-ink/10 pt-4">
            {f.a}
          </div>
        </details>
      ))}
    </div>
  );
}

const EARNINGS_FAQS: Faq[] = [
  { q: 'When do I get paid?', a: (<>Three options, your pick. <strong>Weekly auto-deposit</strong> is free — every Monday, your previous week&rsquo;s earnings hit your bank in 1–2 business days. <strong>Next-day payout</strong> is $0.50 per cash-out. <strong>Instant payout</strong> is 1.5% (min $0.50) — under 30 minutes to your debit card. Set your default on the <Link href="/cna/earnings" className="text-deepteal hover:text-coral">Earnings page</Link>.</>) },
  { q: "What's the Kindred fee?", a: (<>Your service fee depends on your tier. <strong>New</strong> caregivers pay 15%. <strong>Verified</strong> pays 12%. <strong>Top-Rated</strong> pays 10%. The fee comes out of each shift before payout. Stripe processing fees are separate and Kindred doesn&rsquo;t take any cut of those.</>) },
  { q: 'How does instant payout work?', a: (<>Tap &ldquo;Cash out instantly&rdquo; on the Earnings page. Funds go to your linked debit card in under 30 minutes (most under 5). The fee is 1.5% with a $0.50 minimum — so $312 instantly costs $4.69. Most of the time, weekly auto-deposit is the smarter move.</>) },
  { q: 'How do I get my 1099 tax form?', a: (<>We issue 1099-NEC forms each January for the prior tax year if you earned $600+ through Kindred. Find them under <Link href="/cna/earnings" className="text-deepteal hover:text-coral">Earnings → Tax docs</Link>. Since you&rsquo;re a 1099 contractor, set aside roughly 25–30% of every payout for taxes, and check our <Link href="/cna/resources" className="text-deepteal hover:text-coral">tax tips guide</Link>.</>) },
  { q: 'I think I was underpaid for a shift', a: (<>Open the shift in <Link href="/cna/schedule" className="text-deepteal hover:text-coral">My schedule</Link>, tap &ldquo;Report a pay issue,&rdquo; and tell us what happened. Most pay issues resolve within 48 hours. If we owe you money, it lands in your next payout.</>) },
];

const SHIFT_FAQS: Faq[] = [
  { q: 'How do I clock in?', a: (<>When you arrive at the client&rsquo;s home, open your dashboard and tap the green &ldquo;Clock in&rdquo; button on today&rsquo;s shift card. We log a timestamp and confirm your location. When the shift ends, tap &ldquo;Clock out.&rdquo; Your earnings are calculated from the clocked-in time.</>) },
  { q: 'I need to cancel a shift', a: (<>Cancel from the shift detail page as early as possible. <strong>24+ hours notice:</strong> no penalty. <strong>2–24 hours:</strong> counts against your reliability score. <strong>Under 2 hours / no-show:</strong> serious — can lead to suspension. Genuine emergency? Message support and we&rsquo;ll waive the penalty.</>) },
  { q: 'A client cancelled on me last-minute', a: (<>You&rsquo;re still owed something. Less than 24 hours notice: you get 50% of scheduled pay. After you&rsquo;ve arrived: 100%. These payouts are automatic — you don&rsquo;t need to fight for them.</>) },
  { q: 'How do I block off vacation time?', a: (<>Go to <Link href="/cna/schedule" className="text-deepteal hover:text-coral">My schedule → Block off time</Link>. Block a single day or a range. We&rsquo;ll stop offering you jobs in that window and notify recurring clients you&rsquo;ll be away.</>) },
];

const TIER_FAQS: Faq[] = [
  { q: 'How do the tiers work?', a: (<><strong>New</strong> (15% fee) — everyone starts here. <strong>Verified</strong> (12% fee) — unlocked after your first 5 completed shifts with no flags, plus active license, L2 background check, CPR cert, and ID verification. <strong>Top-Rated</strong> (10% fee) — 10 five-star shifts plus 95%+ reliability over 90 days, and you show up first in client searches.</>) },
  { q: 'What if my CPR cert expires?', a: (<>You drop to New tier the day it expires and stop appearing in client searches until you upload a renewed cert. We send reminders at 60, 30, and 7 days out. Find a class through <Link href="/cna/resources" className="text-deepteal hover:text-coral">Resources</Link>, then upload under <Link href="/cna/compliance" className="text-deepteal hover:text-coral">Compliance</Link> — you&rsquo;re back to your prior tier within minutes.</>) },
  { q: 'I got a bad review I think is unfair', a: (<>You can flag a review for our team. We don&rsquo;t remove reviews just for being negative — but we will remove ones that are factually wrong, contain personal attacks, or come from someone who never booked you. Flagged reviews don&rsquo;t count toward your tier while under review.</>) },
];

const SAFETY_FAQS: Faq[] = [
  { q: "I don't feel safe at a shift. What do I do?", a: (<><strong>Leave first, document second.</strong> Your safety is the only thing that matters. Once safe, open the shift and tap &ldquo;Report an incident.&rdquo; You&rsquo;ll still be paid for time worked, and the client is paused from booking while we investigate. In immediate danger? Call 911 first.</>) },
  { q: 'Can I block a client?', a: (<>Yes, anytime. Open any conversation or shift and tap &ldquo;Block this client.&rdquo; You won&rsquo;t see their job posts, they won&rsquo;t see your profile, and pending shifts get cancelled (you keep earned pay). It&rsquo;s silent.</>) },
  { q: 'Does Kindred carry insurance for me?', a: (<>Kindred carries platform-level coverage — but since you&rsquo;re a 1099 contractor, our policy doesn&rsquo;t extend to your individual care work. We strongly recommend your own coverage; plans start at $8/mo. See <Link href="/cna/get-insured" className="text-deepteal hover:text-coral">Get insured</Link>.</>) },
  { q: 'A client tried to pay me off-platform', a: (<>Decline politely. Off-platform payment leaves you with no insurance backup, no clock-in proof, no tax documentation, and no recourse. It also violates our terms. If a client pressures you, report it.</>) },
];

export default function CnaHelpPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
        <div className="max-w-[1000px] mx-auto px-6 py-14 lg:py-16 fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Help center</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            What can we help you <span className="italic font-medium text-gradient">work through?</span>
          </h1>
          <p className="text-ink/70 mt-4 text-lg leading-relaxed max-w-2xl">
            Most questions get answered below. If yours doesn&rsquo;t, we&rsquo;ll get you to a real
            person fast.
          </p>
          <div className="mt-6 bg-white border border-ink/15 rounded-2xl p-2 flex shadow-sm max-w-2xl">
            <input
              type="text"
              placeholder="Try 'when do I get paid' or 'no-show policy'"
              className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
            />
            <button className="bg-deepteal text-cream px-6 py-3 rounded-xl text-sm font-medium hover:bg-inkdark transition">
              Search
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-6 pb-16">
        {/* TOPIC TILES */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.05s' }}>
          <h2 className="font-display text-2xl font-medium mb-6">Browse by topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOPICS.map((t) => (
              <a key={t.href} href={t.href} className="card-hover bg-white border border-ink/10 rounded-2xl p-5 block">
                <div className="text-2xl mb-3">{t.icon}</div>
                <div className="font-display text-lg font-medium mb-1">{t.title}</div>
                <div className="text-xs text-ink/60">{t.sub}</div>
              </a>
            ))}
          </div>
        </section>

        <section id="payouts" className="mb-12 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Most asked</div>
          <h2 className="font-display text-3xl font-medium mb-6">Earnings &amp; payouts</h2>
          <FaqList faqs={EARNINGS_FAQS} />
        </section>

        <section id="shifts" className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Shifts &amp; schedule</h2>
          <FaqList faqs={SHIFT_FAQS} />
        </section>

        <section id="tier" className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Tier &amp; ratings</h2>
          <FaqList faqs={TIER_FAQS} />
        </section>

        <section id="safety" className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Safety &amp; disputes</h2>
          <FaqList faqs={SAFETY_FAQS} />
        </section>

        {/* CONTACT */}
        <section className="fade-up" style={{ animationDelay: '.3s' }}>
          <div className="bg-gradient-to-br from-sage/15 to-teal/10 border border-teal/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Still stuck?</div>
              <h2 className="font-display text-3xl font-medium mb-3">Talk to a real person.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                Our support team is in Florida, knows the work, and replies within an hour on
                weekdays. For shift-day emergencies, the in-app red button is the fastest route.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/cna/messages" className="card-hover bg-cream border border-ink/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-deepteal/10 flex items-center justify-center text-2xl">💬</div>
                <div className="flex-1">
                  <div className="font-display text-lg font-medium">Message support</div>
                  <div className="text-xs text-ink/60">Typically replies in under an hour, 8am–8pm ET</div>
                </div>
              </Link>
              <a href="tel:18555463733" className="card-hover bg-cream border border-ink/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-deepteal/10 flex items-center justify-center text-2xl">📞</div>
                <div className="flex-1">
                  <div className="font-display text-lg font-medium">Call us</div>
                  <div className="text-xs text-ink/60 font-mono">1-855-KINDRED · 8am–8pm ET, Mon–Sun</div>
                </div>
              </a>
              <a href="#" className="card-hover bg-coral/10 border border-coral/30 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-coral/20 flex items-center justify-center text-2xl">🚨</div>
                <div className="flex-1">
                  <div className="font-display text-lg font-medium text-coral">Shift emergency</div>
                  <div className="text-xs text-ink/60">24/7 line for incidents while on a shift</div>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
