/**
 * /cna/dashboard — caregiver home. Ported 1:1 from CNA-Portal/dashboard.html.
 *
 * Data policy (per Nick, 2026-05-20): show REAL data where it exists; where a
 * feature has no database home yet (today's shift, job matches, earnings,
 * messages, tier progress %), render an explicit empty state rather than mock
 * numbers. Nothing fake-looking-real.
 *
 * The shell (nav/util-bar/footer) lives in app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils/money';
import { AvailabilityToggle } from '@/components/cna/AvailabilityToggle';

export const dynamic = 'force-dynamic';

const TIER_LABEL: Record<string, string> = {
  new: 'New',
  verified: 'Verified',
  top_rated: 'Top-Rated',
};

export default async function CnaDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const firstName = (profile?.display_name || me?.full_name || 'there').split(' ')[0];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const rateText = profile?.hourly_rate_cents ? formatCents(profile.hourly_rate_cents, { showFraction: false }) : null;
  const tierLabel = profile?.tier ? TIER_LABEL[profile.tier] ?? profile.tier : null;

  // This CNA's recent job applications + the jobs they're against.
  const { data: myApps } = await supabase
    .from('job_applications')
    .select('id, job_id, status, created_at')
    .eq('cna_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  const apps = myApps ?? [];

  const appJobIds = apps.map((a) => a.job_id);
  const appJobMap = new Map<
    string,
    { title: string; client_id: string; budget_min_cents: number | null; budget_max_cents: number | null; hours_per_week: number | null }
  >();
  const appPosterMap = new Map<string, string>();
  if (appJobIds.length > 0) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, client_id, budget_min_cents, budget_max_cents, hours_per_week')
      .in('id', appJobIds);
    (jobs ?? []).forEach((j) =>
      appJobMap.set(j.id, {
        title: j.title,
        client_id: j.client_id,
        budget_min_cents: j.budget_min_cents,
        budget_max_cents: j.budget_max_cents,
        hours_per_week: j.hours_per_week,
      }),
    );
    const clientIds = Array.from(new Set((jobs ?? []).map((j) => j.client_id)));
    if (clientIds.length > 0) {
      const { data: posters } = await supabase
        .from('client_profiles')
        .select('user_id, name')
        .in('user_id', clientIds);
      (posters ?? []).forEach((p) => appPosterMap.set(p.user_id, p.name));
    }
  }

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14 relative">
      {/* Decorative blobs */}
      <div className="absolute -top-20 right-0 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-sky/10 blur-3xl pointer-events-none" />

      {/* GREETING */}
      <section className="mb-10 fade-up relative">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">{today}</div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight font-light">
              Good morning, {firstName}.
            </h1>
          </div>
          {profile && (
            <AvailabilityToggle
              initialStatus={(profile.availability_status as 'available' | 'fully_booked' | 'on_break' | 'inactive') ?? 'inactive'}
            />
          )}
        </div>
      </section>

      {/* PROFILE COMPLETENESS BANNER — only when profile exists but isn't approved */}
      {profile && profile.application_status !== 'approved' && (
        <section className="mb-6 fade-up" style={{ animationDelay: '.04s' }}>
          <div className="bg-gradient-to-br from-butter/30 to-coral/15 border border-coral/30 rounded-2xl p-5 flex items-start gap-4">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <div className="font-display text-lg font-medium mb-1">
                Your profile isn&rsquo;t visible to families yet
              </div>
              <p className="text-sm text-ink/75 leading-relaxed mb-3">
                You can still apply to jobs, but families browsing for caregivers won&rsquo;t see you
                until you finish your profile — photo, bio, hourly rate, service area, and credentials.
              </p>
              <Link
                href="/cna/profile"
                className="inline-block bg-coral text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition"
              >
                Finish your profile →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* TOP STATS STRIP — real data only */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Completed shifts</div>
          <div className="font-display text-3xl font-medium mt-1">{profile?.completed_shifts_count ?? 0}</div>
          <div className="text-xs text-ink/60 mt-1">All time</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Your rating</div>
          <div className="font-display text-3xl font-medium mt-1">
            {profile?.rating_avg != null ? `${Number(profile.rating_avg).toFixed(1)} ★` : '—'}
          </div>
          <div className="text-xs text-ink/60 mt-1">
            {profile?.rating_count ? `${profile.rating_count} reviews` : 'No reviews yet'}
          </div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Your rate</div>
          <div className="font-display text-3xl font-medium mt-1 text-deepteal">{rateText ?? '—'}<span className="text-sm text-ink/50">/hr</span></div>
          <div className="text-xs text-ink/60 mt-1">{profile?.service_zip ? `Serves ${profile.service_zip}` : 'Set your area'}</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Your tier</div>
          <div className="font-display text-2xl font-medium mt-1">{tierLabel ?? '—'}</div>
          <div className="text-xs text-ink/60 mt-1">{profile?.years_experience != null ? `${profile.years_experience} yrs experience` : ''}</div>
        </div>
      </section>

      {/* TODAY'S SHIFT — no bookings system yet → empty state */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Today's shift</div>
        <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-10 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h2 className="font-display text-2xl font-medium mb-1">No shifts scheduled today</h2>
          <p className="text-sm text-ink/60 max-w-md mx-auto">
            Once you accept a job and it's booked, your next shift will appear here with clock-in,
            directions, and the care plan.
          </p>
          <Link
            href="/cna/jobs"
            className="inline-block mt-5 bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
          >
            Find open jobs →
          </Link>
        </div>
      </section>

      {/* MAIN GRID: Job feed + sidebar */}
      <section className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* JOB FEED + APPLICATIONS — real applications when they exist */}
        <div className="lg:col-span-2 fade-up" style={{ animationDelay: '.15s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">
                {apps.length > 0 ? 'Your applications' : 'Open jobs near you'}
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">
                {apps.length > 0
                  ? `${apps.length} active ${apps.length === 1 ? 'application' : 'applications'}`
                  : 'Best matches'}
              </h2>
            </div>
            <Link href="/cna/jobs" className="text-sm text-deepteal hover:text-coral transition">
              {apps.length > 0 ? 'Find more jobs →' : 'See all →'}
            </Link>
          </div>

          {apps.length > 0 ? (
            <div className="space-y-3">
              {apps.map((a) => {
                const job = appJobMap.get(a.job_id);
                if (!job) return null;
                const posterFirst = (appPosterMap.get(job.client_id) ?? 'A family').split(' ')[0];
                const rate =
                  job.budget_min_cents != null && job.budget_max_cents != null && job.budget_min_cents !== job.budget_max_cents
                    ? `${formatCents(job.budget_min_cents, { showFraction: false })}–${formatCents(job.budget_max_cents, { showFraction: false })}`
                    : job.budget_min_cents != null
                    ? formatCents(job.budget_min_cents, { showFraction: false })
                    : job.budget_max_cents != null
                    ? formatCents(job.budget_max_cents, { showFraction: false })
                    : 'Open rate';

                const statusMeta: Record<string, { label: string; chip: string }> = {
                  submitted: { label: 'Awaiting response', chip: 'bg-mist text-ink/70 border-ink/15' },
                  shortlisted: { label: '✨ Shortlisted', chip: 'bg-butter/40 text-ink border-butter/60' },
                  accepted: { label: '✓ Hired', chip: 'bg-sage/20 text-deepteal border-sage/40' },
                  rejected: { label: 'Not selected', chip: 'bg-creamdark text-ink/60 border-ink/15' },
                  withdrawn: { label: 'Withdrawn', chip: 'bg-creamdark text-ink/60 border-ink/15' },
                };
                const meta = statusMeta[a.status] ?? statusMeta.submitted;

                return (
                  <Link
                    key={a.id}
                    href={`/cna/jobs/${a.job_id}`}
                    className="card-hover bg-white border border-ink/10 rounded-2xl p-5 block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-lg font-medium leading-tight truncate">{job.title}</div>
                        <div className="text-xs text-ink/60 mt-1">
                          {posterFirst}
                          {' · '}
                          {rate}/hr
                          {job.hours_per_week ? ` · ${job.hours_per_week} hrs/week` : ''}
                        </div>
                        <div className="text-[10px] text-ink/50 font-mono mt-1">
                          Applied {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap border ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-display text-xl font-medium mb-1">No jobs to show yet</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto mb-4">
                When families and facilities post jobs in your service area, your best matches show up
                right here.
              </p>
              <Link href="/cna/jobs" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                Browse open jobs →
              </Link>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6 fade-up" style={{ animationDelay: '.2s' }}>
          {/* MESSAGES — no messaging wired yet → empty state */}
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Inbox</div>
                <h2 className="font-display text-xl font-medium">Messages</h2>
              </div>
              <Link href="/cna/messages" className="text-xs text-deepteal hover:text-coral transition">
                View all →
              </Link>
            </div>
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-6 text-center">
              <p className="text-sm text-ink/60">No messages yet.</p>
            </div>
          </div>

          {/* CREDENTIAL STATUS — real data (license + bg check) */}
          {profile && (
            <div
              className={`rounded-2xl p-5 border ${
                profile.bg_check_status === 'clear' && profile.license_verified_at
                  ? 'bg-mist/40 border-teal/20'
                  : 'bg-coral/5 border-coral/30'
              }`}
            >
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">
                Your credentials
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>FL CNA License</span>
                  <span className={profile.license_verified_at ? 'text-deepteal' : 'text-coral'}>
                    {profile.license_verified_at ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Background check</span>
                  <span className={profile.bg_check_status === 'clear' ? 'text-deepteal' : 'text-coral'}>
                    {profile.bg_check_status === 'clear' ? '✓ Cleared' : 'Pending'}
                  </span>
                </div>
              </div>
              <Link
                href="/cna/compliance"
                className="inline-block mt-4 text-xs text-deepteal hover:text-coral font-medium"
              >
                View compliance →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS — these are navigation, all real */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Quick actions</div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Get more out of Kindred</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cna/profile" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👤</div>
            <div className="font-display text-lg font-medium mb-1">Update your profile</div>
            <div className="text-xs text-ink/60 leading-relaxed">A better profile means more job invites.</div>
          </Link>

          <Link href="/cna/schedule" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📅</div>
            <div className="font-display text-lg font-medium mb-1">Set availability</div>
            <div className="text-xs text-ink/60 leading-relaxed">Tell us when you're free. We'll surface matching jobs first.</div>
          </Link>

          <Link href="/cna/get-insured" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-coral/15 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
            <div className="font-display text-lg font-medium mb-1">Get insured</div>
            <div className="text-xs text-ink/60 leading-relaxed">Affordable liability coverage through our partner.</div>
          </Link>

          <Link href="/cna/resources" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
            <div className="font-display text-lg font-medium mb-1">Grow your skills</div>
            <div className="text-xs text-ink/60 leading-relaxed">RN bridge programs, dementia cert, hospice training near you.</div>
          </Link>
        </div>
      </section>

      {/* TIER PROGRESS — show current tier (real); progress bar omitted (no shift-rating data yet) */}
      {profile?.tier && (
        <section className="fade-up" style={{ animationDelay: '.3s' }}>
          <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Your tier</div>
                <h3 className="font-display text-2xl font-medium mb-2">
                  You're a {tierLabel} caregiver.
                </h3>
                <p className="text-sm text-ink/70 leading-relaxed max-w-xl">
                  As you complete more five-star shifts on Kindred, you'll move up tiers — unlocking a
                  lower service fee, higher placement in client searches, and premium-rate job invites.
                </p>
              </div>
              <div className="md:col-span-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`rounded-xl p-3 border ${profile.tier === 'new' ? 'bg-mist/60 border-teal/30' : 'bg-cream border-ink/10'}`}>
                    <div className="text-[10px] text-ink/50 uppercase tracking-wider mb-1">New</div>
                    <div className="text-xs font-mono">Starter</div>
                  </div>
                  <div className={`rounded-xl p-3 border ${profile.tier === 'verified' ? 'bg-mist/60 border-teal/30' : 'bg-cream border-ink/10'}`}>
                    <div className="text-[10px] text-deepteal uppercase tracking-wider mb-1 font-medium">Verified</div>
                    <div className="text-xs font-mono font-medium">Established</div>
                  </div>
                  <div className={`rounded-xl p-3 border ${profile.tier === 'top_rated' ? 'bg-mist/60 border-teal/30' : 'bg-cream border-ink/10 opacity-60'}`}>
                    <div className="text-[10px] text-ink/50 uppercase tracking-wider mb-1">Top-Rated</div>
                    <div className="text-xs font-mono">Premium</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
