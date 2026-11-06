/**
 * /become-a-cna — for people who aren't certified yet. Ported from
 * Front-End/Homepage/become-cna.html, but HONEST:
 *
 * The mock describes a "Kindred Pathway" free bootcamp with a GUARANTEED job,
 * 94% pass / 100% placement stats, $48–62k earnings, statewide centers, a fake
 * cohort date, and fabricated graduate testimonials. None of that exists, and
 * job/earnings guarantees are legally dangerous to publish. So this version:
 *   - keeps the design, the "who this is for", and an honest description of what
 *     becoming a CNA in Florida actually involves;
 *   - removes every guarantee, fabricated statistic, fake cohort, and fake quote;
 *   - frames Kindred's role as what it really is today: building partnerships
 *     with state-approved programs, and welcoming you once you're certified.
 *
 * Server component (static + <details> FAQ). No fabricated data.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default function BecomeCnaPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 -right-20 w-[40rem] h-[40rem] rounded-full bg-sage/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-[36rem] h-[36rem] rounded-full bg-sky/15 blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 fade-up">
              <div className="inline-flex items-center gap-2 bg-coral/10 border border-coral/30 rounded-full px-3 py-1 text-xs font-mono uppercase tracking-widest text-coral mb-4">
                Kindred Pathway · in development
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
                Thinking about becoming a CNA?{' '}
                <span className="italic font-medium text-gradient">We&apos;ll help you find the path.</span>
              </h1>
              <p className="text-lg text-ink/75 max-w-xl leading-relaxed mb-7">
                If you&apos;ve ever cared for a family member and thought &ldquo;I&apos;d be good at
                this&rdquo; — you&apos;re right. Certification is a fast on-ramp, and we&apos;re
                building partnerships with state-approved Florida programs to help you get there and
                join Kindred once you&apos;re certified.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="#how" className="bg-coral text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition">
                  See the path →
                </Link>
                <Link href="/apply" className="bg-white border border-ink/15 px-6 py-3 rounded-full text-sm hover:bg-mist transition">
                  Already a CNA? Apply
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-ink/60 font-mono">
                <span>✓ FL state-approved programs</span>
                <span>✓ Roughly 4–6 weeks</span>
                <span>✓ Join Kindred once certified</span>
              </div>
            </div>

            {/* Honest "path at a glance" card (replaces fabricated grad-pay/stat card) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-ink/10 rounded-3xl p-7 shadow-xl">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-4">The path at a glance</div>
                <ol className="space-y-4">
                  {[
                    ['1', 'Classroom & online learning', 'Anatomy, infection control, communication, dementia and end-of-life basics.'],
                    ['2', 'Hands-on clinical skills', 'Transfers, vitals, and personal care with a licensed instructor.'],
                    ['3', 'Florida state exam', 'Pass it, and your license is typically issued within a week.'],
                    ['4', 'Join Kindred', 'Apply, complete vetting, and start finding your own clients.'],
                  ].map(([n, t, d]) => (
                    <li key={n} className="flex gap-3">
                      <span className="w-7 h-7 rounded-full bg-kindred-gradient text-cream flex items-center justify-center font-display text-sm flex-shrink-0">{n}</span>
                      <span>
                        <span className="block font-medium text-sm">{t}</span>
                        <span className="block text-xs text-ink/60 leading-relaxed">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 pt-4 border-t border-ink/10 text-xs text-ink/55">
                  Most Florida CNA programs run about 4–6 weeks. We&apos;ll point you to ones in your
                  area as our partnerships come online.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">This path is for you if</div>
            <h2 className="font-display text-3xl md:text-4xl font-light">
              You&apos;re <span className="italic font-medium text-gradient">already a caregiver</span> — you just don&apos;t have the credentials yet.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              ['👵', 'You cared for a parent or grandparent', 'You spent years figuring out medication schedules, mobility, and dignity in the hard moments. That\u2019s experience money can\u2019t buy.'],
              ['🔄', 'You\u2019re switching careers', 'Hospitality, retail, manufacturing — if your last job meant being on your feet and being kind, you\u2019ve got the bones for this.'],
              ['🎓', 'You\u2019re starting out', 'Fresh out of high school or community college? CNA is a fast on-ramp to healthcare. Many go on — LPN, RN, paramedic.'],
            ].map(([icon, title, body]) => (
              <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="font-display text-lg font-medium mb-2">{title}</div>
                <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE PATH (honest description of CNA certification) */}
      <section id="how" className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">What becoming a CNA looks like</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-10">
          From where you are to <span className="italic font-medium">certified caregiver</span>
        </h2>

        <div className="space-y-4">
          {[
            ['1–3', 'Classroom & online learning', 'Anatomy, infection control, communication, end-of-life care, dementia basics. Many programs run evenings or weekends so you can keep your current job.', '~80 hrs'],
            ['4', 'Hands-on clinical skills lab', 'In person at a state-approved training center. Practice transfers, vitals, and personal care on real equipment with a licensed RN instructor.', '40 hrs · in-person'],
            ['5', 'Clinical rotation', 'Shadow at a facility under a charge nurse — real residents, real shifts, real feedback. This is where you find out if this work is for you.', '40 hrs · in-person'],
            ['6', 'Florida state exam + join Kindred', 'Pass the state exam, your license is issued in about a week, then apply to Kindred — a real interview, full vetting, and your own profile.', 'Exam + apply'],
          ].map(([wk, title, body, meta]) => (
            <div key={wk} className="step-card bg-white border border-ink/10 rounded-2xl p-6 grid md:grid-cols-[120px_1fr_auto] gap-4 items-center card-hover">
              <div className="text-center">
                <div className="font-mono text-xs text-ink/50 uppercase tracking-widest">Week</div>
                <div className="font-display text-3xl font-medium text-deepteal">{wk}</div>
              </div>
              <div>
                <div className="font-display text-xl font-medium mb-1">{title}</div>
                <p className="text-sm text-ink/75 leading-relaxed">{body}</p>
              </div>
              <div className="text-xs font-mono text-ink/50 md:text-right whitespace-nowrap">{meta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COST — honest */}
      <section className="bg-deepteal text-cream py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">What it costs</div>
              <h2 className="font-display text-4xl md:text-5xl font-light leading-tight mb-4">
                Straight talk on <span className="italic font-medium">tuition.</span>
              </h2>
              <p className="text-cream/85 leading-relaxed mb-5">
                Most Florida CNA programs run roughly $750–$1,500 out of pocket, and many offer
                payment plans or financial aid. We&apos;re working to partner with schools so we can
                point you to good options near you — and we&apos;ll be honest about the cost rather
                than promise something we can&apos;t yet deliver.
              </p>
              <p className="text-cream/85 leading-relaxed">
                Free and subsidized training is something we want to build toward. When it&apos;s
                real, you&apos;ll hear it here — not a day sooner.
              </p>
            </div>
            <div className="md:col-span-6">
              <div className="bg-cream/10 border border-cream/20 rounded-3xl p-7">
                <div className="font-display text-xl mb-5">What you&apos;ll complete to get certified</div>
                <ul className="space-y-3 text-sm">
                  {[
                    'Classroom + online curriculum',
                    'Skills lab & clinical rotation',
                    'Florida state CNA exam',
                    'Level 2 background check',
                    'CPR / BLS certification',
                    'TB clearance',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2"><span className="text-butter mt-0.5">✓</span> {item}</li>
                  ))}
                </ul>
                <p className="text-xs text-cream/60 mt-5">These are the standard Florida requirements — the same things you&apos;ll have ready when you apply to Kindred.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORIES — honest placeholder */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Pathway grads</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-3">
            The first stories are <span className="italic font-medium text-gradient">still being written.</span>
          </h2>
          <p className="text-ink/70 leading-relaxed">
            As our first caregivers come through this path, their stories — in their own words — will
            live right here. We won&apos;t borrow anyone else&apos;s.
          </p>
        </div>
      </section>

      {/* CTA — honest interest, no fake cohort */}
      <section id="apply" className="bg-mist/40 py-16">
        <div className="max-w-[760px] mx-auto px-6 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Want in early?</div>
          <h2 className="font-display text-4xl md:text-5xl font-light mb-3">
            We&apos;re lining up <span className="italic font-medium text-gradient">training partners</span> now.
          </h2>
          <p className="text-ink/75 mb-8 max-w-xl mx-auto">
            Tell us you&apos;re interested and we&apos;ll reach out as soon as there&apos;s a program
            we can point you to. Already certified? You can apply to Kindred today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="bg-deepteal text-cream px-7 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
              Tell us you&apos;re interested →
            </Link>
            <Link href="/apply" className="bg-white border border-ink/15 px-7 py-3.5 rounded-full text-sm hover:bg-white/70 transition">
              Already a CNA? Apply now
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ — kept the honest/educational ones, dropped program-specific fabrications */}
      <section className="max-w-[900px] mx-auto px-6 py-16">
        <h2 className="font-display text-3xl font-light text-center mb-10">Common questions</h2>
        <div className="space-y-3">
          <Faq q="Do I need a high school diploma?">
            Yes — Florida requires a high school diploma or GED for CNA licensure. If you&apos;re
            still working on your GED, finish that first; we can help point you toward free GED
            resources.
          </Faq>
          <Faq q="Does Kindred run the training itself?">
            Not yet. Today we&apos;re building relationships with state-approved Florida programs so
            we can help match you to one and welcome you onto Kindred once you&apos;re certified.
            We&apos;ll be upfront about exactly what we offer at each step rather than overpromise.
          </Faq>
          <Faq q="Will my background disqualify me?">
            Florida AHCA rules disqualify certain convictions (violent crimes, abuse, and financial
            crimes against the elderly). Many other backgrounds are workable. The honest answer is
            it depends — and a program can tell you before you invest time.
          </Faq>
          <Faq q="Can I do this while working full-time?">
            Often, yes. The classroom/online portion is usually flexible; the in-person clinical
            stretch needs more dedicated time. Many students take a couple of weeks of leave for that
            part.
          </Faq>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="bg-white border border-ink/10 rounded-2xl p-5 group">
      <summary className="font-medium cursor-pointer flex items-center justify-between">
        {q}
        <span className="text-deepteal text-xl group-open:rotate-45 transition">+</span>
      </summary>
      <p className="text-sm text-ink/75 mt-3 leading-relaxed">{children}</p>
    </details>
  );
}
