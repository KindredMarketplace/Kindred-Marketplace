/**
 * Public marketing homepage — ported 1:1 from Front-End/Homepage/KindredHomepage.html.
 *
 * Anyone can view this without an account (the whole point — no Care.com-style
 * login wall). Faithful to the mock's design, but REAL where the mock was fake:
 *   - Browse pulls real approved caregivers; honest empty state when there are none.
 *   - No fabricated counts/stats (no "2,341 caregivers", no "1,847 hours").
 *   - No fake testimonials or fake "partner" schools — honest "coming soon".
 *   - The Apply section reflects the real application we built (resume + one
 *     short video), not the old 5-step form or the unverified fee/earnings claims.
 *
 * Server component; reads LISTED caregivers through browse_caregivers(), the
 * locked-preview RPC (first initial only unless the viewer is a member).
 *
 * Copy reset Nov 2026 for the platform model: tagline "A better way to
 * connect.", no "feels like family", no CNA training pipeline, no insurance
 * billing, no payments through Kindred.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KindredMark } from '@/components/KindredMark';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getAllPlans } from '@/lib/membership';
import { dollars, KINDRED_STANDARD } from '@/lib/membership-shared';

export const dynamic = 'force-dynamic';

type CaregiverRow = {
  user_id: string;
  display_name: string | null;
  headline: string | null;
  hourly_rate_cents: number | null;
  years_experience: number | null;
  service_zip: string | null;
  languages: string[] | null;
  identity_unlocked: boolean;
};

const AV = ['av-1', 'av-2', 'av-3', 'av-4', 'av-6', 'av-7', 'av-9'];

const TICKER = [
  '✦ Personal interview with every caregiver',
  'Level 2 background check',
  'ID verified',
  'Every caregiver carries their own insurance',
  '1,500+ hours of hands-on experience',
  'Caregivers set their own rates',
  'No agency in the middle',
];

const QUICK_FILTERS = [
  'Overnight care', 'Dementia experience', 'Bilingual', 'Hoyer lift trained',
  'Hospice support', 'Post-surgical recovery',
];

// Every listed caregiver has all of these (it's what "listed" means), so the
// homepage filter preview shows them as the standard, not as optional filters.
const VERIFICATIONS = [
  ['Level 2 background check', 'Florida fingerprint screening'],
  ['Carries their own liability insurance', 'Proof uploaded and checked'],
  ['ID verified', 'Government photo ID confirmed'],
  ['1,500+ hours of experience', 'Hands-on care, not just a certificate'],
];

const SERVICE_GROUPS = [
  { group: 'Activities of daily living', items: ['Bathing & showering', 'Grooming & hygiene', 'Foot care', 'Oral care', 'Dressing', 'Toileting & incontinence', 'Feeding assistance'] },
  { group: 'Mobility', items: ['Ambulating', 'Transfers (bed/chair)', 'Hoyer / mechanical lift', 'Range-of-motion', 'Repositioning / turning'] },
  { group: 'Clinical & monitoring', items: ['Vital signs', 'Medication reminders', 'Catheter / ostomy care', 'Wound observation', 'Blood glucose monitoring'] },
  { group: 'Specialty care', items: ["Dementia / Alzheimer's", 'Hospice support', 'Post-surgical recovery', 'Pediatric care'] },
  { group: 'Household support', items: ['Meal prep', 'Light housekeeping', 'Laundry', 'Errands & transportation', 'Companionship'] },
];

const LANGUAGES = ['English', 'Español', 'Kreyòl', 'ASL', 'Tagalog'];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data }, plans] = await Promise.all([supabase.rpc('browse_caregivers'), getAllPlans(supabase)]);

  const cnas = (data ?? []).slice(0, 9) as CaregiverRow[];
  const familyPlan = plans.find((p) => p.role === 'client');
  const caregiverPlan = plans.find((p) => p.role === 'cna');
  const featured = cnas[0];

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky/25 blur-3xl" />
        <div className="absolute top-40 left-1/3 w-64 h-64 rounded-full bg-butter/20 blur-3xl" />

        <div className="max-w-[1400px] mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink/15 bg-white/60 backdrop-blur text-xs font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              Launching in Gainesville, Florida
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight font-light">
              A better way
              <br />
              <span className="italic font-medium text-gradient">to connect.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/70 max-w-2xl leading-relaxed font-light">
              Families and independent caregivers, connected directly. Browse caregivers who meet
              the Kindred Standard, see their rates up front, talk to them before you choose, and hire
              them yourself. No agency in the middle, and no cut taken from anyone&apos;s pay.
            </p>

            {/* Mobile search */}
            <form action="/browse" className="lg:hidden mt-8 bg-white border border-ink/15 rounded-2xl p-2 flex flex-col gap-2">
              <input name="q" placeholder="What kind of care do you need?" className="px-4 py-3 text-sm bg-cream rounded-xl focus:outline-none" />
              <input name="zip" placeholder="📍 ZIP or city" className="px-4 py-3 text-sm bg-cream rounded-xl focus:outline-none" />
              <button className="bg-deepteal text-cream py-3 rounded-xl text-sm font-medium">Find caregivers</button>
            </form>

            {/* Quick filters */}
            <div className="hidden lg:flex flex-wrap gap-2 mt-10">
              <span className="text-xs uppercase tracking-widest text-ink/50 self-center mr-2 font-mono">Popular —</span>
              {QUICK_FILTERS.map((f) => (
                <Link key={f} href="/browse" className="px-4 py-1.5 text-xs bg-white border border-ink/15 rounded-full hover:bg-deepteal hover:text-cream hover:border-deepteal transition">
                  {f}
                </Link>
              ))}
            </div>
          </div>

          {/* Visual: featured real caregiver + honest brand cards */}
          <div className="lg:col-span-5 relative h-[520px] hidden lg:block">
            {featured ? (
              <div className="absolute top-4 right-0 w-72 bg-white rounded-2xl p-5 rotate-3 hover:rotate-0 transition-transform duration-500" style={{ boxShadow: '0 30px 60px -20px rgba(46,110,115,0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full av-1 flex items-center justify-center font-display text-2xl text-white font-medium relative">
                    {(featured.display_name ?? 'K').charAt(0)}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <KindredMark size={12} />
                    </span>
                  </div>
                  <div>
                    <div className="font-display text-lg font-medium">{featured.identity_unlocked ? featured.display_name : `${(featured.display_name ?? 'K').charAt(0)}.`}</div>
                    <div className="text-xs text-ink/60">
                      Caregiver{featured.years_experience ? ` · ${featured.years_experience} yrs` : ''}
                      {featured.service_zip ? ` · ${featured.service_zip}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-3">
                  <span className="bg-sage/20 text-deepteal px-2 py-0.5 rounded-full font-medium">✓ Kindred Standard</span>
                  {featured.languages?.slice(0, 2).map((l) => (
                    <span key={l} className="bg-sky/20 text-deepteal px-2 py-0.5 rounded-full font-medium">{l}</span>
                  ))}
                </div>
                {featured.headline && (
                  <div className="text-sm text-ink/70 italic font-display">&ldquo;{featured.headline}&rdquo;</div>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/10">
                  <span className="text-xs text-deepteal font-medium">New to Kindred</span>
                  {featured.hourly_rate_cents != null && (
                    <div className="font-display text-xl font-medium">
                      ${(featured.hourly_rate_cents / 100).toFixed(0)}
                      <span className="text-xs text-ink/50 font-sans">/hr</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-0 w-72 bg-white rounded-2xl p-6 rotate-3" style={{ boxShadow: '0 30px 60px -20px rgba(46,110,115,0.3)' }}>
                <KindredMark size={40} />
                <div className="font-display text-xl font-medium mt-4 mb-2">Caregivers, coming soon</div>
                <p className="text-sm text-ink/60">We&apos;re onboarding our founding caregivers right now. Be the first to know when Browse opens.</p>
              </div>
            )}

            {/* Honest brand card */}
            <div className="absolute top-44 left-0 w-64 bg-deepteal text-cream rounded-2xl p-5 -rotate-6 hover:rotate-0 transition-transform duration-500" style={{ boxShadow: '0 30px 60px -20px rgba(46,110,115,0.4)' }}>
              <div className="text-xs uppercase tracking-widest opacity-60 mb-2 font-mono">Our promise</div>
              <div className="font-display text-2xl leading-tight font-light">Interviewed, background-checked, ID-verified and insured. Every one.</div>
            </div>

            {/* Brand accent card */}
            <div className="absolute bottom-4 right-12 w-60 bg-butter rounded-2xl p-4 rotate-6 hover:rotate-0 transition-transform duration-500" style={{ boxShadow: '0 20px 40px -15px rgba(46,110,115,0.25)' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-deepteal/70 mb-2">Why Kindred</div>
              <div className="font-display text-sm leading-snug text-deepteal italic">You hire the caregiver directly. They keep 100% of their rate.</div>
            </div>
          </div>
        </div>

        {/* Trust ticker */}
        <div className="border-y border-ink/10 bg-mist py-3 overflow-hidden">
          <div className="ticker flex gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-deepteal/70">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how" className="py-24 max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
          <div className="md:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— How it works</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light">
              Hire care the way it <span className="italic squiggle-under">should</span> work.
            </h2>
          </div>
          <p className="md:col-span-5 md:col-start-7 text-ink/70 leading-relaxed">
            Healthcare is going direct. Home care should too. Kindred makes the connection, then gets
            out of the way, whether you need a few hours a week or round-the-clock care.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <HowCard n="01" title="Browse for free">
            See real caregivers near you: their experience, services, languages and rate. Every one
            meets the Kindred Standard. Names and photos unlock when you join.
          </HowCard>
          <HowCard n="02" title="Talk before you choose">
            Message caregivers, set up a call, meet in person. Ask what matters to you. Talk to as
            many as you like.
          </HowCard>
          <HowCard n="03" title="Hire them directly">
            You and your caregiver agree on the work and the schedule, and you pay them directly at
            the rate they set. Kindred never takes a cut.
          </HowCard>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-ink/20 to-transparent" />
      </div>

      {/* ===================== BROWSE PREVIEW ===================== */}
      <section id="browse" className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Find your caregiver</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light">
              {cnas.length} {cnas.length === 1 ? 'caregiver' : 'caregivers'} near{' '}
              <span className="italic">Gainesville, FL</span>
            </h2>
          </div>
          <Link href="/browse" className="bg-white border border-ink/15 rounded-full px-5 py-2.5 text-sm hover:border-teal transition">
            Open full Browse →
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Filters (preview — full filtering lives on /browse) */}
          <aside className="lg:col-span-3">
            <form action="/browse" className="bg-white rounded-2xl border border-ink/10 p-6 lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-medium">Filters</h3>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40">Preview</span>
              </div>

              <FilterGroup label="Distance">
                <div className="flex items-center justify-between text-sm mb-2"><span>Within</span><span className="font-medium font-display text-deepteal">25 mi</span></div>
                <input name="distance" type="range" min={5} max={100} defaultValue={25} step={5} className="w-full" />
              </FilterGroup>

              <FilterGroup label="Hourly rate">
                <div className="flex items-center justify-between text-sm mb-2"><span>Up to</span><span className="font-medium font-display text-deepteal">$50/hr</span></div>
                <input name="rate" type="range" min={15} max={80} defaultValue={50} step={1} className="w-full" />
              </FilterGroup>

              <FilterGroup label="Gender preference">
                <div className="space-y-2">
                  {['No preference', 'Female', 'Male', 'Non-binary'].map((g, i) => (
                    <label key={g} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-ink/15 cursor-pointer text-sm">
                      <input type="radio" name="gender" defaultChecked={i === 0} className="accent-deepteal" /> {g}
                    </label>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Verification">
                <div className="space-y-2.5">
                  {VERIFICATIONS.map(([title, sub]) => (
                    <label key={title} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-ink/30 accent-deepteal" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium group-hover:text-deepteal transition">{title}</span>
                        <span className="block text-xs text-ink/50">{sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Services offered">
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {SERVICE_GROUPS.map((g) => (
                    <div key={g.group}>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink/40 pt-1">— {g.group}</div>
                      {g.items.map((s) => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer text-sm hover:text-deepteal transition py-0.5">
                          <input type="checkbox" className="w-3.5 h-3.5 rounded border-ink/30 accent-deepteal" /> {s}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Languages" last>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => (
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full border border-ink/15">{l}</span>
                  ))}
                </div>
              </FilterGroup>

              <button className="w-full mt-5 bg-deepteal text-cream py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
                Apply filters on Browse →
              </button>
            </form>
          </aside>

          {/* Real caregiver grid */}
          <div className="lg:col-span-9">
            {cnas.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-ink/10">
                <div className="font-display text-3xl font-light mb-3">Our founding caregivers are being vetted now.</div>
                <p className="text-ink/60 mb-6 max-w-md mx-auto">Every caregiver has to meet the Kindred Standard before they appear here. The first profiles are coming soon.</p>
                <Link href="/kindred-standard" className="bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition inline-block">
                  See what every caregiver has to show
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cnas.map((c, i) => (
                  <CaregiverCard key={c.user_id} c={c} av={AV[i % AV.length]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== THE KINDRED STANDARD ===================== */}
      <section id="standard" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deepteal via-teal to-sky" />
        <div className="relative max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center text-white">
          <div className="lg:col-span-6">
            <div className="text-xs font-mono uppercase tracking-widest opacity-80 mb-4">— The Kindred Standard</div>
            <h2 className="font-display text-4xl md:text-6xl font-light leading-[1.05] mb-6">
              Five things.
              <br />
              <span className="italic">No exceptions.</span>
            </h2>
            <p className="text-lg opacity-90 leading-relaxed mb-8 max-w-lg font-light">
              Before anyone can appear on Kindred, they have to show us every one of these. When a
              background check or insurance policy expires, they drop out of search until it&apos;s
              renewed.
            </p>
            <Link href="/kindred-standard" className="bg-white text-deepteal px-7 py-3.5 rounded-full font-medium hover:bg-cream transition shadow-lg inline-block">
              Read the full standard →
            </Link>
          </div>
          <div className="lg:col-span-6">
            <ul className="bg-white/95 text-ink rounded-3xl p-6 sm:p-8 space-y-4">
              {KINDRED_STANDARD.map((item) => (
                <li key={item.key} className="flex gap-3 items-start">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-deepteal text-cream flex items-center justify-center text-xs shrink-0">✓</span>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-ink/60">{item.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== APPLY (new flow) ===================== */}
      <section id="apply" className="py-24 max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Apply to Kindred</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light mb-6">
              Experienced caregiver? <span className="italic">Work on your own terms.</span>
            </h2>
            <p className="text-ink/70 leading-relaxed mb-8">
              Set your own rate. Choose your own clients. Work on your own schedule. We keep the bar
              high so the families who find you already trust the badge next to your name.
            </p>
            <div className="space-y-5">
              <ApplyPoint icon="$">
                <strong className="text-deepteal">You set your rate.</strong> You&apos;re an independent caregiver, not an agency employee — you decide what your time is worth.
              </ApplyPoint>
              <ApplyPoint icon="⏱">
                <strong className="text-deepteal">You choose the work.</strong> Pick the clients and shifts that fit your life. No mandatory hours, no on-call rotations.
              </ApplyPoint>
              <ApplyPoint icon="❤">
                <strong className="text-deepteal">A real human reviews you.</strong> Not a form and a robot. We interview every caregiver, because the families trusting you deserve that.
              </ApplyPoint>
            </div>
          </div>

          {/* Honest application preview → links to /apply */}
          <div className="lg:col-span-7 bg-white border border-ink/10 rounded-3xl p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-medium">The application</h3>
              <span className="text-xs font-mono text-ink/50">About 5 minutes</span>
            </div>
            <p className="text-ink/70 leading-relaxed mb-6">
              We keep it short on purpose. Send your resume, a few details, and answer{' '}
              <strong className="text-deepteal">one question</strong> on a short video — or just your
              voice, if you&apos;d rather.
            </p>
            <div className="rounded-2xl border border-teal/30 bg-sage/10 p-5 mb-6">
              <div className="text-xs font-medium uppercase tracking-wider text-deepteal mb-2">Your one question</div>
              <p className="font-display text-xl text-ink leading-snug">
                Tell us about a client who stuck with you — something they said or did, good or hard,
                that you still carry.
              </p>
            </div>
            <div className="mb-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">If we move forward, you&apos;ll verify</div>
              <div className="grid grid-cols-2 gap-2">
                {[['Level 2 background', 'fingerprint check'], ['ID verification', 'government photo ID'], ['Liability insurance', 'your own policy'], ['1,500+ hours', 'hands-on experience']].map(([t, s]) => (
                  <div key={t} className="bg-mist/60 rounded-lg p-3 text-xs">
                    <div className="font-medium mb-0.5">{t}</div>
                    <div className="text-ink/50">{s}</div>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/apply" className="block w-full bg-deepteal text-cream py-4 rounded-full font-medium text-center hover:bg-inkdark transition">
              Start your application →
            </Link>
            <p className="text-center text-xs text-ink/50 mt-4">Verification only happens after a real conversation — not before.</p>
          </div>
        </div>
      </section>

      {/* ===================== HOW KINDRED MAKES MONEY ===================== */}
      <section id="pricing" className="bg-mist/40 py-24">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Straight answers</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light">
              How Kindred <span className="italic">makes money.</span>
            </h2>
            <p className="text-ink/70 mt-4 max-w-2xl mx-auto">
              Only from memberships. We don&apos;t take a percentage of care, we don&apos;t add a fee to a
              caregiver&apos;s rate, and we never sit between what a family pays and what a caregiver
              earns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-7 border border-ink/10">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For families</div>
              {familyPlan ? (
                <div className="font-display text-4xl font-medium">
                  {dollars(familyPlan.monthly_cents)}<span className="text-base text-ink/50 font-sans">/month</span>
                </div>
              ) : (
                <div className="font-display text-2xl font-medium">Membership</div>
              )}
              {familyPlan && familyPlan.startup_fee_cents > 0 && (
                <div className="text-sm text-ink/60 mt-1">+ {dollars(familyPlan.startup_fee_cents)} one-time startup fee</div>
              )}
              <ul className="text-sm text-ink/70 space-y-1.5 mt-5">
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Browse free, before you pay anything</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Names, photos and messaging unlock with membership</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> You pay your caregiver directly, at their rate</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-7 border border-ink/10">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For caregivers</div>
              {caregiverPlan ? (
                <div className="font-display text-4xl font-medium">
                  {dollars(caregiverPlan.monthly_cents)}<span className="text-base text-ink/50 font-sans">/month</span>
                </div>
              ) : (
                <div className="font-display text-2xl font-medium">Membership</div>
              )}
              <div className="text-sm text-deepteal font-medium mt-1">First 25 approved caregivers: a full year free</div>
              <ul className="text-sm text-ink/70 space-y-1.5 mt-5">
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Set your own rate and keep all of it</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Choose your hours, your area and your families</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> No agency, no insurance billing paperwork</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 overflow-hidden">
            <Faq q="Who employs the caregiver?">
              You do. Kindred is a platform, not an agency. You and your caregiver agree on the work,
              the schedule and the rate, and you pay them directly. If you hire someone for many hours
              a week, it&apos;s worth reading up on household-employer rules or using a household payroll
              service.
            </Faq>
            <Faq q="Can I use Medicare, Medicaid or insurance?">
              Not through Kindred. Kindred is for families paying privately. Some long-term care
              insurance policies reimburse families for in-home care they arrange themselves, so check
              your policy.
            </Faq>
            <Faq q="Why does it cost anything at all?" last>
              Membership pays for the vetting (interviews, background and ID checks, insurance
              verification) and for keeping Kindred running. Charging for access instead of taking a
              cut is what lets caregivers keep their full rate.
            </Faq>
          </div>
        </div>
      </section>

      {/* ===================== STORIES (honest placeholder) ===================== */}
      <section className="py-24 max-w-[1400px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Real stories</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight font-light mb-4">
            The first families are just <span className="italic">getting started.</span>
          </h2>
          <p className="text-ink/70 leading-relaxed">
            We&apos;d rather show you nothing than show you stories that aren&apos;t real. As our
            founding families and caregivers share theirs, they&apos;ll live here — in their own
            words.
          </p>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="py-24 max-w-[1400px] mx-auto px-6">
        <div className="relative bg-deepteal rounded-[2.5rem] overflow-hidden grain">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-sage/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-sky/30 blur-3xl" />
          <div className="relative px-8 md:px-16 py-20 text-center">
            <div className="flex justify-center mb-6 opacity-90"><KindredMark size={60} /></div>
            <h2 className="font-display text-4xl md:text-6xl font-light text-cream leading-tight mb-6">
              A better way
              <br />
              <span className="italic text-gradient bg-gradient-to-r from-sage via-teal to-sky">to connect.</span>
            </h2>
            <p className="text-cream/80 text-lg max-w-2xl mx-auto mb-10 font-light">
              Whether you&apos;re looking for care for someone you love, or you&apos;re an experienced
              caregiver who wants to work on your own terms, Kindred is here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/browse" className="bg-cream text-deepteal px-8 py-4 rounded-full font-medium hover:bg-coral hover:text-cream transition">Find a caregiver</Link>
              <Link href="/apply" className="border-2 border-cream/40 text-cream px-8 py-4 rounded-full font-medium hover:bg-cream hover:text-deepteal transition">Become a caregiver</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function HowCard({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-ink/10 card-hover">
      <div className="font-mono text-xs text-deepteal/60 mb-4">/ {n}</div>
      <div className="w-14 h-14 rounded-2xl bg-kindred-gradient flex items-center justify-center mb-5">
        <KindredMark size={26} />
      </div>
      <h3 className="font-display text-2xl font-medium mb-2">{title}</h3>
      <p className="text-sm text-ink/70 leading-relaxed">{children}</p>
    </div>
  );
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? 'mb-2' : 'mb-6 pb-6 border-b border-ink/10'}>
      <label className="block text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">{label}</label>
      {children}
    </div>
  );
}

function ApplyPoint({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center font-display text-deepteal flex-shrink-0">{icon}</div>
      <div className="text-sm text-ink/70 leading-relaxed pt-1">{children}</div>
    </div>
  );
}

function Faq({ q, children, last }: { q: string; children: React.ReactNode; last?: boolean }) {
  return (
    <details className={`group ${last ? '' : 'border-b border-ink/10'}`}>
      <summary className="flex items-center justify-between p-6 hover:bg-mist/40 transition">
        <span className="font-medium">{q}</span>
        <span className="text-deepteal text-2xl group-open:rotate-45 transition">+</span>
      </summary>
      <div className="px-6 pb-6 text-sm text-ink/70 leading-relaxed">{children}</div>
    </details>
  );
}

function CaregiverCard({ c, av }: { c: CaregiverRow; av: string }) {
  return (
    <article className="bg-white rounded-2xl border border-ink/10 overflow-hidden card-hover flex flex-col">
      <div className="relative">
        <div className={`h-40 ${av} relative`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 text-deepteal px-2 py-0.5 rounded-full font-medium text-[10px]">✓ Kindred Standard</span>
          </div>
        </div>
        <div className="absolute -bottom-8 left-5">
          <div className={`w-16 h-16 rounded-full ${av} border-4 border-white flex items-center justify-center font-display text-2xl text-white font-medium`}>
            {(c.display_name ?? 'K').charAt(0)}
          </div>
        </div>
      </div>
      <div className="pt-10 px-5 pb-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-medium leading-tight">
          {c.identity_unlocked ? c.display_name : `${(c.display_name ?? 'K').charAt(0)}.`}
        </h3>
        <div className="text-xs text-ink/60 mb-3">
          Caregiver{c.years_experience ? ` · ${c.years_experience} yrs` : ''}{c.service_zip ? ` · ${c.service_zip}` : ''}
        </div>
        {c.headline && <p className="text-sm text-ink/70 italic font-display leading-snug mb-3">&ldquo;{c.headline}&rdquo;</p>}
        <div className="mt-auto pt-3 border-t border-ink/10 flex items-end justify-between">
          <div>
            {c.hourly_rate_cents != null ? (
              <div className="font-display text-xl font-medium">${(c.hourly_rate_cents / 100).toFixed(0)}<span className="text-xs text-ink/50 font-sans">/hr</span></div>
            ) : (
              <div className="text-sm text-deepteal font-medium">Rate on request</div>
            )}
            {c.languages && c.languages.length > 0 && (
              <div className="text-[10px] text-ink/50 font-mono uppercase tracking-wider">{c.languages.join(' · ')}</div>
            )}
          </div>
          <Link href={`/browse`} className="bg-ink text-cream px-4 py-2 rounded-full text-xs font-medium hover:bg-coral transition">
            View profile →
          </Link>
        </div>
      </div>
    </article>
  );
}
