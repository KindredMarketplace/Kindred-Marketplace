/**
 * /cna/get-insured — insurance partner comparison. Ported 1:1 from
 * CNA-Portal/get-insured.html.
 *
 * This page is entirely static marketing/education content (no per-user data),
 * so it ports cleanly. The <details> accordions use native HTML disclosure —
 * no client JS needed. Apply links are placeholders until affiliate URLs are
 * finalized (see Tracker/11 - Revenue: insurance affiliate stream).
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

const PARTNERS = [
  {
    id: 'nso', name: 'NSO', sub: 'Nurses Service Organization',
    logo: 'NSO', logoCls: 'from-sky to-deepteal', price: '$8–14', range: '$100K – $1M coverage levels',
    recommended: true,
    points: [
      'Largest provider, biggest claims team',
      'License protection included',
      'Same-day coverage activation',
      'Kindred group rate (10% off list)',
    ],
    cta: 'Apply with NSO →', ctaCls: 'bg-deepteal text-cream hover:bg-inkdark', note: '10 min · no obligation',
  },
  {
    id: 'hpso', name: 'HPSO', sub: 'Healthcare Providers Service Org',
    logo: 'HP', logoCls: 'from-sage to-teal', price: '$9–16', range: '$100K – $1M coverage levels',
    points: [
      'Strong defense lawyer network',
      'License protection included',
      'HIPAA breach coverage add-on',
      'No Kindred group discount yet',
    ],
    lastMuted: true,
    cta: 'Apply with HPSO →', ctaCls: 'border border-ink/20 text-deepteal hover:bg-mist', note: '15 min',
  },
  {
    id: 'cmf', name: 'CM&F Group', sub: 'Family-owned since 1919',
    logo: 'CMF', logoCls: 'from-butter to-coral', price: '$10–18', range: '$100K – $2M coverage levels',
    points: [
      'Highest coverage limits available',
      'Personalized service (call them direct)',
      'License protection included',
      'Best for live-in caregivers',
    ],
    cta: 'Apply with CM&F →', ctaCls: 'border border-ink/20 text-deepteal hover:bg-mist', note: '20 min · phone or online',
  },
];

const COMPARE_ROWS = [
  { label: 'Professional liability (per claim)', nso: '$1M', hpso: '$1M', cmf: '$2M' },
  { label: 'Aggregate (per year)', nso: '$3M', hpso: '$3M', cmf: '$6M' },
  { label: 'Legal defense costs', nso: '✓', hpso: '✓', cmf: '✓', check: true },
  { label: 'License protection', nso: '✓ $25K', hpso: '✓ $25K', cmf: '✓ $25K', check: true },
  { label: 'HIPAA breach response', nso: '✓ add-on', hpso: '✓ included', cmf: '✓ add-on', check: true },
  { label: 'Sexual misconduct defense', nso: '$25K', hpso: '$25K', cmf: '$25K' },
  { label: 'Covers all Kindred work?', nso: '✓', hpso: '✓', cmf: '✓', check: true },
];

const FAQS = [
  { q: 'Is insurance required to work on Kindred?', a: "Right now — not required. But it's strongly recommended, and we're considering making it a requirement for the Top-Rated tier. Bottom line: it's cheap (under $10/mo for solid coverage), and one claim without it could wipe out a year of earnings. Most professional CNAs carry it." },
  { q: "Doesn't Kindred have its own coverage that covers me?", a: "Kindred carries platform-level coverage (errors & omissions, cyber, general liability) — but as a 1099 contractor, you're not an employee, so we can't extend our coverage to you directly. Think of it like Uber: the company has insurance, but drivers carry their own too. That's why we negotiated these group rates for you." },
  { q: 'How fast does coverage kick in?', a: 'With NSO, coverage can start the same day you apply. With HPSO and CM&F, it\u2019s usually 1–3 business days. All three will email you a Certificate of Insurance (COI) you can show clients or facilities.' },
  { q: 'What if I work at a facility too (not just Kindred)?', a: 'All three policies cover you anywhere you provide CNA services — Kindred clients, agency work, facility work, even direct private clients you find yourself. One policy travels with you.' },
  { q: 'Does Kindred get a commission?', a: 'Yes — but only on NSO. We earn a small affiliate fee for each caregiver who signs up through our link. It doesn\u2019t change your price; in fact, NSO\u2019s group rate through us is cheaper than going direct. The other two providers we recommend even though we don\u2019t earn anything on them.' },
  { q: 'Can I cancel anytime?', a: 'Yes. All three offer month-to-month with no cancellation fees. If you switch carriers or leave caregiving, you can pause or cancel with about 30 days notice.' },
];

export default function CnaGetInsuredPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-butter/20 blur-3xl pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 fade-up relative grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-coral/30 bg-coral/10 backdrop-blur text-xs font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              Exclusive Kindred group rate
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Protect your work</div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              Insurance that <span className="italic font-medium text-gradient">actually fits</span> a 1099 CNA.
            </h1>
            <p className="text-ink/70 mt-5 text-lg leading-relaxed max-w-xl">
              As an independent caregiver, you&rsquo;re responsible for your own liability coverage.
              We&rsquo;ve vetted three trusted partners and negotiated group rates — pick what fits
              your situation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 items-center text-sm">
              <span className="inline-flex items-center gap-1.5 text-deepteal">✓ <span>Group rate</span></span>
              <span className="opacity-30">·</span>
              <span className="inline-flex items-center gap-1.5 text-deepteal">✓ <span>Apply in 10 minutes</span></span>
              <span className="opacity-30">·</span>
              <span className="inline-flex items-center gap-1.5 text-deepteal">✓ <span>Coverage starts same day</span></span>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-cream border border-ink/15 rounded-3xl p-6 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full">
                Our recommendation
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2 mt-2">Starts at</div>
              <div className="font-display text-5xl font-light">
                $<span className="font-medium">8</span><span className="text-xl text-ink/60">/mo</span>
              </div>
              <div className="text-sm text-ink/70 mt-1">$100K professional liability — paid monthly or annual</div>
              <div className="mt-5 space-y-2 text-sm">
                {['Covers claims while caring for clients', 'Pays for legal defense', 'Portable — covers you everywhere', 'Cancel anytime, no contract'].map((t) => (
                  <div key={t} className="flex items-start gap-2"><span className="text-sage">✓</span><span>{t}</span></div>
                ))}
              </div>
              <a href="#nso" className="block mt-5 bg-deepteal text-cream text-center py-3 rounded-full text-sm font-medium hover:bg-inkdark transition">
                See NSO plan →
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-6 pb-16">
        {/* WHY YOU NEED IT */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <h2 className="font-display text-3xl font-medium mb-3">Why caregivers carry their own coverage</h2>
          <p className="text-ink/70 max-w-2xl mb-8">
            As a 1099 contractor on Kindred, you&rsquo;re not an employee — which means you&rsquo;re
            not under an employer&rsquo;s insurance umbrella. The good news: a basic policy is
            cheaper than a phone plan and protects against the rare-but-real situations that can
            derail your career.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🩹', title: 'A client falls in your care', body: "Even when it's not your fault, families sometimes pursue claims. Liability insurance handles legal defense and any settlement." },
              { icon: '💊', title: 'A medication misunderstanding', body: "If a client claims a reminder went wrong, you'll want professional liability coverage to defend your practice and reputation." },
              { icon: '🏠', title: 'Something gets damaged', body: "Knocked over a TV during a transfer? General liability protects against property damage at the client's home." },
            ].map((c) => (
              <div key={c.title} className="card-hover bg-white border border-ink/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">{c.icon}</div>
                <div className="font-display text-lg font-medium mb-2">{c.title}</div>
                <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARE PARTNERS */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.15s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Compare</div>
          <h2 className="font-display text-3xl font-medium mb-2">Our three vetted partners</h2>
          <p className="text-ink/70 max-w-2xl mb-8">
            All three are well-established. Pick by price, coverage limit, or claims experience.
            Click any &ldquo;Apply&rdquo; to start — we&rsquo;ll pass through your basic info so
            you&rsquo;re not re-typing it.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PARTNERS.map((p) => (
              <div
                key={p.id}
                id={p.id}
                className={`card-hover bg-white rounded-3xl p-6 relative ${p.recommended ? 'border-2 border-coral/40' : 'border border-ink/10'}`}
              >
                {p.recommended && (
                  <div className="absolute -top-3 right-5 bg-coral text-cream text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.logoCls} flex items-center justify-center text-cream font-display text-lg font-bold`}>
                    {p.logo}
                  </div>
                  <div>
                    <div className="font-display text-xl font-medium">{p.name}</div>
                    <div className="text-xs text-ink/60">{p.sub}</div>
                  </div>
                </div>
                <div className="text-3xl font-display font-medium">
                  {p.price}<span className="text-lg text-ink/60">/mo</span>
                </div>
                <div className="text-xs text-ink/60">{p.range}</div>
                <div className="mt-5 space-y-2 text-sm border-t border-ink/10 pt-5">
                  {p.points.map((pt, i) => {
                    const muted = p.lastMuted && i === p.points.length - 1;
                    return (
                      <div key={pt} className="flex items-start gap-2">
                        <span className={muted ? 'text-ink/40' : 'text-sage'}>{muted ? '○' : '✓'}</span>
                        <span className={muted ? 'text-ink/60' : ''}>{pt}</span>
                      </div>
                    );
                  })}
                </div>
                <a href="#" className={`block mt-6 text-center py-3 rounded-full text-sm font-medium transition ${p.ctaCls}`}>
                  {p.cta}
                </a>
                <div className="text-[10px] text-ink/50 mt-2 text-center font-mono">{p.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-creamdark/70 border border-ink/10 rounded-2xl p-4 text-xs text-ink/70 leading-relaxed flex items-start gap-3">
            <span className="text-base">💡</span>
            <div>
              <strong className="text-ink">Full transparency:</strong> Kindred earns a small
              affiliate commission when you sign up through us — but only with NSO. We listed HPSO
              and CM&amp;F because they&rsquo;re legitimately good options for some caregivers, even
              though we don&rsquo;t make a cent on those referrals. Pick what&rsquo;s best for you.
            </div>
          </div>
        </section>

        {/* BENEFITS TABLE */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.2s' }}>
          <h2 className="font-display text-3xl font-medium mb-6">What&rsquo;s actually covered?</h2>
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-4 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
              <div className="col-span-6">Coverage</div>
              <div className="col-span-2 text-center">NSO</div>
              <div className="col-span-2 text-center">HPSO</div>
              <div className="col-span-2 text-center">CM&amp;F</div>
            </div>
            {COMPARE_ROWS.map((row, i, arr) => (
              <div key={row.label} className={`compare-row grid grid-cols-12 gap-4 px-5 py-3 text-sm items-center hover:bg-creamdark ${i < arr.length - 1 ? 'border-b border-ink/10' : ''}`}>
                <div className="col-span-6">{row.label}</div>
                <div className={`col-span-2 text-center ${row.check ? 'text-sage' : 'font-mono'}`}>{row.nso}</div>
                <div className={`col-span-2 text-center ${row.check ? 'text-sage' : 'font-mono'}`}>{row.hpso}</div>
                <div className={`col-span-2 text-center ${row.check ? 'text-sage' : 'font-mono'}`}>{row.cmf}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
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

        {/* BOTTOM CTA */}
        <section className="fade-up" style={{ animationDelay: '.3s' }}>
          <div className="bg-gradient-to-br from-butter/30 to-coral/15 border border-coral/20 rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="text-5xl">🛡️</div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-2">Take 10 minutes today</div>
              <h2 className="font-display text-3xl font-medium mb-3">Don&rsquo;t think about it for the rest of the year.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-xl">
                $8/month is less than your morning coffee. Sign up once, set it to auto-renew, and
                stop worrying. We&rsquo;ve made it about as easy as we possibly could.
              </p>
            </div>
            <a href="#nso" className="bg-deepteal text-cream px-8 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition whitespace-nowrap">
              Start with NSO →
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
