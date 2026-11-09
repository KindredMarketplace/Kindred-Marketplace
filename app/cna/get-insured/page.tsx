/**
 * /cna/get-insured — what caregivers need to know about their own liability
 * insurance (a Kindred Standard requirement).
 *
 * Honest version of CNA-Portal/get-insured.html. The mock showed three
 * "vetted partners" with a Kindred group rate, invented prices and coverage
 * tables, and affiliate-commission copy. Kindred has no insurance partnerships
 * today, so all of that is gone. What's left is plain education: why coverage
 * matters, what to look for in a policy, a couple of places caregivers
 * commonly start (no partnership, no referral pay), and where to upload proof. Static content, native <details> accordions, no client JS.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';

const LOOK_FOR = [
  { title: 'Professional liability', body: 'Covers claims that something you did (or didn’t do) while giving care caused harm. This is the core of what you need.' },
  { title: 'General liability', body: 'Covers accidental damage or injury that isn’t about the care itself, like breaking something in a client’s home.' },
  { title: 'Legal defense costs', body: 'Check whether defense costs are paid on top of your coverage limit or come out of it.' },
  { title: 'Coverage for in-home, independent work', body: 'Make sure the policy covers you as a self-employed caregiver working in clients’ homes, not only as an employee.' },
  { title: 'License protection', body: 'Some policies help pay for a lawyer if a complaint is filed against your CNA license.' },
  { title: 'A certificate of insurance', body: 'Your insurer should give you a certificate showing your name, policy dates, and limits. That’s what you’ll share as proof.' },
];

// Places caregivers can start comparing. Kindred has no partnership with
// either, earns nothing from them, and doesn't quote prices it can't verify:
// neither site publishes a starting price, so caregivers get a quote directly.
const PLACES_TO_START = [
  {
    name: 'NSO (Nurses Service Organization)',
    url: 'https://www.nso.com/malpractice-insurance/individuals/nursing-professionals',
    body: 'Individual professional liability that lists nursing assistants, home health aides, personal care aides and caregivers among the roles it covers. Online quote.',
  },
  {
    name: 'CM&F Group',
    url: 'https://www.cmfgroup.com/malpractice-insurance/home-health-care-professionals/certified-nursing-assistant-malpractice-insurance',
    body: 'Individual CNA malpractice coverage up to $1 million per claim, with license defense, that it says follows you across contracted work. Online quote.',
  },
];

const FAQS = [
  { q: 'Is insurance required to work on Kindred?', a: 'Yes. Your own liability insurance is part of the Kindred Standard, along with a personal interview, 1,500+ hours of hands-on experience, a Level 2 background check, and a verified ID.' },
  { q: "Doesn't Kindred's coverage protect me?", a: 'No. You work for yourself, not for Kindred, so Kindred’s insurance doesn’t extend to the care you provide. Your own policy is what protects you on the job.' },
  { q: 'Does Kindred get anything if I buy from one of these?', a: 'No. Kindred has no insurance partnerships and isn’t paid for pointing you to anyone. We list a couple of places caregivers commonly start; you’re free to use any insurer whose policy covers your in-home, self-employed work.' },
  { q: 'When do I need insurance, and how do I show it?', a: (<>Only after Kindred accepts you, so you never pay for a policy before you know you&rsquo;re in. Then upload your certificate of insurance on your <Link href="/cna/compliance" className="text-deepteal hover:text-coral">Credentials page</Link>.</>) },
  { q: 'Do families need to see my policy?', a: 'Some families will ask. Sharing your certificate of insurance is a simple way to build trust before you start.' },
];

export default function CnaGetInsuredPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-butter/20 blur-3xl pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Protect your work</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Your own <span className="italic font-medium text-gradient">liability insurance.</span>
          </h1>
          <p className="text-ink/70 mt-5 text-lg leading-relaxed max-w-2xl">
            As an independent caregiver, you carry your own coverage. It&rsquo;s part of the Kindred
            Standard, and it protects you if something goes wrong in a client&rsquo;s home. Here&rsquo;s
            what to look for when you choose a policy.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/cna/membership"
              className="inline-block bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition"
            >
              See my Kindred Standard progress
            </Link>
            <Link
              href="/kindred-standard"
              className="inline-block border border-ink/15 px-6 py-3 rounded-full text-sm hover:bg-mist transition"
            >
              Read the Kindred Standard
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-6 pb-16">
        {/* WHY YOU NEED IT */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <h2 className="font-display text-3xl font-medium mb-3">Why caregivers carry their own coverage</h2>
          <p className="text-ink/70 max-w-2xl mb-8">
            You&rsquo;re self-employed, so there&rsquo;s no employer&rsquo;s insurance behind you. A
            policy protects you against the rare but real situations that can derail a career.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🩹', title: 'A client falls in your care', body: "Even when it's not your fault, families sometimes pursue claims. Liability insurance can cover legal defense and a settlement." },
              { icon: '💊', title: 'A medication misunderstanding', body: "If a client says a reminder went wrong, professional liability coverage helps you defend your practice and your reputation." },
              { icon: '🏠', title: 'Something gets damaged', body: "Knocked over a lamp during a transfer? General liability can cover property damage in the client's home." },
            ].map((c) => (
              <div key={c.title} className="card-hover bg-white border border-ink/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">{c.icon}</div>
                <div className="font-display text-lg font-medium mb-2">{c.title}</div>
                <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT TO LOOK FOR */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.15s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Choosing a policy</div>
          <h2 className="font-display text-3xl font-medium mb-2">What to look for</h2>
          <p className="text-ink/70 max-w-2xl mb-8">
            Kindred doesn&rsquo;t sell insurance or partner with an insurer. Whichever policy you
            choose, check that it covers these.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOOK_FOR.map((item) => (
              <div key={item.title} className="bg-white border border-ink/10 rounded-2xl p-5">
                <div className="flex items-start gap-2">
                  <span className="text-sage">✓</span>
                  <div>
                    <div className="font-display text-lg font-medium mb-1">{item.title}</div>
                    <p className="text-sm text-ink/70 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHERE TO START */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.18s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Where to start</div>
          <h2 className="font-display text-3xl font-medium mb-2">Places caregivers often start</h2>
          <p className="text-ink/70 max-w-2xl mb-6">
            Kindred doesn&rsquo;t partner with these companies or get paid by them. When you get a quote, ask
            one question plainly: <span className="italic">&ldquo;Does this cover me as a self-employed caregiver working in
            clients&rsquo; homes?&rdquo;</span>
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PLACES_TO_START.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover block bg-white border border-ink/10 rounded-2xl p-6"
              >
                <div className="font-display text-xl font-medium mb-2">{p.name} <span className="text-ink/40 text-base">↗</span></div>
                <p className="text-sm text-ink/70 leading-relaxed">{p.body}</p>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">Common questions</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-ink/10 rounded-2xl overflow-hidden group">
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
        </section>
      </main>
    </>
  );
}
