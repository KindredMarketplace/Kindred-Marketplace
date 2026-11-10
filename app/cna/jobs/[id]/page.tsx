/**
 * /cna/jobs/[id] — full detail of one job, for a CNA. Open to any logged-in
 * user with read access to the job (RLS handles auth-level gating).
 *
 * Shows:
 * - The full job (everything the family wrote)
 * - One of three primary actions, in order of precedence:
 *     1. If the CNA has been accepted → big "✓ You've been hired" card
 *     2. If the CNA has applied (any other status) → status + Withdraw button
 *     3. Otherwise → the Apply-with-note modal trigger
 *
 * Messaging is intentionally gated: the CNA can't DM the client until the
 * client accepts. The note in the application is their only intro channel.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { JobApplyModal } from '@/components/cna/JobApplyModal';
import { SaveJobButton } from '@/components/cna/SaveJobButton';
import { WithdrawApplicationButton } from '@/components/cna/WithdrawApplicationButton';
import { findThreadBetween } from '@/lib/messaging';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const SCHEDULE_LABEL: Record<string, string> = {
  recurring: 'Recurring weekly',
  one_time: 'One-time',
  live_in: 'Live-in',
  on_call: 'On-call',
};

const APP_STATUS_META: Record<string, { label: string; chip: string; tone: 'pending' | 'good' | 'bad' }> = {
  submitted: { label: 'Awaiting their response', chip: 'bg-mist text-ink/70 border-ink/15', tone: 'pending' },
  shortlisted: { label: '✨ Shortlisted', chip: 'bg-butter/40 text-ink border-butter/60', tone: 'good' },
  accepted: { label: '✓ Hired', chip: 'bg-sage/20 text-deepteal border-sage/40', tone: 'good' },
  rejected: { label: 'Not selected', chip: 'bg-creamdark text-ink/60 border-ink/15', tone: 'bad' },
  withdrawn: { label: 'You withdrew', chip: 'bg-creamdark text-ink/60 border-ink/15', tone: 'bad' },
};

function payRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Open rate';
  if (min != null && max != null && min !== max)
    return `${formatCents(min, { showFraction: false })}–${formatCents(max, { showFraction: false })}`;
  return formatCents((min ?? max)!, { showFraction: false });
}

export default async function CnaJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  // Listed caregivers (and anyone who already applied) can read the job row
  // directly. Everyone else gets the locked-preview version from
  // browse_open_jobs(): same post, no street address, can't apply yet.
  const [{ data: direct }, access] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, client_id, title, description, schedule_type, hours_per_week, budget_min_cents, budget_max_cents, services_needed, zip, status, posted_at, start_date',
      )
      .eq('id', id)
      .maybeSingle(),
    viewingAs && user ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
  ]);

  let job: (typeof direct & {}) | null = direct;
  if (!job) {
    const { data: previewRows } = await supabase.rpc('browse_open_jobs');
    const p = (previewRows ?? []).find((r) => r.id === id);
    if (p) {
      job = {
        id: p.id,
        client_id: '',
        title: p.title,
        description: p.description ?? '',
        schedule_type: p.schedule_type,
        hours_per_week: p.hours_per_week,
        budget_min_cents: p.budget_min_cents,
        budget_max_cents: p.budget_max_cents,
        services_needed: p.services_needed ?? [],
        zip: p.zip ?? '',
        status: p.status,
        posted_at: p.posted_at,
        start_date: p.start_date,
      } as NonNullable<typeof direct>;
    }
  }

  if (!job) notFound();
  const isListed = access?.is_listed === true;

  const { data: savedRow } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('cna_id', user.id)
    .eq('job_id', job.id)
    .maybeSingle();
  const isSaved = !!savedRow;

  // Families' names are private (client_profiles is owner-only), so posts
  // always read "A family" until there's a hire.
  const posterFirst = 'A family';

  // This CNA's application against this job, if any.
  const { data: myApp } = await supabase
    .from('job_applications')
    .select('id, status, message, proposed_hourly_rate_cents, created_at')
    .eq('job_id', job.id)
    .eq('cna_id', user.id)
    .maybeSingle();

  const isAccepted = myApp?.status === 'accepted';
  const hasActiveApp = myApp && myApp.status !== 'rejected' && myApp.status !== 'withdrawn';
  const canApply = isListed && !myApp && (job.status === 'open' || job.status === 'in_review');
  const lockedPreview = !isListed && !myApp && (job.status === 'open' || job.status === 'in_review');

  // If hired, look up the message thread so the "Message [family]" button
  // can deep-link to it. acceptApplicantAction creates/promotes the thread
  // as part of the hire, so it should exist by the time the CNA sees this.
  let hireThreadId: string | null = null;
  if (isAccepted && job.client_id) {
    const t = await findThreadBetween(supabase, user.id, job.client_id);
    hireThreadId = t?.id ?? null;
  }

  const av = avatarClass('family');

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-10 lg:py-12">
      <Link href="/cna/jobs" className="text-xs text-ink/60 hover:text-coral inline-block mb-5">
        ← All open jobs
      </Link>

      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-16 h-16 rounded-2xl ${av} flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}
          >
            {initials('Family')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Posted by {posterFirst}</div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light leading-tight">{job.title}</h1>
            {job.posted_at && (
              <div className="text-xs text-ink/60 font-mono mt-2">
                Posted {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}📍 {job.zip}
              </div>
            )}
          </div>
          <SaveJobButton jobId={job.id} initiallySaved={isSaved} size="md" />
        </div>
      </section>

      {/* CTA / STATUS CARD — depends on application state */}
      <section className="mb-8 fade-up" style={{ animationDelay: '.05s' }}>
        {isAccepted ? (
          // Hired
          <div className="bg-gradient-to-br from-sage/25 to-teal/20 border border-sage/40 rounded-3xl p-6 lg:p-7">
            <div className="text-xs font-mono uppercase tracking-widest text-deepteal mb-2">✓ You&rsquo;ve been hired</div>
            <h2 className="font-display text-2xl font-medium mb-2">{posterFirst} accepted you for this job.</h2>
            <p className="text-sm text-ink/75 leading-relaxed max-w-2xl mb-4">
              A booking has been created. You can now message {posterFirst} directly to coordinate your
              first visit.
            </p>
            <Link
              href={hireThreadId ? `/cna/messages/${hireThreadId}` : '/cna/messages'}
              className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
            >
              Message {posterFirst} →
            </Link>
          </div>
        ) : hasActiveApp ? (
          // Applied (submitted/shortlisted)
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your application</div>
                <h2 className="font-display text-xl font-medium">Submitted {new Date(myApp!.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono border ${APP_STATUS_META[myApp!.status].chip}`}
              >
                {APP_STATUS_META[myApp!.status].label}
              </span>
            </div>

            {myApp!.message && (
              <div className="bg-mist/40 border border-ink/10 rounded-xl p-3 text-sm text-ink/80 leading-relaxed mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-ink/50 block mb-1">Your note</span>
                {myApp!.message}
              </div>
            )}

            {myApp!.proposed_hourly_rate_cents && (
              <div className="text-xs text-ink/70 mb-4 font-mono">
                Rate you proposed: {formatCents(myApp!.proposed_hourly_rate_cents, { showFraction: false })}/hr
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-ink/10">
              <WithdrawApplicationButton applicationId={myApp!.id} />
            </div>
          </div>
        ) : myApp ? (
          // Rejected: terminal state, no actions.
          // Withdrawn: terminal-ish, but we let the CNA re-apply (common case:
          // accidentally withdrew, or wants to send a fresh note).
          myApp.status === 'withdrawn' ? (
            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your application</div>
                  <h2 className="font-display text-xl font-medium">You withdrew</h2>
                  <p className="text-xs text-ink/60 mt-1">Changed your mind? Re-apply with a fresh note.</p>
                </div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono border bg-creamdark text-ink/60 border-ink/15">
                  Withdrawn
                </span>
              </div>
              <div className="flex justify-end pt-3 border-t border-ink/10">
                <JobApplyModal
                  jobId={job.id}
                  jobTitle={job.title}
                  budgetHint={`${payRange(job.budget_min_cents, job.budget_max_cents)}/hr · ${SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}`}
                  buttonClassName="text-xs px-4 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition"
                  buttonLabel="Re-apply →"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-ink/10 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your application</div>
                <div className="font-display text-lg font-medium">{APP_STATUS_META[myApp.status].label}</div>
              </div>
              <Link href="/cna/jobs" className="text-xs text-deepteal hover:text-coral">
                Find other jobs →
              </Link>
            </div>
          )
        ) : canApply ? (
          // Not applied yet — show the apply CTA
          <div className="bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-6 lg:p-7">
            <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">Interested?</div>
            <div className="font-display text-2xl font-medium mb-2">
              Let {posterFirst} know with a short note.
            </div>
            <p className="text-sm text-cream/85 leading-relaxed max-w-xl mb-5">
              Your profile, rate, and reviews are already part of the application. Just leave a quick
              intro — one or two sentences is plenty.
            </p>
            <JobApplyModal
              jobId={job.id}
              jobTitle={job.title}
              budgetHint={`${payRange(job.budget_min_cents, job.budget_max_cents)}/hr · ${SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}`}
              buttonClassName="inline-block bg-cream text-deepteal px-6 py-3 rounded-full text-sm font-medium hover:bg-cream/90 transition"
              buttonLabel="Express interest →"
            />
          </div>
        ) : lockedPreview ? (
          <div className="bg-gradient-to-br from-mist/70 to-creamdark/70 border border-ink/10 rounded-3xl p-6 lg:p-7">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Preview</div>
            <div className="font-display text-2xl font-medium mb-2">Applying opens once you&apos;re listed.</div>
            <p className="text-sm text-ink/70 leading-relaxed max-w-xl mb-5">
              This is a real job post. To apply you need to meet the Kindred Standard and have an active
              membership. Founding caregivers get their first year free.
            </p>
            <Link
              href="/cna/membership"
              className="inline-block bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition"
            >
              See what&apos;s left →
            </Link>
          </div>
        ) : (
          // Job not open
          <div className="bg-white border border-ink/10 rounded-2xl p-6 text-center">
            <div className="text-sm text-ink/70">This job is no longer accepting applications.</div>
          </div>
        )}
      </section>

      {/* JOB DETAILS */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
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
              <div className="font-display text-xl font-medium">{SCHEDULE_LABEL[job.schedule_type] ?? job.schedule_type}</div>
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
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">About the care needed</div>
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

      <section className="fade-up" style={{ animationDelay: '.15s' }}>
        <div className="bg-creamdark/60 border border-ink/10 rounded-2xl p-5 text-xs text-ink/70 leading-relaxed">
          <strong className="text-ink">Why can&rsquo;t I message them right now?</strong> Messaging
          unlocks once the family accepts your application. The note you include with your
          application is your introduction — keep it warm and specific.
        </div>
      </section>
    </main>
  );
}
