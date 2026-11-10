/**
 * /client/jobs/[id] — one of the family's job posts in detail. Ownership-
 * gated: only the client who posted the job can view this page.
 *
 * Shows:
 * - The job itself (title, description, schedule, services, ZIP, status)
 * - A "Close posting" button (top right) when status is still open
 * - The full applicant list with each CNA's note, proposed rate, and Accept /
 *   Decline buttons. Once accepted, the booking is created and the other
 *   applications auto-reject — the UI reflects that.
 *
 * Real-data-only: applicants are real rows from job_applications joined to
 * cna_profiles. No filler.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { ApplicantDecisionButtons } from '@/components/client/ApplicantDecisionButtons';
import { CloseJobButton } from '@/components/client/CloseJobButton';
import { StartMessageModal } from '@/components/client/StartMessageModal';
import { normalizePair } from '@/lib/messaging';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const JOB_STATUS_CHIP: Record<string, { label: string; chip: string }> = {
  open: { label: 'Open · accepting applications', chip: 'bg-sage/15 text-deepteal border-sage/30' },
  in_review: { label: 'In review', chip: 'bg-butter/40 text-ink border-butter/60' },
  filled: { label: '✓ Filled', chip: 'bg-deepteal text-cream border-deepteal' },
  cancelled: { label: 'Closed', chip: 'bg-creamdark text-ink/60 border-ink/15' },
  expired: { label: 'Expired', chip: 'bg-creamdark text-ink/60 border-ink/15' },
  draft: { label: 'Draft', chip: 'bg-mist text-ink/60 border-ink/15' },
};

const SCHEDULE_LABEL: Record<string, string> = {
  recurring: 'Recurring weekly',
  one_time: 'One-time',
  live_in: 'Live-in',
  on_call: 'On-call',
};

function payRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Open rate';
  if (min != null && max != null && min !== max)
    return `${formatCents(min, { showFraction: false })}–${formatCents(max, { showFraction: false })}`;
  return formatCents((min ?? max)!, { showFraction: false });
}

export default async function ClientJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const { data: job } = await supabase
    .from('jobs')
    .select(
      'id, client_id, title, description, schedule_type, hours_per_week, budget_min_cents, budget_max_cents, services_needed, zip, status, posted_at, start_date',
    )
    .eq('id', id)
    .maybeSingle();

  if (!job) notFound();
  if (job.client_id !== user.id) {
    // Don't reveal whether the job exists for other people's posts.
    notFound();
  }

  // Applicants for this job.
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id, cna_id, status, message, proposed_hourly_rate_cents, created_at')
    .eq('job_id', job.id)
    .order('created_at', { ascending: false });

  const applications = apps ?? [];
  const cnaIds = Array.from(new Set(applications.map((a) => a.cna_id)));
  const cnaMap = new Map<
    string,
    { name: string; bio: string | null; rating: number | null; ratingCount: number; rate: number | null; years: number | null; tier: string }
  >();
  if (cnaIds.length > 0) {
    // caregiver_cards(): safe columns only, for caregivers this family is connected to.
    const { data: cnas } = await supabase.rpc('caregiver_cards', { ids: cnaIds });
    (cnas ?? []).forEach((c) =>
      cnaMap.set(c.user_id, {
        name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`,
        bio: c.bio,
        rating: c.rating_avg,
        ratingCount: c.rating_count ?? 0,
        rate: c.hourly_rate_cents,
        years: c.years_experience,
        tier: c.tier,
      }),
    );
  }

  const statusMeta = JOB_STATUS_CHIP[job.status] ?? JOB_STATUS_CHIP.open;
  const canClose = job.status === 'open' || job.status === 'in_review' || job.status === 'draft';

  const submittedCount = applications.filter((a) => a.status === 'submitted' || a.status === 'shortlisted').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  // Existing threads between the family and any of these applicants. Used to
  // deep-link the "Message [first name] →" button when a thread already
  // exists (e.g. the family messaged this CNA before hiring them, OR the
  // hire flow auto-created the thread on accept).
  //
  // The participant_a < participant_b constraint means we have to build the
  // .or() filter carefully. We use normalizePair to find the (a, b) for each
  // (me, applicant) pair, then look up all matching threads in one query.
  const threadIdByCnaId = new Map<string, string>();
  if (applications.length > 0) {
    // Two index lookups (one for each side of the pair) covers all cases.
    const meSmaller: string[] = [];
    const meLarger: string[] = [];
    for (const a of applications) {
      const { a: smaller } = normalizePair(user.id, a.cna_id);
      if (smaller === user.id) meSmaller.push(a.cna_id);
      else meLarger.push(a.cna_id);
    }
    const lookups = await Promise.all([
      meSmaller.length > 0
        ? supabase
            .from('message_threads')
            .select('id, participant_a, participant_b')
            .eq('participant_a', user.id)
            .in('participant_b', meSmaller)
        : Promise.resolve({ data: [] as Array<{ id: string; participant_a: string; participant_b: string }> }),
      meLarger.length > 0
        ? supabase
            .from('message_threads')
            .select('id, participant_a, participant_b')
            .eq('participant_b', user.id)
            .in('participant_a', meLarger)
        : Promise.resolve({ data: [] as Array<{ id: string; participant_a: string; participant_b: string }> }),
    ]);
    for (const result of lookups) {
      for (const t of result.data ?? []) {
        const cnaId = t.participant_a === user.id ? t.participant_b : t.participant_a;
        threadIdByCnaId.set(cnaId, t.id);
      }
    }
  }

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-10 lg:py-12">
      <Link href="/client/dashboard" className="text-xs text-ink/60 hover:text-coral inline-block mb-5">
        ← Back to dashboard
      </Link>

      {/* JOB HEADER */}
      <section className="mb-8 fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Your job post</div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono border ${statusMeta.chip}`}>
                {statusMeta.label}
              </span>
              {job.posted_at && (
                <span className="text-xs text-ink/60 font-mono">
                  Posted {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {canClose && <CloseJobButton jobId={job.id} />}
            <Link
              href="/client/post-job"
              className="text-xs text-deepteal hover:text-coral"
            >
              + Post another job
            </Link>
          </div>
        </div>
      </section>

      {/* JOB SUMMARY CARD */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 pb-5 border-b border-ink/10">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Pay</div>
              <div className="font-display text-xl font-medium">
                {payRange(job.budget_min_cents, job.budget_max_cents)}<span className="text-sm text-ink/60">/hr</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Schedule</div>
              <div className="font-display text-xl font-medium">
                {SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Hours / week</div>
              <div className="font-display text-xl font-medium">{job.hours_per_week ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Location</div>
              <div className="font-display text-xl font-medium font-mono">📍 {job.zip}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">What you wrote</div>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {job.services_needed && job.services_needed.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Services needed</div>
              <div className="flex flex-wrap gap-1.5">
                {job.services_needed.map((s: string) => (
                  <span key={s} className="text-[11px] bg-mist/70 px-3 py-1 rounded-full border border-teal/20">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* APPLICANTS */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Applicants</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">
              {applications.length > 0
                ? `${applications.length} ${applications.length === 1 ? 'caregiver' : 'caregivers'} interested`
                : 'No applicants yet'}
            </h2>
            {applications.length > 0 && (
              <p className="text-sm text-ink/60 mt-1">
                {submittedCount > 0 && `${submittedCount} awaiting your review`}
                {submittedCount > 0 && acceptedCount > 0 && ' · '}
                {acceptedCount > 0 && `${acceptedCount} hired`}
              </p>
            )}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">⏳</div>
            <h3 className="font-display text-xl font-medium mb-1">No one's applied yet</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              CNAs in your ZIP get notified as soon as a job is posted. New applications usually arrive
              within a few hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const cna = cnaMap.get(app.cna_id);
              const name = cna?.name ?? 'Caregiver';
              const av = avatarClass(name);
              return (
                <div
                  key={app.id}
                  className={`bg-white border rounded-2xl p-5 ${
                    app.status === 'accepted' ? 'border-sage/40' : 'border-ink/10'
                  }`}
                >
                  <div className="flex gap-5">
                    <div
                      className={`w-16 h-16 rounded-2xl ${av} flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}
                    >
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="font-display text-lg font-medium leading-tight">{name}</div>
                          <div className="text-xs text-ink/60 mt-1 font-mono">
                            {cna?.rating != null && cna.ratingCount > 0
                              ? `★ ${Number(cna.rating).toFixed(1)} · ${cna.ratingCount} reviews`
                              : 'New to Kindred'}
                            {cna?.years != null ? ` · ${cna.years} yrs exp` : ''}
                          </div>
                          <div className="text-[10px] text-ink/50 font-mono mt-1">
                            Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-lg font-medium">
                            {app.proposed_hourly_rate_cents
                              ? formatCents(app.proposed_hourly_rate_cents, { showFraction: false })
                              : cna?.rate
                              ? formatCents(cna.rate, { showFraction: false })
                              : '—'}
                            <span className="text-sm text-ink/50">/hr</span>
                          </div>
                          <div className="text-[10px] text-ink/50 font-mono">
                            {app.proposed_hourly_rate_cents ? 'For this job' : 'Default rate'}
                          </div>
                        </div>
                      </div>

                      {app.message && (
                        <div className="mt-3 bg-mist/40 border border-ink/10 rounded-xl p-3 text-sm text-ink/80 leading-relaxed">
                          <span className="text-xs font-mono uppercase tracking-widest text-ink/50 block mb-1">Their note</span>
                          {app.message}
                        </div>
                      )}

                      {cna?.bio && (
                        <p className="text-xs text-ink/65 mt-3 leading-relaxed line-clamp-2 italic">
                          {cna.bio}
                        </p>
                      )}

                      <div className="flex justify-end items-center mt-4 gap-2 flex-wrap">
                        {app.status !== 'rejected' && app.status !== 'withdrawn' && (
                          <StartMessageModal
                            cnaId={app.cna_id}
                            cnaName={name}
                            cnaSubtitle={
                              app.proposed_hourly_rate_cents
                                ? `${formatCents(app.proposed_hourly_rate_cents, { showFraction: false })}/hr for this job`
                                : cna?.rate
                                  ? `${formatCents(cna.rate, { showFraction: false })}/hr default`
                                  : undefined
                            }
                            startedVia="application_review"
                            jobId={job.id}
                            helperText={`About “${job.title}”`}
                            buttonClassName="text-xs px-3.5 py-1.5 border border-ink/15 rounded-full hover:bg-mist transition"
                            buttonLabel="Message applicant"
                          />
                        )}
                        <ApplicantDecisionButtons
                          applicationId={app.id}
                          applicantFirstName={(cna?.name ?? 'this caregiver').split(' ')[0]}
                          status={app.status as 'submitted' | 'shortlisted' | 'rejected' | 'withdrawn' | 'accepted'}
                          existingThreadId={threadIdByCnaId.get(app.cna_id) ?? null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
