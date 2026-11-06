/**
 * /cna/resources — career growth + local training. Ported 1:1 from
 * CNA-Portal/resources.html.
 *
 * Mostly static content. The career-ladder "you are here" card uses the
 * caregiver's real initials/tier; everything else (schools, articles,
 * meetup) is static. The training map renders the mock's visual fallback —
 * Google Maps isn't wired (same as find-jobs).
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

const SCHOOLS = [
  {
    code: 'GA', logoCls: 'from-sage to-teal', name: 'Gator CNA Academy',
    addr: '📍 2.4 mi · 1234 NW 13th St, Gainesville', badge: 'Kindred partner', badgeCls: 'bg-coral/15 text-coral',
    border: 'border-teal/30',
    desc: 'CPR renewal, dementia certification, and Med Aide programs. They hold a CPR class every other Saturday — perfect for your June renewal.',
    tags: ['CPR · $89', 'Dementia · $199', 'Med Aide · $499'],
    cta1: 'Book CPR class', cta2: 'View all courses',
  },
  {
    code: 'SF', logoCls: 'from-teal to-sky', name: 'Santa Fe College Health Programs',
    addr: '📍 4.1 mi · 3000 NW 83rd St', badge: 'Pell-eligible', badgeCls: 'bg-sage/20 text-deepteal',
    border: 'border-ink/10',
    desc: 'The serious next step — LPN, RN bridge, and AA-degree pathways. Most courses qualify for financial aid. Evening cohorts available.',
    tags: ['LPN program', 'RN bridge', 'EKG tech'],
    cta1: 'Schedule info session', cta2: 'View programs',
  },
  {
    code: 'NF', logoCls: 'from-butter to-coral', name: 'North Central FL Nursing Institute',
    addr: '📍 5.8 mi · 7811 NW 6th St', badge: 'Payment plans', badgeCls: 'bg-mist text-deepteal',
    border: 'border-ink/10',
    desc: 'Evening + weekend cohorts. Great for working CNAs. Hospice and home-health specialty tracks.',
    tags: ['Hospice · $249', 'Home health · $179', 'Phlebotomy · $399'],
    cta1: 'Book consultation', cta2: 'View programs',
  },
];

const ARTICLES = [
  { emoji: '💰', grad: 'from-sage/40 via-butter/30 to-coral/30', cat: 'Money · 6 min read', title: 'Tax tips for 1099 CNAs', desc: 'What you can deduct (uniforms, mileage, supplies) and how to set aside the right amount each quarter.' },
  { emoji: '🧠', grad: 'from-teal/40 to-sky/30', cat: 'Care · 8 min read', title: 'Sundowning: a gentle guide', desc: 'Why dementia patients get anxious in the late afternoon, and what actually helps in the moment.' },
  { emoji: '⭐', grad: 'from-coral/30 to-butter/40', cat: 'Career · 5 min read', title: 'Getting to Top-Rated faster', desc: 'What separates 4.5★ caregivers from 5★ ones — small habits that compound into great reviews.' },
  { emoji: '🩺', grad: 'from-sky/30 to-deepteal/30', cat: 'Career · 10 min read', title: 'CNA → LPN → RN: realistic timelines', desc: 'How working CNAs in Florida have made the jump while still earning. Programs, costs, and pay milestones.' },
  { emoji: '🛡️', grad: 'from-butter/40 to-sage/30', cat: 'Safety · 4 min read', title: 'When to call 911 vs the family first', desc: 'A simple decision framework for in-home emergencies. Print this for your reference card.' },
  { emoji: '💛', grad: 'from-coral/30 to-sage/40', cat: 'Wellbeing · 7 min read', title: 'Avoiding caregiver burnout', desc: 'The signs to watch for in yourself, and what to do when you feel them creeping in.' },
];

export default async function CnaResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('display_name, last_name, years_experience').eq('user_id', user.id).maybeSingle(),
  ]);

  const fullName = profileRes.data?.display_name
    ? `${profileRes.data.display_name} ${profileRes.data.last_name ?? ''}`.trim()
    : userRes.data?.full_name ?? 'Caregiver';
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);
  const yearsText = profileRes.data?.years_experience != null ? `${profileRes.data.years_experience} yrs experience` : 'experienced';

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky/15 blur-3xl pointer-events-none" />
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-16 fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Grow your career</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Resources to help you <span className="italic font-medium text-gradient">earn more</span> and{' '}
            <span className="italic font-medium text-gradient">do more.</span>
          </h1>
          <p className="text-ink/70 mt-4 text-lg leading-relaxed max-w-2xl">
            From CPR renewal to RN bridge programs, here&rsquo;s what&rsquo;s available in North
            Central Florida — and how much each one bumps your hourly rate.
          </p>
        </div>
      </section>

      <main className="max-w-kindred mx-auto px-6 pb-16">
        {/* CAREER LADDER */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.05s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Your path forward</div>
          <h2 className="font-display text-3xl font-medium mb-6">Where you can go from here</h2>
          <div className="grid md:grid-cols-4 gap-3 relative">
            <div className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-sage via-teal to-deepteal opacity-30" />
            <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative">
              <div className={`w-14 h-14 rounded-full ${avClass} ring-4 ring-cream flex items-center justify-center text-cream font-display text-lg font-medium mb-3 relative z-10`}>
                {userInitials}
              </div>
              <div className="text-[10px] font-mono text-deepteal uppercase tracking-widest mb-1">You are here</div>
              <div className="font-display text-base font-medium mb-1">CNA · Verified</div>
              <div className="text-xs text-ink/60">$22–$28/hr · {yearsText}</div>
            </div>
            <div className="card-hover bg-white border border-coral/30 rounded-2xl p-5 relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage to-teal ring-4 ring-cream flex items-center justify-center text-cream text-xl mb-3 relative z-10">🧠</div>
              <div className="text-[10px] font-mono text-coral uppercase tracking-widest mb-1">Next: 12 hrs</div>
              <div className="font-display text-base font-medium mb-1">+ Dementia cert</div>
              <div className="text-xs text-ink/60">$26–$32/hr · 15–25% more</div>
            </div>
            <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal to-sky ring-4 ring-cream flex items-center justify-center text-cream text-xl mb-3 relative z-10">💉</div>
              <div className="text-[10px] font-mono text-ink/60 uppercase tracking-widest mb-1">Then: 40 hrs</div>
              <div className="font-display text-base font-medium mb-1">+ Med Aide</div>
              <div className="text-xs text-ink/60">$28–$36/hr · Administer meds</div>
            </div>
            <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky to-deepteal ring-4 ring-cream flex items-center justify-center text-cream text-xl mb-3 relative z-10">🩺</div>
              <div className="text-[10px] font-mono text-ink/60 uppercase tracking-widest mb-1">Long-term: 12 mo</div>
              <div className="font-display text-base font-medium mb-1">LPN bridge</div>
              <div className="text-xs text-ink/60">$45–$60/hr · Full nursing license</div>
            </div>
          </div>
        </section>

        {/* TRAINING */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Local programs</div>
          <h2 className="font-display text-3xl font-medium mb-6">Training near you</h2>
          <div className="grid lg:grid-cols-12 gap-6">
            {/* LIST */}
            <div className="lg:col-span-7 space-y-4">
              {SCHOOLS.map((s) => (
                <div key={s.code} className={`card-hover bg-white border ${s.border} rounded-2xl p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.logoCls} flex items-center justify-center text-cream font-display text-base font-bold flex-shrink-0`}>
                      {s.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="font-display text-lg font-medium">{s.name}</div>
                          <div className="text-xs text-ink/60 mt-1 font-mono">{s.addr}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${s.badgeCls}`}>{s.badge}</span>
                      </div>
                      <p className="text-sm text-ink/75 mt-2 leading-relaxed">{s.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                        {s.tags.map((t) => (
                          <span key={t} className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">{t}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition">{s.cta1}</button>
                        <button className="flex-1 text-xs py-2 border border-ink/15 rounded-full hover:bg-mist transition">{s.cta2}</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MAP fallback */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-medium">Training partners</div>
                    <div className="text-[10px] font-mono text-ink/50">3 schools within 6 miles</div>
                  </div>
                  <button className="text-xs bg-mist hover:bg-deepteal hover:text-cream border border-ink/15 px-3 py-1.5 rounded-full transition">All FL</button>
                </div>
                <div className="map-fallback relative h-[440px]">
                  <div className="absolute top-[25%] left-[35%] z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-teal ring-4 ring-cream shadow-lg flex items-center justify-center text-cream font-bold text-xs">GA</div>
                  </div>
                  <div className="absolute top-[55%] left-[60%] z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-sky ring-4 ring-cream shadow-lg flex items-center justify-center text-cream font-bold text-xs">SF</div>
                  </div>
                  <div className="absolute top-[70%] left-[28%] z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-butter to-coral ring-4 ring-cream shadow-lg flex items-center justify-center text-cream font-bold text-xs">NF</div>
                  </div>
                  <div className="absolute top-[45%] left-[45%] z-20">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-coral ring-4 ring-coral/30" />
                      <div className="text-[10px] font-mono bg-cream/95 px-2 py-0.5 rounded mt-1 -ml-3 whitespace-nowrap shadow">You</div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-1 z-30">
                    <button className="w-9 h-9 bg-cream/95 rounded-lg shadow text-sm font-bold hover:bg-cream transition">+</button>
                    <button className="w-9 h-9 bg-cream/95 rounded-lg shadow text-sm font-bold hover:bg-cream transition">−</button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-cream/95 backdrop-blur rounded-xl p-3 text-[11px] text-ink/70 leading-snug z-30 border border-ink/10">
                    <div className="font-medium text-ink mb-0.5">🗺️ Live map coming soon</div>
                    Training-school locations will appear on an interactive map once Google Maps is
                    wired up.
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-creamdark/70 border border-ink/10 rounded-2xl text-xs text-ink/70 leading-relaxed">
                <div className="font-medium text-ink mb-1">💡 Kindred referral discount</div>
                Book any course through Kindred and partner schools knock 10% off tuition. We track
                enrollment automatically — no codes to remember.
              </div>
            </aside>
          </div>
        </section>

        {/* ARTICLES */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.2s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Reading list</div>
          <h2 className="font-display text-3xl font-medium mb-6">Tips &amp; guides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ARTICLES.map((a) => (
              <a key={a.title} href="#" className="card-hover block bg-white border border-ink/10 rounded-2xl overflow-hidden">
                <div className={`h-32 bg-gradient-to-br ${a.grad} flex items-center justify-center text-4xl`}>{a.emoji}</div>
                <div className="p-5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink/50 mb-1">{a.cat}</div>
                  <div className="font-display text-lg font-medium leading-tight">{a.title}</div>
                  <p className="text-xs text-ink/60 mt-2 leading-relaxed">{a.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* COMMUNITY */}
        <section className="fade-up" style={{ animationDelay: '.25s' }}>
          <div className="bg-gradient-to-br from-sage/15 to-teal/10 border border-teal/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Community</div>
              <h2 className="font-display text-3xl font-medium mb-3">You&rsquo;re not in this alone.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                Kindred caregivers in your area meet up once a month — coffee, vent sessions, and CE
                hours. The next one is May 22 at Crane Ramen.
              </p>
            </div>
            <div className="bg-cream border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Next meetup</div>
              <div className="font-display text-2xl font-medium">Thursday, May 22</div>
              <div className="text-sm text-ink/60 mt-1">7:00 PM · Crane Ramen, Gainesville</div>
              <div className="text-xs text-ink/60 mt-3 mb-4">
                &ldquo;How to ace tough family conversations&rdquo; — facilitated by Dr. Rebecca Lane, RN
              </div>
              <button className="w-full bg-deepteal text-cream py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                RSVP — free
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
