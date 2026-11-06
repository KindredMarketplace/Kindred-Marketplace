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
 * Server component; reads approved CNAs via the public RLS select policy.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KindredMark } from '@/components/KindredMark';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

type CaregiverRow = {
  user_id: string;
  display_name: string | null;
  headline: string | null;
  hourly_rate_cents: number | null;
  years_experience: number | null;
  service_zip: string | null;
  languages: string[] | null;
};

const AV = ['av-1', 'av-2', 'av-3', 'av-4', 'av-6', 'av-7', 'av-9'];

const TICKER = [
  '✦ Every caregiver vetted by a real human',
  'Background checks before anyone goes live',
  'HIPAA-minded messaging',
  'Hire directly — no agency markup',
  'Caregivers set their own rates',
  'Dignity first, always',
];

const QUICK_FILTERS = [
  'Overnight care', 'Dementia experience', 'Bilingual', 'Hoyer lift trained',
  'Hospice support', 'Post-surgical recovery',
];

const VERIFICATIONS = [
  ['Level 2 background check', 'FL fingerprint screening (AHCA)'],
  ['Self-insured (liability)', 'Carries personal liability + malpractice'],
  ['CPR / AED certified', 'Current within 2 years'],
  ['ID verified', 'Government photo ID confirmed'],
  ['References verified', '2+ professional references checked'],
];

const SERVICE_GROUPS = [
  { group: 'Activities of daily living', items: ['Bathing & showering', 'Grooming & hygiene', 'Foot care', 'Oral care', 'Dressing', 'Toileting & incontinence', 'Feeding assistance'] },
  { group: 'Mobility', items: ['Ambulating', 'Transfers (bed/chair)', 'Hoyer / mechanical lift', 'Range-of-motion', 'Repositioning / turning'] },
  { group: 'Clinical & monitoring', items: ['Vital signs', 'Medication reminders', 'Catheter / ostomy care', 'Wound observation', 'Blood glucose monitoring'] },
  { group: 'Specialty care', items: ["Dementia / Alzheimer's", 'Hospice support', 'Post-surgical recovery', 'Pediatric care'] },
  { group: 'Household support', items: ['Meal prep', 'Light housekeeping', 'Laundry', 'Errands & transportation', 'Companionship'] },
];

