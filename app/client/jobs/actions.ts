'use server';

/**
 * Server actions for the client (family) side of the job lifecycle.
 *
 * - acceptApplicantAction: client picks a CNA → marks that application
 *   accepted, other open applications rejected, job status='filled', and
 *   creates a bookings row. Closes the loop: post → apply → hire.
 *
 * - declineApplicantAction: politely passes on a single applicant. The job
 *   stays open so other applications can still come in.
 *
 * - closeJobAction: client cancels their own job posting (no more applicants
 *   wanted). Any still-submitted applications are auto-rejected so CNAs see
 *   a final status instead of "awaiting response" forever.
 *
 * All three require that the logged-in user owns the job (jobs.client_id =
 * user.id). The DB schema's FK constraints + an explicit ownership check
 * enforce this defensively.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getOrCreateThread, promoteThreadToAccepted, findThreadBetween } from '@/lib/messaging';

// ---------------------------------------------------------------------------
// acceptApplicantAction
// ---------------------------------------------------------------------------

const AcceptSchema = z.object({
  application_id: z.string().uuid('That application link looks malformed.'),
});

export type AcceptApplicantResult =
  | { ok: true; booking_id: string; thread_id: string | null }
  | { ok: false; error: string };

export async function acceptApplicantAction(formData: FormData): Promise<AcceptApplicantResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = AcceptSchema.safeParse({
    application_id: formData.get('application_id')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not accept.' };
  }

  // Load application + parent job, with an ownership check.
  const { data: app } = await supabase
    .from('job_applications')
    .select('id, status, cna_id, job_id, proposed_hourly_rate_cents')
    .eq('id', parsed.data.application_id)
    .maybeSingle();

  if (!app) return { ok: false, error: 'Application not found.' };

  const { data: job } = await supabase
    .from('jobs')
    .select('id, client_id, status, budget_min_cents, budget_max_cents, care_recipient_id')
    .eq('id', app.job_id)
    .maybeSingle();

  if (!job) return { ok: false, error: 'Job not found.' };
  if (job.client_id !== user.id) {
    return { ok: false, error: 'You can only accept applicants on your own job posts.' };
  }
  if (app.status === 'accepted') {
    return { ok: false, error: 'That applicant is already accepted.' };
  }
  if (app.status === 'withdrawn' || app.status === 'rejected') {
    return { ok: false, error: 'That application is no longer active.' };
  }
  if (job.status === 'filled' || job.status === 'cancelled' || job.status === 'expired') {
    return { ok: false, error: 'This job is no longer accepting hires.' };
  }

  // Pick a sensible hourly rate for the booking — CNA's proposed rate if given,
  // else the budget midpoint, else min, else max. Must be > 0 per schema check.
  const fallbackRate =
    job.budget_min_cents != null && job.budget_max_cents != null
      ? Math.round((job.budget_min_cents + job.budget_max_cents) / 2)
      : job.budget_min_cents ?? job.budget_max_cents ?? null;
  const hourlyRateCents = app.proposed_hourly_rate_cents ?? fallbackRate;
  if (!hourlyRateCents || hourlyRateCents <= 0) {
    return {
      ok: false,
      error: 'Set a budget on the job before accepting — we need an hourly rate for the booking.',
    };
  }

  // Atomic-ish sequence:
  //   1) accept this application
  //   2) reject all other still-submitted/shortlisted applications on the job
  //   3) mark the job filled
  //   4) create the booking row
  // Supabase doesn't expose transactions over PostgREST, so we do this in
  // dependency order and roll forward. If a later step fails we surface the
  // error; manual cleanup is doable via the admin tools.

  const acceptUpdate = await supabase
    .from('job_applications')
    .update({ status: 'accepted' })
    .eq('id', app.id);
  if (acceptUpdate.error) return { ok: false, error: acceptUpdate.error.message };

  await supabase
    .from('job_applications')
    .update({ status: 'rejected' })
    .eq('job_id', app.job_id)
    .neq('id', app.id)
    .in('status', ['submitted', 'shortlisted']);

  await supabase.from('jobs').update({ status: 'filled' }).eq('id', app.job_id);

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      client_id: user.id,
      cna_id: app.cna_id,
      job_id: app.job_id,
      care_recipient_id: job.care_recipient_id,
      start_date: new Date().toISOString().slice(0, 10),
      hourly_rate_cents: hourlyRateCents,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (bookingError) return { ok: false, error: bookingError.message };

  // ---- Messaging integration --------------------------------------------
  // Now that the hire is finalized, make sure the family + CNA have a
  // ready-to-use conversation. Three cases:
  //   1. A thread already exists and is `accepted` — nothing to do, just
  //      pass the id back so the UI can deep-link.
  //   2. A thread already exists in `pending_request` — promote to accepted
  //      so it lands in both inboxes' Conversations tab. (Hiring implies
  //      mutual interest; the recipient no longer needs to reply to "accept.")
  //   3. No thread exists — create one tagged `started_via='hire'` with
  //      status='accepted' directly. No first message inserted; the family
  //      probably wants to send one themselves now that the hire is done.
  // We treat any messaging error as non-fatal — the hire is the important
  // part. We log the error path but still return ok=true with thread_id=null.

  let threadId: string | null = null;
  try {
    const existing = await findThreadBetween(supabase, user.id, app.cna_id);
    if (existing) {
      threadId = existing.id;
      if (existing.status === 'pending_request') {
        await promoteThreadToAccepted(supabase, existing.id);
      }
    } else {
      const created = await getOrCreateThread(supabase, {
        userA: user.id,
        userB: app.cna_id,
        startedBy: user.id,
        startedVia: 'hire',
        initialStatus: 'accepted',
        jobId: app.job_id,
        bookingId: booking.id,
      });
      if (created.ok) threadId = created.threadId;
    }
  } catch {
    // Swallow — hire succeeded; thread wiring is best-effort.
  }

  revalidatePath('/client/dashboard');
  revalidatePath(`/client/jobs/${app.job_id}`);
  revalidatePath('/cna/dashboard');
  revalidatePath(`/cna/jobs/${app.job_id}`);
  revalidatePath('/client/messages');
  revalidatePath('/cna/messages');
  if (threadId) {
    revalidatePath(`/client/messages/${threadId}`);
    revalidatePath(`/cna/messages/${threadId}`);
  }
  return { ok: true, booking_id: booking.id, thread_id: threadId };
}

// ---------------------------------------------------------------------------
// declineApplicantAction
// ---------------------------------------------------------------------------

const DeclineSchema = z.object({
  application_id: z.string().uuid('That application link looks malformed.'),
});

export type DeclineApplicantResult = { ok: true } | { ok: false; error: string };

export async function declineApplicantAction(formData: FormData): Promise<DeclineApplicantResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = DeclineSchema.safeParse({
    application_id: formData.get('application_id')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not decline.' };
  }

  // Ownership check via the parent job.
  const { data: app } = await supabase
    .from('job_applications')
    .select('id, status, job_id')
    .eq('id', parsed.data.application_id)
    .maybeSingle();
  if (!app) return { ok: false, error: 'Application not found.' };

  const { data: job } = await supabase.from('jobs').select('client_id').eq('id', app.job_id).maybeSingle();
  if (!job || job.client_id !== user.id) {
    return { ok: false, error: 'You can only decline applicants on your own job posts.' };
  }
  if (app.status === 'accepted') {
    return { ok: false, error: 'You\\u2019ve already accepted this applicant. Cancel the booking instead.' };
  }
  if (app.status === 'rejected' || app.status === 'withdrawn') {
    return { ok: true };
  }

  const { error } = await supabase
    .from('job_applications')
    .update({ status: 'rejected' })
    .eq('id', app.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/client/dashboard');
  revalidatePath(`/client/jobs/${app.job_id}`);
  revalidatePath('/cna/dashboard');
  revalidatePath(`/cna/jobs/${app.job_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// closeJobAction
// ---------------------------------------------------------------------------

const CloseSchema = z.object({
  job_id: z.string().uuid('That job link looks malformed.'),
});

export type CloseJobResult = { ok: true } | { ok: false; error: string };

export async function closeJobAction(formData: FormData): Promise<CloseJobResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = CloseSchema.safeParse({ job_id: formData.get('job_id')?.toString() ?? '' });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not close job.' };
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, client_id, status')
    .eq('id', parsed.data.job_id)
    .maybeSingle();

  if (!job) return { ok: false, error: 'Job not found.' };
  if (job.client_id !== user.id) {
    return { ok: false, error: 'You can only close your own jobs.' };
  }
  if (job.status === 'cancelled' || job.status === 'expired') {
    return { ok: true };
  }
  if (job.status === 'filled') {
    return {
      ok: false,
      error: 'This job has already been filled. Cancel the booking from your dashboard if you need to undo it.',
    };
  }

  // Reject still-open applications so CNAs see a final status.
  await supabase
    .from('job_applications')
    .update({ status: 'rejected' })
    .eq('job_id', job.id)
    .in('status', ['submitted', 'shortlisted']);

  const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', job.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/client/dashboard');
  revalidatePath(`/client/jobs/${job.id}`);
  revalidatePath('/cna/jobs');
  revalidatePath('/cna/dashboard');
  return { ok: true };
}
