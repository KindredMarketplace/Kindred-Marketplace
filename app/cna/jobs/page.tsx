/**
 * /cna/jobs — find open jobs. Ported from CNA-Portal/find-jobs.html.
 *
 * Real-data-only (no filler): queries the `jobs` table for status='open' or
 * 'in_review'. Joins to client_profiles for the poster's display info, plus a
 * separate fetch of this CNA's existing applications so we can show "Applied ✓"
 * instead of "Apply now" on jobs they've already submitted to.
 *
 * Map view: visual placeholder for now. Real Mapbox pins are a later pass once
 * the Maps API key + geocoded job locations land.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { JobFilterChips } from '@/components/cna/JobFilterChips';
import { JobApplyModal } from '@/components/cna/JobApplyModal';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const SCHEDULE_LABEL: Record<string, string> = {
  recurring: 'Recurring weekly',
  one_time: 'One-time',
  live_in: 'Live-in',
  on_call: 'On-call',
};

function postedAgo(iso: string | null): string {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function payRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Open rate';
  if (min != null && max != null && min !== max)
    return `${formatCents(min, { showFraction: false })}–${formatCents(max, { showFraction: false })}`;
  return formatCents((min ?? max)!, { showFraction: false });
}

export default async function CnaJobsPage() {
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  // Real open jobs, newest first. Read through browse_open_jobs(), which
  // withholds street addresses unless this caregiver is LISTED (meets the
  // Kindred Standard + member). Families' names are never shown here.
  const [{ data: jobs }, access] = await Promise.all([
    supabase.rpc('browse_open_jobs'),
    viewingAs && user ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
  ]);
  const jobList = (jobs ?? []).slice(0, 50);
  const canApply = access?.is_listed === true;

  // This CNA's existing applications — so we can label "Applied ✓".
  const jobIds = jobList.map((j) => j.id);
  const appliedSet = new Set<string>();
  if (jobIds.length > 0) {
    const { data: myApps } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('cna_id', user.id)
      .in('job_id', jobIds);
    (myApps ?? []).forEach((a) => appliedSet.add(a.job_id));
  }

  return (
    <>
      {/* HEADER */}
      <section className="max-w-kindred mx-auto px-6 pt-10 pb-6 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Search &amp; discover</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          {jobList.length > 0 ? (
            <>
              <span className="italic font-medium text-gradient">{jobList.length} open job{jobList.length === 1 ? '' : 's'}</span> match your area.
            </>
          ) : (
            <>Find <span className="italic font-medium text-gradient">your next shift.</span></>
          )}
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          {jobList.length > 0
            ? 'Real jobs, posted by real families. You set your rate and choose who you work with.'
            : 'No open jobs in your area right now. As families post jobs, they\u2019ll show up here in real time.'}
        </p>

        {/* Search bar */}
        <div className="mt-6 bg-white border border-ink/15 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-sm">
          <input
            type="text"
            placeholder="Try 'dementia care' or 'evenings only'"
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
          <div className="hidden md:block w-px bg-ink/10" />
          <input
            type="text"
            defaultValue="Gainesville, FL"
            placeholder="📍 Area to search"
            className="md:w-64 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
          <button className="bg-deepteal text-cream px-6 py-3 rounded-xl md:rounded-full text-sm font-medium hover:bg-inkdark transition">
            Search
          </button>
        </div>

        <JobFilterChips />

        {!canApply && (
          <div className="mt-6 bg-gradient-to-br from-mist/70 to-creamdark/70 border border-ink/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <div className="font-display text-lg font-medium">You&apos;re seeing the preview.</div>
              <p className="text-sm text-ink/70 mt-1 max-w-xl">
                These are real job posts. Exact addresses and applying open up once you meet the Kindred
                Standard and your membership is active.
              </p>
            </div>
            <Link href="/cna/membership" className="shrink-0 bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition text-center">
              See what&apos;s left →
            </Link>
          </div>
        )}
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-kindred mx-auto px-6 pb-16 grid lg:grid-cols-12 gap-6">
        {/* SIDEBAR FILTERS (visual parity) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start space-y-6">
          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-medium">Filters</h3>
              <button className="text-xs text-coral hover:underline">Clear all</button>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Max distance from home</label>
              <div className="bg-mist/40 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-2"><span>Within</span><span className="font-mono font-medium">15 mi</span></div>
                <input type="range" min={1} max={50} defaultValue={15} className="w-full" />
                <div className="flex justify-between text-[10px] text-ink/40 font-mono mt-1"><span>1 mi</span><span>50 mi</span></div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Min hourly pay</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                <input type="number" defaultValue={22} className="w-full pl-7 pr-4 py-2 text-sm bg-white border border-ink/15 rounded-lg focus:outline-none focus:border-teal" />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Job type</label>
              <div className="space-y-2 text-sm">
                {['Recurring weekly', 'One-time', 'Live-in', 'On-call'].map((label) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-deepteal focus:ring-teal" /> {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-sage/15 to-teal/15 hover:from-sage/25 hover:to-teal/25 border border-teal/30 text-deepteal text-sm py-2.5 rounded-full transition font-medium">
                ✏️ Draw service area on map
              </button>
              <div className="text-[10px] text-ink/50 mt-2 text-center font-mono">Only show jobs in the area you drew</div>
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink/70">
              {jobList.length > 0 ? (
                <>
                  <span className="font-medium text-ink">{jobList.length}</span> open job{jobList.length === 1 ? '' : 's'} · sorted by newest
                </>
              ) : (
                'No jobs to show'
              )}
            </div>
            <select className="text-sm bg-white border border-ink/15 rounded-full px-4 py-2 focus:outline-none focus:border-teal">
              <option>Newest first</option>
              <option>Highest pay</option>
              <option>Closest to me</option>
            </select>
          </div>

          {jobList.length === 0 ? (
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-display text-xl font-medium mb-1">No open jobs yet</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto mb-5">
                Jobs appear here in real time as families post them. Make sure your service area and
                availability are up to date — jobs match based on those.
              </p>
              <Link href="/cna/schedule" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                Update availability →
              </Link>
            </div>
          ) : (
            jobList.map((job) => {
              const posterName = 'A family';
              const posterFirst = posterName.split(' ')[0];
              const av = avatarClass(posterName);
              const isApplied = appliedSet.has(job.id);
              return (
                <div key={job.id} className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${av} flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}>
                      {initials(posterName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mt-1">
                        <div className="min-w-0">
                          <div className="font-display text-lg font-medium leading-tight">{job.title}</div>
                          <div className="text-xs text-ink/60 mt-1">
                            Posted by <span className="text-deepteal">{posterFirst}</span>
                            {' · '}{postedAgo(job.posted_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-xl font-medium">
                            {payRange(job.budget_min_cents, job.budget_max_cents)}<span className="text-sm text-ink/50">/hr</span>
                          </div>
                          <div className="text-[10px] text-ink/50 font-mono">
                            {job.hours_per_week ? `${job.hours_per_week} hrs/week` : SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-ink/75 mt-2 leading-relaxed line-clamp-3">{job.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(job.services_needed ?? []).slice(0, 4).map((t: string) => (
                          <span key={t} className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                        <span className="text-[10px] bg-coral/15 text-coral px-2.5 py-1 rounded-full border border-coral/30 font-medium">
                          📍 {job.city ? `${job.city} · ` : ''}{job.zip}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4 items-center">
                        {canApply || isApplied ? (
                          <JobApplyModal
                            jobId={job.id}
                            jobTitle={job.title}
                            budgetHint={`${payRange(job.budget_min_cents, job.budget_max_cents)}/hr · ${SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}`}
                            alreadyApplied={isApplied}
                          />
                        ) : (
                          <Link
                            href="/cna/membership"
                            className="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition"
                          >
                            🔒 Unlock to apply
                          </Link>
                        )}
                        <Link
                          href={`/cna/jobs/${job.id}`}
                          className="flex-1 text-xs py-2 border border-ink/15 rounded-full hover:bg-mist transition text-center"
                        >
                          View details
                        </Link>
                        <button
                          className="w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-coral hover:text-cream hover:border-coral transition"
                          aria-label="Save"
                        >
                          ♡
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* MAP placeholder */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-ink/10">
              <div className="font-display text-base font-medium">Jobs map</div>
              <div className="text-[10px] font-mono text-ink/50">Coming soon — Mapbox integration</div>
            </div>
            <div className="map-fallback relative h-[420px] flex items-center justify-center">
              <div className="text-center max-w-xs px-6">
                <div className="text-3xl mb-2">🗺️</div>
                <div className="text-sm font-medium text-ink mb-1">Live map coming soon</div>
                <p className="text-xs text-ink/60 leading-snug">
                  Real-time job pins, your service area, and drive-time estimates land once Mapbox is
                  wired up.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-creamdark/70 border border-ink/10 rounded-2xl text-xs text-ink/70 leading-relaxed">
            <div className="font-medium text-ink mb-1">💡 Pro tip</div>
            Set your service area + availability in your profile so we only surface jobs you&rsquo;d
            actually take.
          </div>
        </aside>
      </main>
    </>
  );
}
