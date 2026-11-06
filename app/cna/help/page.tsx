/**
 * /cna/help — help center for caregivers.
 *
 * Entirely static content (FAQs + contact). Native <details> disclosure,
 * no client JS. Copy follows the business model: families pay caregivers
 * directly, Kindred earns only from memberships (prices live on /pricing),
 * and the vetting bar is the Kindred Standard.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { CONTACT_EMAIL } from '@/lib/site';

type Faq = { q: string; a: React.ReactNode };

const TOPICS = [
  { href: '#getting-paid', icon: '💵', title: 'Getting paid & membership', sub: 'Direct pay, your rate, membership' },
  { href: '#standard', icon: '⭐', title: 'The Kindred Standard', sub: 'Vetting, insurance, your progress' },
  { href: '#taxes', icon: '🧾', title: 'Taxes', sub: 'Self-employment and household employers' },
  { href: '#safety', icon: '🛡️', title: 'Safety & reviews', sub: 'Feeling unsafe, ending work, reviews' },
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

const PAY_FAQS: Faq[] = [
  { q: 'How do families pay me?', a: (<>Directly. You and the family agree on your rate, your schedule, and how you&rsquo;ll be paid (check, bank transfer, a payment app, whatever works for you both). Kindred never processes, holds, or takes any part of care payments. What the family pays you is yours.</>) },
  { q: 'Does Kindred take a cut of what I earn?', a: (<>No. There&rsquo;s no service fee, no percentage, and no fee tiers. Kindred makes money only from memberships. Current membership prices are on the <Link href="/pricing" className="text-deepteal hover:text-coral">pricing page</Link>.</>) },
  { q: 'How does membership work?', a: (<>Membership is a one-time startup fee plus a monthly fee. The first 25 approved caregivers get their first year free. You can see your plan and status on your <Link href="/cna/membership" className="text-deepteal hover:text-coral">Membership page</Link>, and current prices are always on the <Link href="/pricing" className="text-deepteal hover:text-coral">pricing page</Link>.</>) },
  { q: 'How do I set my rate?', a: (<>You set it. Put your hourly rate on <Link href="/cna/profile" className="text-deepteal hover:text-coral">your profile</Link>, then talk it through with each family: hours, duties, overtime, and holidays. Kindred doesn&rsquo;t set, cap, or negotiate rates. We recommend writing down what you agree on, even in a simple message, so everyone remembers it the same way.</>) },
  { q: 'What if a family cancels last minute or pays late?', a: (<>Because families pay you directly, cancellation terms and payment timing are between you and the family. Agree on them before you start (for example, how much notice you need and when you get paid). If a family doesn&rsquo;t keep their word, tell us. We can&rsquo;t collect money for you, but we do review family accounts that don&rsquo;t treat caregivers fairly.</>) },
  { q: 'Can families pay me with Medicare or Medicaid?', a: (<>Not through Kindred. Kindred is private pay only and doesn&rsquo;t bill Medicare, Medicaid, or any insurer. Some families have long-term-care insurance that may reimburse them for in-home care. If so, the family handles that claim with their insurer, and you may be asked for a simple record of your hours.</>) },
];

const STANDARD_FAQS: Faq[] = [
  { q: 'What is the Kindred Standard?', a: (<>It&rsquo;s the bar every caregiver on Kindred meets: a personal interview, 1,500+ hours of hands-on experience, a Level 2 background check, a verified ID, and your own liability insurance. Families see that every caregiver has cleared the same bar. Read the details on the <Link href="/kindred-standard" className="text-deepteal hover:text-coral">Kindred Standard page</Link>.</>) },
  { q: 'Where can I see my progress?', a: (<>On your <Link href="/cna/membership" className="text-deepteal hover:text-coral">Membership page</Link>. It shows which parts of the Kindred Standard are done and what&rsquo;s still open.</>) },
  { q: 'Why do I need my own liability insurance?', a: (<>You work for yourself, not for Kindred, so your own policy is what protects you on the job. It&rsquo;s part of the Kindred Standard. <Link href="/cna/get-insured" className="text-deepteal hover:text-coral">Get insured</Link> walks through what to look for.</>) },
  { q: 'Can Kindred help me become a CNA?', a: (<>No. Kindred is for caregivers who already have the training and hands-on experience. We don&rsquo;t offer certification courses or a training pathway.</>) },
];

const TAX_FAQS: Faq[] = [
  { q: 'Will Kindred send me a 1099?', a: (<>No. Kindred doesn&rsquo;t pay you, so it doesn&rsquo;t issue 1099s or any other tax form for your care work. Your income comes straight from the families you work with.</>) },
  { q: 'How do taxes work when families pay me directly?', a: (<>In most cases you&rsquo;re self-employed: you report what you earn, pay self-employment tax, and may need to make quarterly estimated payments. In some arrangements, a family who controls when and how the work is done can count as a household employer under IRS rules. Then the family may owe employment taxes and give you a W-2. The IRS Household Employer&rsquo;s Tax Guide (Publication 926) explains the difference. A tax professional can tell you which applies to you.</>) },
  { q: 'What records should I keep?', a: (<>Keep a simple log of the hours you work, each payment you receive, and your work-related expenses. It makes tax time easier, and it helps families who need records for long-term-care insurance.</>) },
];

const SAFETY_FAQS: Faq[] = [
  { q: "I don't feel safe in a client's home. What do I do?", a: (<><strong>Leave first, tell us second.</strong> Your safety comes first. If you&rsquo;re in immediate danger, call 911. Once you&rsquo;re safe, email us and we&rsquo;ll review the family&rsquo;s account.</>) },
  { q: 'Can I stop working with a family?', a: (<>Yes. You&rsquo;re independent, so you choose who you work with. Give the notice you agreed on when you can. If the family behaved in a way that made you uncomfortable, let us know.</>) },
  { q: 'I got a review I think is unfair', a: (<>Let us know. We don&rsquo;t remove reviews just for being negative, but we will remove ones that are factually wrong, contain personal attacks, or come from someone you never worked with.</>) },
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
            Most questions get answered below. If yours doesn&rsquo;t, email us and a real person
            will get back to you.
          </p>
          <div className="mt-6 bg-white border border-ink/15 rounded-2xl p-2 flex shadow-sm max-w-2xl">
            <input
              type="text"
              placeholder="Try 'how families pay me' or 'membership'"
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

        <section id="getting-paid" className="mb-12 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Most asked</div>
          <h2 className="font-display text-3xl font-medium mb-6">Getting paid &amp; membership</h2>
          <FaqList faqs={PAY_FAQS} />
        </section>

        <section id="standard" className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">The Kindred Standard</h2>
          <FaqList faqs={STANDARD_FAQS} />
        </section>

        <section id="taxes" className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Taxes</h2>
          <FaqList faqs={TAX_FAQS} />
        </section>

        <section id="safety" className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Safety &amp; reviews</h2>
          <FaqList faqs={SAFETY_FAQS} />
        </section>

        {/* CONTACT */}
        <section className="fade-up" style={{ animationDelay: '.3s' }}>
          <div className="bg-gradient-to-br from-sage/15 to-teal/10 border border-teal/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Still stuck?</div>
              <h2 className="font-display text-3xl font-medium mb-3">Talk to a real person.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                Email us with your question and a real person on the Kindred team will reply. If
                you&rsquo;re ever in danger on the job, call 911 first.
              </p>
            </div>
            <div className="space-y-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="card-hover bg-cream border border-ink/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-deepteal/10 flex items-center justify-center text-2xl">✉️</div>
                <div className="flex-1">
                  <div className="font-display text-lg font-medium">Email us</div>
                  <div className="text-xs text-ink/60 font-mono break-all">{CONTACT_EMAIL}</div>
                </div>
              </a>
              <Link href="/cna/membership" className="card-hover bg-cream border border-ink/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-deepteal/10 flex items-center justify-center text-2xl">⭐</div>
                <div className="flex-1">
                  <div className="font-display text-lg font-medium">Your membership</div>
                  <div className="text-xs text-ink/60">Plan, status, and Kindred Standard progress</div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
