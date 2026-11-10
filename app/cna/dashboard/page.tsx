/**
 * /cna/dashboard — caregiver home. Ported 1:1 from CNA-Portal/dashboard.html.
 *
 * Data policy (per Nick, 2026-05-20): show REAL data where it exists; where a
 * feature has no database home yet (today's shift, job matches, messages),
 * render an explicit empty state rather than mock numbers. Nothing
 * fake-looking-real. There are no fee tiers: Kindred earns only from
 * memberships, so the old tier card points to Kindred Standard progress on
 * /cna/membership instead.
 *
 * The shell (nav/util-bar/footer) lives in app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCents } from '@/lib/utils/money';
import { AvailabilityToggle } from '@/components/cna/AvailabilityToggle';
import { getBookingUrl, bookingLink } from '@/lib/interview';
import { getStandardStatus, DOC_STATE_LABEL, type DocState } from '@/lib/standard';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function CnaDashboardPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const firstName = (profile?.display_name || me?.full_name || 'there').split(' ')[0];
  const appStatus = profile?.application_status ?? null;
  const [standard, { count: savedCount }] = await Promise.all([
    getStandardStatus(supabase, user.id),
    supabase.from('saved_jobs').select('job_id', { count: 'exact', head: true }).eq('cna_id', user.id),
  ]);
  const bookingUrl = appStatus === 'interviewing' && !profile?.interview_at ? await getBookingUrl(supabase) : null;
  const myBookingLink = bookingUrl
    ? bookingLink(bookingUrl, [profile?.display_name, profile?.last_name].filter(Boolean).join(' ') || me?.full_name, me?.email)
    : null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const rateText = profile?.hourly_rate_cents ? formatCents(profile.hourly_rate_cents, { showFraction: false }) : null;

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

      {/* APPLICATION STATUS — where they are in submitted → interview → accepted → listed */}
      {profile && appStatus && appStatus !== 'approved' && (
        <section className="mb-6 fade-up" style={{ animationDelay: '.04s' }}>
          <ApplicationStatusCard
            status={appStatus}
            interviewAt={profile.interview_at ?? null}
            bookingLink={myBookingLink}
          />
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
        <Link href="/cna/membership" className="card-hover bg-white border border-ink/10 rounded-2xl p-5 block">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Kindred Standard</div>
          <div className="font-display text-2xl font-medium mt-1">See progress</div>
          <div className="text-xs text-ink/60 mt-1">{profile?.years_experience != null ? `${profile.years_experience} yrs experience` : 'On your Membership page'}</div>
        </Link>
      </section>

      {/* TODAY'S SHIFT — no bookings system yet → empty state */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Today's shift</div>
        <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-10 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h2 className="font-display text-2xl font-medium mb-1">No shifts scheduled today</h2>
          <p className="text-sm text-ink/60 max-w-md mx-auto">
            When you and a family agree on a schedule, you can keep track of it here and in My
            schedule.
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
                When families post jobs in your service area, your best matches show up
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

          {/* KINDRED STANDARD — straight from what Kindred verified */}
          {profile && (
            <div
              className={`rounded-2xl p-5 border ${
                standard.allMet ? 'bg-sage/15 border-sage/40' : 'bg-white border-ink/10'
              }`}
            >
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">
                {standard.allMet ? '✓ Kindred Standard met' : 'Your Kindred Standard'}
              </div>
              <div className="space-y-2 text-sm">
                <StandardRow label="Interview" value={standard.interview ? '✓ Passed' : 'Not yet'} ok={standard.interview} />
                <StandardRow
                  label="1,500+ hours"
                  value={standard.hours.met ? '✓ Confirmed' : standard.hours.confirmed != null ? `${standard.hours.confirmed.toLocaleString('en-US')} confirmed` : 'Not confirmed yet'}
                  ok={standard.hours.met}
                />
                <StandardRow label="Level 2 background check" value={docLabel(standard.l2bg.state, standard.accepted)} ok={standard.l2bg.state === 'verified'} />
                <StandardRow label="Photo ID" value={docLabel(standard.identity.state, standard.accepted)} ok={standard.identity.state === 'verified'} />
                <StandardRow label="Liability insurance" value={docLabel(standard.insurance.state, standard.accepted)} ok={standard.insurance.state === 'verified'} />
              </div>
              <Link href="/cna/compliance" className="inline-block mt-4 text-xs text-deepteal hover:text-coral font-medium">
                {standard.allMet ? 'See your documents →' : 'Open Credentials →'}
              </Link>
            </div>
          )}

          <Link
            href="/cna/jobs?saved=1"
            className="flex items-center justify-between rounded-2xl p-4 border border-ink/10 bg-white hover:border-coral/40 transition"
          >
            <span className="text-sm font-medium">♥ Saved jobs</span>
            <span className="text-xs text-ink/60">{savedCount ?? 0} →</span>
          </Link>
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
            <div className="text-xs text-ink/60 leading-relaxed">Your own liability insurance is part of the Kindred Standard.</div>
          </Link>

          <Link href="/cna/resources" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
            <div className="font-display text-lg font-medium mb-1">Caregiver resources</div>
            <div className="text-xs text-ink/60 leading-relaxed">Guides on setting your rate, taxes, and working on your own.</div>
          </Link>
        </div>
      </section>

      {/* KINDRED STANDARD — progress lives on /cna/membership (real data there) */}
      <section className="fade-up" style={{ animationDelay: '.3s' }}>
        <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-6 lg:p-8">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">The Kindred Standard</div>
              <h3 className="font-display text-2xl font-medium mb-2">One bar for every caregiver.</h3>
              <p className="text-sm text-ink/70 leading-relaxed max-w-xl">
                A personal interview, 1,500+ hours of hands-on experience, a Level 2 background check,
                a verified ID, and your own liability insurance. Families pay you directly, and
                Kindred never takes a cut. See where you stand on your Membership page.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link
                href="/cna/membership"
                className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
              >
                See my progress →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ApplicationStatusCard({
  status,
  interviewAt,
  bookingLink,
}: {
  status: string;
  interviewAt: string | null;
  bookingLink: string | null;
}) {
  const btn =
    'inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition';
  const shell = 'rounded-2xl p-5 flex items-start gap-4 border';

  if (status === 'submitted' || status === 'incomplete') {
    return (
      <div className={`${shell} bg-white border-ink/10`}>
        <div className="text-2xl" aria-hidden="true">📬</div>
        <div className="flex-1">
          <div className="font-display text-lg font-medium mb-1">Your application is in</div>
          <p className="text-sm text-ink/70 leading-relaxed mb-3">
            We&rsquo;re reading it now. If it feels like a fit, we&rsquo;ll invite you to a short conversation.
            Nothing else is needed from you yet, but you can add more proof of your hours any time.
          </p>
          <Link href="/cna/compliance" className="text-sm text-deepteal hover:text-coral font-medium">
            Add proof of hours →
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'interviewing') {
    const when = interviewAt
      ? new Date(interviewAt).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          timeZone: 'America/New_York',
        })
      : null;
    return (
      <div className={`${shell} bg-gradient-to-br from-sky/15 to-sage/20 border-teal/30`}>
        <div className="text-2xl" aria-hidden="true">💬</div>
        <div className="flex-1">
          <div className="font-display text-lg font-medium mb-1">
            {when ? 'Your interview is booked' : 'We’d love to talk with you'}
          </div>
          <p className="text-sm text-ink/70 leading-relaxed mb-3">
            {when
              ? `${when} (Eastern). A relaxed conversation, about 20 to 30 minutes.`
              : 'Pick a time that works for you. It’s a relaxed conversation, about 20 to 30 minutes.'}
          </p>
          {!when && bookingLink && (
            <a href={bookingLink} target="_blank" rel="noopener noreferrer" className={btn}>
              Book your interview ↗
            </a>
          )}
          {!when && !bookingLink && (
            <p className="text-sm text-ink/60">Watch your email: we&rsquo;ll send you times to choose from.</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className={`${shell} bg-gradient-to-br from-butter/40 to-sage/25 border-sage/50`}>
        <div className="text-2xl" aria-hidden="true">🎉</div>
        <div className="flex-1">
          <div className="font-display text-lg font-medium mb-1">You&rsquo;re in. Let&rsquo;s get you listed.</div>
          <p className="text-sm text-ink/70 leading-relaxed mb-3">
            Upload your Level 2 background check, a photo ID and your liability insurance. Families can
            find you as soon as all three are verified.
          </p>
          <Link href="/cna/compliance" className={btn}>
            Upload documents →
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'waitlisted') {
    return (
      <div className={`${shell} bg-white border-ink/10`}>
        <div className="text-2xl" aria-hidden="true">🌱</div>
        <div className="flex-1">
          <div className="font-display text-lg font-medium mb-1">You&rsquo;re on our waitlist</div>
          <p className="text-sm text-ink/70 leading-relaxed">
            We&rsquo;d like to work with you, and we&rsquo;re not adding caregivers in your area just yet.
            We&rsquo;ll reach out as soon as we are.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className={`${shell} bg-white border-ink/10`}>
        <div className="text-2xl" aria-hidden="true">🤍</div>
        <div className="flex-1">
          <div className="font-display text-lg font-medium mb-1">Thank you for applying</div>
          <p className="text-sm text-ink/70 leading-relaxed">
            We&rsquo;re not moving forward with your application right now. If you have questions,
            we&rsquo;re happy to talk: reach us through Help.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function docLabel(state: DocState, accepted: boolean): string {
  if (state === 'none' && !accepted) return 'After acceptance';
  return DOC_STATE_LABEL[state];
}

function StandardRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={`text-right ${ok ? 'text-deepteal' : 'text-ink/55'}`}>{value}</span>
    </div>
  );
}
