'use server';

/**
 * Server actions for the CNA application review queue.
 *
 * Admins only. Every action re-checks the requester's role server-side, then
 * writes with the service-role client (these are writes to OTHER users' rows,
 * so we intentionally bypass RLS after the admin gate — same pattern as the
 * close-account action). Every transition is recorded in audit_log.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AppStage } from './stages';

const VALID_TARGETS: AppStage[] = [
  'submitted',
  'interviewing',
  'verifying',
  'approved',
  'rejected',
  'waitlisted',
];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || profile.status !== 'active') {
    throw new Error('Not authorized');
  }
  return { adminId: user.id };
}

/**
 * One action drives every stage change. The form supplies:
 *   applicant_id  (required)
 *   next_status   (required) — target stage
 *   reason        (optional) — decline reason, stored when declining
 *   interview_at  (optional) — datetime-local string, stored as the interview time
 *   notes         (optional) — private admin notes (overwrites)
 */
export async function updateApplicationAction(formData: FormData) {
  const applicantId = formData.get('applicant_id')?.toString();
  const nextStatus = formData.get('next_status')?.toString() as AppStage | undefined;
  const reason = formData.get('reason')?.toString();
  const interviewAtRaw = formData.get('interview_at')?.toString();
  const notes = formData.get('notes')?.toString();

  if (!applicantId) throw new Error('Missing applicant id');
  if (!nextStatus || !VALID_TARGETS.includes(nextStatus)) {
    throw new Error('Invalid target stage');
  }

  const { adminId } = await requireAdmin();

  // Service client: we're writing to the applicant's row, not our own.
  // `as any` on the table builder because these columns were added in
  // migration 00019 and database.types.ts has not been regenerated yet.
  const svc = createServiceClient();

  const { data: current } = await svc
    .from('cna_profiles')
    .select('application_status')
    .eq('user_id', applicantId)
    .single();

  const patch: Record<string, unknown> = { application_status: nextStatus };

  if (interviewAtRaw) {
    patch.interview_at = new Date(interviewAtRaw).toISOString();
  }
  if (typeof reason === 'string') {
    patch.application_decline_reason = reason.trim() || null;
  }
  if (typeof notes === 'string') {
    patch.application_notes = notes.trim() || null;
  }
  // Approval makes them visible in Browse and activates the account.
  if (nextStatus === 'approved') {
    patch.availability_status = 'available';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc.from('cna_profiles') as any).update(patch).eq('user_id', applicantId);

  if (nextStatus === 'approved') {
    await svc.from('users').update({ status: 'active' }).eq('id', applicantId);
  }

  // Best-effort audit trail — never let logging failure block the action.
  try {
    await svc.from('audit_log').insert({
      user_id: adminId,
      action: 'update',
      resource_type: 'cna_application',
      resource_id: applicantId,
      context: {
        from: (current as { application_status?: string } | null)?.application_status ?? null,
        to: nextStatus,
        reason: reason ?? null,
      },
    });
  } catch {
    /* audit logging is best-effort */
  }

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${applicantId}`);
  redirect(`/admin/applications/${applicantId}`);
}
