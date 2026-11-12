/**
 * /cna/jobs — find open jobs. Ported from CNA-Portal/find-jobs.html.
 *
 * Real-data-only (no filler): queries the `jobs` table for status='open' or
 * 'in_review'. Joins to client_profiles for the poster's display info, plus a
 * separate fetch of this CNA's existing applications so we can show "Applied ✓"
 * instead of "Apply now" on jobs they've already submitted to.
 *
 * Filters (lib/listConfigs.ts): every option is listed, with counts, plus
 * distance from the caregiver's own ZIP and a map. Distance and pins use ZIP
 * code areas only (lib/geo.ts), never a street address.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FilterableList } from '@/components/FilterableList';
import { jobItem, jobFilters, jobSorts, type JobRow } from '@/lib/listConfigs';
import { SERVICE_LABEL, JOB_TYPE_LABEL, RECIPIENT_AGES, formatDays, formatTime } from '@/lib/careOptions';
import { zipPoint, milesBetween, pinPoint } from '@/lib/geo';
import { JobApplyModal } from '@/components/cna/JobApplyModal';
import { SaveJobButton } from '@/components/cna/SaveJobButton';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const SCHEDULE_LABEL = JOB_TYPE_LABEL;
const AGE_LABEL: Record<string, string> = Object.fromEntries(RECIPIENT_AGES.map((o) => [o.value, o.label]));

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

export default async function CnaJobsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const showSaved = (await searchParams).saved === '1';
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  // Real open jobs, newest first. Read through browse_open_jobs(), which
  // withholds street addresses unless this caregiver is LISTED (meets the
  // Kindred Standard + member). Families' names are never shown here.
  const [{ data: jobs }, access] = await Promise.all([
    supabase.rpc('browse_open_jobs'),
    viewingAs && user ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
  ]);
  // Saved (♡) jobs for this caregiver, and their home ZIP for distance.
  const [{ data: savedRows }, { data: me }] = await Promise.all([
    supabase.from('saved_jobs').select('job_id').eq('cna_id', user.id),
    supabase.from('cna_profiles').select('service_zip').eq('user_id', user.id).maybeSingle(),
  ]);
  const myZip = me?.service_zip ?? null;
  const home = zipPoint(myZip);
  const savedSet = new Set((savedRows ?? []).map((r) => r.job_id));
  const allOpen = (jobs ?? []) as (JobRow & { street_address: string | null; state: string | null })[];
  const savedOpenCount = allOpen.filter((j) => savedSet.has(j.id)).length;
  const jobList = (showSaved ? allOpen.filter((j) => savedSet.has(j.id)) : allOpen).slice(0, 50);
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

  // Filters, sort and map work on these (all real fields); cards are rendered here on the server.
  const items = jobList.map((job) =>
    jobItem(job, { distance: milesBetween(home, zipPoint(job.zip)), point: pinPoint(job.zip, job.id) })
  );
  const distById = new Map(items.map((i) => [i.id, i.nums.distance]));
  const filters = jobFilters({
    distanceHint: myZip ? (
      <>From your ZIP {myZip}. <Link href="/cna/profile" className="text-deepteal underline">Change</Link></>
    ) : (
      <>Add your home ZIP on <Link href="/cna/profile" className="text-deepteal underline">your profile</Link> to filter by distance.</>
    ),
  });

  const cards: Record<string, React.ReactNode> = {};
  for (const job of jobList) {
    const posterName = 'A family';
    const av = avatarClass(posterName);
    const isApplied = appliedSet.has(job.id);
    cards[job.id] = (
      <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative h-full">
        <div className="flex gap-4">
          <div className={`hidden sm:flex w-14 h-14 rounded-2xl ${av} items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}>
            {initials(posterName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg font-medium leading-tight">{job.title}</div>
                <div className="text-xs text-ink/60 mt-1">
                  Posted by <span className="text-deepteal">a family</span> · {postedAgo(job.posted_at)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl font-medium whitespace-nowrap">
                  {payRange(job.budget_min_cents, job.budget_max_cents)}<span className="text-sm text-ink/50">/hr</span>
                </div>
                <div className="text-[10px] text-ink/50 font-mono">
                  {job.hours_per_week ? `${job.hours_per_week} hrs/week` : SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}
                </div>
                {distById.get(job.id) != null && (
                  <div className="text-[10px] text-deepteal font-mono">~{distById.get(job.id)} mi away</div>
                )}
              </div>
            </div>
            {(job.days?.length || job.start_time || job.recipient_age_bracket) && (
              <div className="text-xs text-ink/65 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {(job.days?.length || job.start_time) && (
                  <span>
                    🗓 {SCHEDULE_LABEL[job.schedule_type]}
                    {job.days?.length ? ` · ${formatDays(job.days)}` : ''}
                    {job.start_time && job.end_time ? ` · ${formatTime(job.start_time)}–${formatTime(job.end_time)}` : ''}
                  </span>
                )}
                {job.recipient_age_bracket && <span>👤 Age {AGE_LABEL[job.recipient_age_bracket] ?? job.recipient_age_bracket}</span>}
              </div>
            )}
            <p className="text-sm text-ink/75 mt-2 leading-relaxed line-clamp-3">{job.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(job.services_needed ?? []).slice(0, 4).map((t: string) => (
                <span key={t} className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">
                  {SERVICE_LABEL[t] ?? t.replace(/_/g, ' ')}
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
                <Link href="/cna/membership" className="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition">
                  🔒 Unlock to apply
                </Link>
              )}
              <Link href={`/cna/jobs/${job.id}`} className="flex-1 text-xs py-2 border border-ink/15 rounded-full hover:bg-mist transition text-center">
                View details
              </Link>
              <SaveJobButton jobId={job.id} initiallySaved={savedSet.has(job.id)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tab = (on: boolean, coral?: boolean) =>
    `rounded-full px-4 py-2 text-sm border transition ${on ? (coral ? 'bg-coral text-cream border-coral' : 'bg-ink text-cream border-ink') : 'bg-white border-ink/15 hover:bg-mist'}`;

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 pt-5 lg:pt-10 pb-16">
      <h1 className="font-display text-3xl md:text-4xl font-light leading-tight mb-4 fade-up">
        {showSaved ? (
          <>Your <span className="italic font-medium text-gradient">saved jobs</span></>
        ) : (
          <>Find <span className="italic font-medium text-gradient">work</span></>
        )}
      </h1>

      <FilterableList
        items={items}
        cards={cards}
        filters={filters}
        sorts={jobSorts(!!home)}
        map={{ home }}
        searchPlaceholder="Search jobs, e.g. dementia, evenings"
        noun={['job', 'jobs']}
        listClassName="grid gap-4 lg:grid-cols-2"
        toolbarExtra={
          <>
            <Link href="/cna/jobs" className={tab(!showSaved)}>All jobs</Link>
            <Link href="/cna/jobs?saved=1" className={tab(showSaved, true)}>
              ♥ Saved{savedOpenCount ? ` (${savedOpenCount})` : ''}
            </Link>
          </>
        }
        banner={
          !canApply ? (
            <div className="bg-gradient-to-br from-mist/70 to-creamdark/70 border border-ink/10 rounded-2xl px-4 py-3 flex items-center gap-3 justify-between">
              <p className="text-sm text-ink/75">
                <span className="font-medium text-ink">Preview.</span> Addresses and applying open once you meet the Kindred Standard.
              </p>
              <Link href="/cna/membership" className="shrink-0 text-sm text-deepteal font-medium hover:text-coral whitespace-nowrap">
                What&apos;s left →
              </Link>
            </div>
          ) : null
        }
        empty={
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-3">{showSaved ? '♡' : '🔍'}</div>
            <h3 className="font-display text-xl font-medium mb-1">{showSaved ? 'Nothing saved yet' : 'No open jobs yet'}</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto mb-5">
              {showSaved
                ? 'Tap the ♡ on any job to keep it here.'
                : 'Jobs appear here as families post them. Keep your service area and availability up to date.'}
            </p>
            {!showSaved && (
              <Link href="/cna/schedule" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                Update availability →
              </Link>
            )}
          </div>
        }
      />
    </main>
  );
}
