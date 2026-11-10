'use server';

/**
 * applyToJobAction — CNA applies to an open job.
 *
 * Inserts a row into `job_applications` for the logged-in CNA against the
 * given job id. Idempotent: if the CNA has already applied (unique constraint
 * job_id + cna_id), we return that gracefully so the UI can show "applied".
 *
 * Only callable by an authenticated user who has a `cna_profiles` row — the
 * FK to cna_profiles guarantees that at the DB level too.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ApplySchema = z.object({
  job_id: z.string().uuid('That job link looks malformed.'),
  message: z.string().max(2000).optional(),
  proposed_rate_cents: z.coerce.number().int().positive().optional(),
});

export type ApplyResult =
  | { ok: true; status: 'submitted' | 'reactivated' | 'already_applied' }
  | { ok: false; error: string };

export async function applyToJobAction(formData: FormData): Promise<ApplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in to apply.' };

  const raw = {
    job_id: formData.get('job_id')?.toString() ?? '',
    message: formData.get('message')?.toString() || undefined,
    proposed_rate_cents: formData.get('proposed_rate_cents')?.toString() || undefined,
  };

  const parsed = ApplySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not submit application.' };
  }

  // Confirm the job is still open before writing.
  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, client_id')
    .eq('id', parsed.data.job_id)
    .maybeSingle();

  if (!job) return { ok: false, error: 'That job is no longer available.' };
  if (job.status !== 'open' && job.status !== 'in_review') {
    return { ok: false, error: 'That job is no longer accepting applications.' };
  }

  // Block applying to your own job. This is normally impossible — the CNA
  // and client portals are different surfaces — but if a single account is
  // used for both roles (e.g. during demo), the resulting state breaks
  // downstream flows (you can't message "yourself" as the applicant).
  if (job.client_id === user.id) {
    return {
      ok: false,
      error: 'You can\u2019t apply to your own job post. To test this end-to-end, sign in as a different account on the caregiver side.',
    };
  }

  // Ensure this user has a cna_profiles row. `job_applications.cna_id` FKs to
  // cna_profiles(user_id), so without this an FK error fires on insert. We
  // auto-create a minimal profile with application_status='incomplete' so the
  // CNA can apply right away, but the profile is HIDDEN from /client/browse
  // until they finish it (see that page's query: it filters to approved only).
  const { data: cnaProfile } = await supabase
    .from('cna_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!cnaProfile) {
    // Pull a default display_name from public.users.
    const { data: userRow } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    const defaultName =
      (userRow?.full_name && userRow.full_name.trim()) ||
      userRow?.email?.split('@')[0] ||
      'Caregiver';

    const { error: profileError } = await supabase.from('cna_profiles').insert({
      user_id: user.id,
      display_name: defaultName,
      application_status: 'incomplete',
      availability_status: 'inactive', // won't surface in browse until fields are filled
    });
    if (profileError) {
      return {
        ok: false,
        error: `Could not set up your caregiver profile: ${profileError.message}`,
      };
    }
  }

  // Check for a pre-existing application from this CNA on this job. There
  // are three cases:
  //   - withdrawn  → re-activate the row (preserves history) with the new
  //                  message + proposed rate. This is the re-apply flow.
  //   - rejected   → don't allow re-apply via this action. The family
  //                  already declined; reaching out again should happen
  //                  through messaging, not a fresh application.
  //   - submitted / shortlisted / accepted → they've already applied; just
  //                  return already_applied so the UI flips to "applied" state.
  const { data: existingApp } = await supabase
    .from('job_applications')
    .select('id, status')
    .eq('job_id', parsed.data.job_id)
    .eq('cna_id', user.id)
    .maybeSingle();

  if (existingApp) {
    if (existingApp.status === 'withdrawn') {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          status: 'submitted',
          message: parsed.data.message ?? null,
          proposed_hourly_rate_cents: parsed.data.proposed_rate_cents ?? null,
        })
        .eq('id', existingApp.id);
      if (updateError) return { ok: false, error: updateError.message };

      revalidatePath('/cna/jobs');
      revalidatePath('/cna/dashboard');
      revalidatePath(`/cna/jobs/${parsed.data.job_id}`);
      revalidatePath(`/client/jobs/${parsed.data.job_id}`);
      return { ok: true, status: 'reactivated' };
    }
    if (existingApp.status === 'rejected') {
      return {
        ok: false,
        error: 'The family already passed on your application. Try reaching out through a new conversation instead of re-applying.',
      };
    }
    // submitted / shortlisted / accepted — already applied.
    return { ok: true, status: 'already_applied' };
  }

  // No existing application — insert new.
  const { error } = await supabase.from('job_applications').insert({
    job_id: parsed.data.job_id,
    cna_id: user.id,
    message: parsed.data.message ?? null,
    proposed_hourly_rate_cents: parsed.data.proposed_rate_cents ?? null,
    status: 'submitted',
  });

  if (error) {
    // Postgres unique_violation = 23505. Race-safe fallback in case the row
    // got inserted between our existence check and this insert.
    if (error.code === '23505') {
      return { ok: true, status: 'already_applied' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/cna/jobs');
  revalidatePath('/cna/dashboard');
  revalidatePath(`/cna/jobs/${parsed.data.job_id}`);
  revalidatePath(`/client/jobs/${parsed.data.job_id}`);
  return { ok: true, status: 'submitted' };
}

/**
 * withdrawApplicationAction — CNA withdraws their own application.
 *
 * Sets status='withdrawn' on the application row. We don't delete — the
 * history is preserved so the family sees "the CNA withdrew" rather than the
 * application silently disappearing.
 */