const LANGUAGES = ['English', 'Español', 'Kreyòl', 'ASL', 'Tagalog'];
const INSURANCE = ['Medicare', 'Medicaid', 'Long-term care insurance', 'VA benefits', 'Self-pay only'];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cna_profiles')
    .select('user_id, display_name, headline, hourly_rate_cents, years_experience, service_zip, languages')
    .eq('application_status', 'approved')
    .limit(9);

  const cnas = (data ?? []) as CaregiverRow[];
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
              Now serving Alachua, Marion &amp; Putnam counties
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight font-light">
              The care your family deserves,
              <br />
              <span className="italic font-medium text-gradient">from people who feel like family.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/70 max-w-2xl leading-relaxed font-light">
              Browse vetted Certified Nursing Assistants in your neighborhood. Filter by skills,
              schedule, and background-check status — and book directly with the caregiver who feels
              right.
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
                    <div className="font-display text-lg font-medium">{featured.display_name}</div>
                    <div className="text-xs text-ink/60">
                      CNA{featured.years_experience ? ` · ${featured.years_experience} yrs` : ''}
                      {featured.service_zip ? ` · ${featured.service_zip}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-3">
                  <span className="bg-sage/20 text-deepteal px-2 py-0.5 rounded-full font-medium">✓ Vetted</span>
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
              <div className="font-display text-2xl leading-tight font-light">Every caregiver, vetted by a real human before they ever reach you.</div>
            </div>

            {/* Brand accent card */}
            <div className="absolute bottom-4 right-12 w-60 bg-butter rounded-2xl p-4 rotate-6 hover:rotate-0 transition-transform duration-500" style={{ boxShadow: '0 20px 40px -15px rgba(46,110,115,0.25)' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-deepteal/70 mb-2">Why Kindred</div>
              <div className="font-display text-sm leading-snug text-deepteal italic">You hire the caregiver directly. No agency taking the bigger half.</div>
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
            No agencies. No middlemen taking the bigger half. Just real caregivers, real reviews, and
            a transparent way to find someone you trust — whether you need a few hours a week or
            round-the-clock care.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <HowCard n="01" title="Search & filter">
            Browse caregivers by experience, services offered, schedule, languages, and verification
            status. See real photos, real prices, real reviews.
          </HowCard>
          <HowCard n="02" title="Message & meet">
            Chat directly with caregivers through HIPAA-minded messaging. Schedule a free
            introduction call before you commit to anything.
          </HowCard>
          <HowCard n="03" title="Book & pay safely">
            Pay by the hour, day, or week — your choice. Self-pay supported at launch, with insurance
            billing support on the way. Funds released as care is delivered.
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

              <FilterGroup label="Insurance accepted">
                <div className="space-y-2">
                  {INSURANCE.map((i) => (
                    <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-ink/30 accent-deepteal" />
                      <span className="text-sm">{i}</span>
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
                <p className="text-ink/60 mb-6 max-w-md mx-auto">Every caregiver goes through a real interview before they appear here. The first profiles are coming soon.</p>
                <Link href="/signup" className="bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition inline-block">
                  Create an account to get matched
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

      {/* ===================== BECOME A CNA ===================== */}
      <section id="become" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-kindred-gradient opacity-95" />
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 text-white">
            <div className="text-xs font-mono uppercase tracking-widest opacity-80 mb-4">— Become a CNA</div>
            <h2 className="font-display text-4xl md:text-6xl font-light leading-[1.05] mb-6">
              Start your career in care.
              <br />
              <span className="italic">Locally.</span>
            </h2>
            <p className="text-lg opacity-90 leading-relaxed mb-8 max-w-lg font-light">
              We&apos;re partnering with state-approved CNA training programs across Florida. Apply
              through Kindred and we&apos;ll help match you to a school in your area — most students
              certify in 4 to 6 weeks.
            </p>
            <ul className="space-y-3 text-white/95">
              {['Financial aid & payment plans at most partner schools', 'Day, evening, and weekend cohorts', "Join Kindred the day you're certified — start earning right away"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/become-a-cna" className="bg-white text-deepteal px-7 py-3.5 rounded-full font-medium hover:bg-cream transition shadow-lg inline-block">
                Find programs near me →
              </Link>
              <Link href="/apply" className="border-2 border-white text-white px-7 py-3.5 rounded-full font-medium hover:bg-white hover:text-deepteal transition inline-block">
                Already a CNA? Apply
              </Link>
            </div>
          </div>

          {/* Honest: partner programs coming soon (schools not signed yet) */}
          <div className="lg:col-span-6">
            <div className="text-xs font-mono uppercase tracking-widest text-white/70 mb-3">Partner programs</div>
            <div className="bg-white/95 backdrop-blur rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-kindred-gradient mx-auto flex items-center justify-center mb-4">
                <KindredMark size={28} />
              </div>
              <div className="font-display text-2xl font-medium mb-2">Schools are coming online soon.</div>
              <p className="text-sm text-ink/60 max-w-sm mx-auto">
                We&apos;re finalizing partnerships with CNA training programs across North Central
                Florida. Tell us you&apos;re interested and we&apos;ll point you to one as soon as
                they&apos;re listed.
              </p>
              <Link href="/become-a-cna" className="mt-5 inline-block bg-deepteal text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
                Notify me about programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== APPLY (new flow) ===================== */}
      <section id="apply" className="py-24 max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Apply to Kindred</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light mb-6">
              Already a CNA? <span className="italic">Build your business</span> on Kindred.
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[['Level 2 BG check', 'AHCA / Checkr'], ['License verify', 'FL DOH lookup'], ['ID verification', 'photo + selfie'], ['CPR / AED', 'card upload'], ['2 references', "we'll contact"], ['TB & immunizations', 'within 1 year']].map(([t, s]) => (
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

      {/* ===================== INSURANCE & BILLING ===================== */}
      <section id="insurance" className="bg-mist/40 py-24">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">— Insurance & billing</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight font-light">
              Straight answers about <span className="italic">paying for care.</span>
            </h2>
            <p className="text-ink/70 mt-4 max-w-2xl mx-auto">
              We&apos;d rather be honest than oversell. Here&apos;s what Kindred supports today, and
              what&apos;s on the way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-7 border border-ink/10">
              <div className="w-12 h-12 rounded-xl bg-coral flex items-center justify-center mb-4 text-white font-display text-xl">$</div>
              <h3 className="font-display text-xl font-medium mb-2">Self-pay (today)</h3>
              <p className="text-sm text-ink/70 leading-relaxed mb-4">
                At launch, families pay directly through Kindred with secure processing. You pay for
                care as it&apos;s delivered, and your caregiver is paid promptly.
              </p>
              <ul className="text-sm text-ink/70 space-y-1.5">
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Pay by the hour, day, or week</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> No agency markup on the caregiver&apos;s rate</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-7 border border-ink/10">
              <div className="w-12 h-12 rounded-xl bg-kindred-gradient flex items-center justify-center mb-4 text-white font-display text-xl">K</div>
              <h3 className="font-display text-xl font-medium mb-2">Insurance support (on the way)</h3>
              <p className="text-sm text-ink/70 leading-relaxed mb-4">
                Long-term care reimbursement help and Medicaid billing support are on our roadmap.
                We&apos;ll add them deliberately — and we&apos;ll never claim to cover something we
                don&apos;t.
              </p>
              <ul className="text-sm text-ink/70 space-y-1.5">
                <li className="flex gap-2"><span className="text-deepteal">✓</span> LTC reimbursement documents (planned)</li>
                <li className="flex gap-2"><span className="text-deepteal">✓</span> Florida Medicaid billing (planned)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 overflow-hidden">
            <Faq q="Does Medicare cover in-home CNA care?">
              Generally, no — Medicare doesn&apos;t cover routine non-medical home care, though it may
              cover skilled nursing or therapy for qualifying conditions. Some Medicare Advantage
              plans now include limited home-care benefits. We&apos;ll always tell you plainly what
              applies rather than imply coverage that isn&apos;t there.
            </Faq>
            <Faq q="What about long-term care insurance and VA benefits?">
              Most major LTC policies reimburse for in-home CNA care, and veterans may qualify through
              programs like Aid &amp; Attendance. Helping you assemble the visit logs and invoices
              those programs require is on our near-term roadmap.
            </Faq>
            <Faq q="How does vetting work before someone can be hired?" last>
              Every caregiver completes an application and a real interview before we ever invest in
              the expensive checks — license verification, a Level 2 background check, ID, CPR/AED, TB
              clearance, and references. Only after all of that does a profile go live.
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
              Care that feels like
              <br />
              <span className="italic text-gradient bg-gradient-to-r from-sage via-teal to-sky">family.</span>
            </h2>
            <p className="text-cream/80 text-lg max-w-2xl mx-auto mb-10 font-light">
              Whether you&apos;re searching for help, ready to start your career in care, or training
              to become a CNA — Kindred is here.
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
            <span className="bg-sage/30 text-deepteal px-2 py-0.5 rounded-full font-medium text-[10px]">✓ Vetted</span>
          </div>
        </div>
        <div className="absolute -bottom-8 left-5">
          <div className={`w-16 h-16 rounded-full ${av} border-4 border-white flex items-center justify-center font-display text-2xl text-white font-medium`}>
            {(c.display_name ?? 'K').charAt(0)}
          </div>
        </div>
      </div>
      <div className="pt-10 px-5 pb-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-medium leading-tight">{c.display_name}</h3>
        <div className="text-xs text-ink/60 mb-3">
          CNA{c.years_experience ? ` · ${c.years_experience} yrs` : ''}{c.service_zip ? ` · ${c.service_zip}` : ''}
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