const WithdrawSchema = z.object({
  application_id: z.string().uuid('That application link looks malformed.'),
});

export type WithdrawResult = { ok: true } | { ok: false; error: string };

export async function withdrawApplicationAction(formData: FormData): Promise<WithdrawResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = WithdrawSchema.safeParse({
    application_id: formData.get('application_id')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not withdraw.' };
  }

  // Only the CNA who owns the application can withdraw it.
  const { data: app } = await supabase
    .from('job_applications')
    .select('id, cna_id, status, job_id')
    .eq('id', parsed.data.application_id)
    .maybeSingle();

  if (!app) return { ok: false, error: 'Application not found.' };
  if (app.cna_id !== user.id) {
    return { ok: false, error: 'You can only withdraw your own application.' };
  }
  if (app.status === 'accepted') {
    return { ok: false, error: 'You can\u2019t withdraw an application that\u2019s already been accepted. Message the family instead.' };
  }
  if (app.status === 'withdrawn') {
    return { ok: true };
  }

  const { error } = await supabase
    .from('job_applications')
    .update({ status: 'withdrawn' })
    .eq('id', parsed.data.application_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/cna/jobs');
  revalidatePath('/cna/dashboard');
  revalidatePath(`/cna/jobs/${app.job_id}`);
  revalidatePath(`/client/jobs/${app.job_id}`);
  return { ok: true };
}

/**
 * Save / unsave a job (the ♡). Returns the new state so the button can
 * settle on what the database actually holds.
 */
export async function toggleSaveJobAction(jobId: string, save: boolean): Promise<{ ok: boolean; saved: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return { ok: false, saved: !save };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, saved: !save };

  if (save) {
    const { error } = await supabase.from('saved_jobs').upsert({ cna_id: user.id, job_id: jobId }, { onConflict: 'cna_id,job_id', ignoreDuplicates: true });
    if (error) return { ok: false, saved: false };
  } else {
    const { error } = await supabase.from('saved_jobs').delete().eq('cna_id', user.id).eq('job_id', jobId);
    if (error) return { ok: false, saved: true };
  }
  revalidatePath('/cna/jobs');
  revalidatePath('/cna/dashboard');
  return { ok: true, saved: save };
}
