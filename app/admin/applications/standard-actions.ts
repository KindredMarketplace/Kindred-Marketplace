'use server';

/**
 * Admin actions for the Kindred Standard + memberships.
 *
 * Admin-gated, then written with the service role (these rows belong to
 * other users). Every change is recorded in audit_log. A caregiver becomes
 * LISTED automatically once all of these are true (see
 * kindred_internal.is_listed in migration 00024).
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile } = await supabase.from('users').select('role, status').eq('id', user.id).single();
  if (profile?.role !== 'admin' || profile.status !== 'active') throw new Error('Not authorized');
  return { adminId: user.id };
}

const VerificationSchema = z.object({
  applicant_id: z.string().uuid(),
  type: z.enum(['l2bg', 'identity', 'insurance']),
  status: z.enum(['verified', 'rejected', 'pending']),
  expires_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
});

export async function setVerificationAction(formData: FormData) {
  const { adminId } = await requireAdmin();
  const parsed = VerificationSchema.safeParse({
    applicant_id: formData.get('applicant_id')?.toString(),
    type: formData.get('type')?.toString(),
    status: formData.get('status')?.toString(),
    expires_at: formData.get('expires_at')?.toString() ?? '',
  });
  if (!parsed.success) throw new Error('Invalid verification update');
  const { applicant_id, type, status } = parsed.data;
  const expires_at = parsed.data.expires_at || null;

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from('cna_verifications')
    .select('id')
    .eq('cna_id', applicant_id)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    status,
    expires_at,
    verified_at: status === 'verified' ? new Date().toISOString() : null,
  };
  const { error } = existing
    ? await svc.from('cna_verifications').update(row).eq('id', existing.id)
    : await svc.from('cna_verifications').insert({ cna_id: applicant_id, type, ...row });
  if (error) throw new Error(`Could not save verification: ${error.message}`);

  await svc.from('audit_log').insert({
    user_id: adminId,
    action: 'update',
    resource_type: 'cna_verification',
    resource_id: applicant_id,
    context: { type, status, expires_at },
  });
  revalidatePath(`/admin/applications/${applicant_id}`);
}

const HoursSchema = z.object({
  applicant_id: z.string().uuid(),
  experience_hours: z.coerce.number().int().min(0).max(200000),
});

export async function setExperienceHoursAction(formData: FormData) {
  const { adminId } = await requireAdmin();
  const parsed = HoursSchema.safeParse({
    applicant_id: formData.get('applicant_id')?.toString(),
    experience_hours: formData.get('experience_hours')?.toString(),
  });
  if (!parsed.success) throw new Error('Hours must be a whole number');
  const svc = createServiceClient();
  const { error } = await svc
    .from('cna_profiles')
    .update({ experience_hours: parsed.data.experience_hours })
    .eq('user_id', parsed.data.applicant_id);
  if (error) throw new Error(`Could not save hours: ${error.message}`);
  await svc.from('audit_log').insert({
    user_id: adminId,
    action: 'update',
    resource_type: 'cna_experience_hours',
    resource_id: parsed.data.applicant_id,
    context: { experience_hours: parsed.data.experience_hours },
  });
  revalidatePath(`/admin/applications/${parsed.data.applicant_id}`);
}

const CompSchema = z.object({
  user_id: z.string().uuid(),
  months: z.coerce.number().int().min(1).max(36),
  reason: z.string().trim().min(2).max(200),
});

/** Give someone a complimentary membership (e.g. pilot families, partners). */
export async function compMembershipAction(formData: FormData) {
  const { adminId } = await requireAdmin();
  const parsed = CompSchema.safeParse({
    user_id: formData.get('user_id')?.toString(),
    months: formData.get('months')?.toString(),
    reason: formData.get('reason')?.toString(),
  });
  if (!parsed.success) throw new Error('Pick a length and give a reason');

  const svc = createServiceClient();
  const { data: target } = await svc.from('users').select('role').eq('id', parsed.data.user_id).single();
  if (target?.role !== 'client' && target?.role !== 'cna') throw new Error('Only families and caregivers have memberships');

  const { data: current } = await svc
    .from('memberships')
    .select('status, stripe_subscription_id')
    .eq('user_id', parsed.data.user_id)
    .maybeSingle();
  if (current?.status === 'active' && current.stripe_subscription_id) {
    throw new Error('This person already has a paid membership. Manage it in Stripe.');
  }

  const end = new Date();
  end.setMonth(end.getMonth() + parsed.data.months);
  const { error } = await svc.from('memberships').upsert(
    {
      user_id: parsed.data.user_id,
      role: target.role,
      status: 'comped',
      plan_key: target.role === 'cna' ? 'caregiver_standard' : 'family_standard',
      current_period_end: end.toISOString(),
      comp_reason: parsed.data.reason,
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(`Could not comp membership: ${error.message}`);
  await svc.from('audit_log').insert({
    user_id: adminId,
    action: 'update',
    resource_type: 'membership',
    resource_id: parsed.data.user_id,
    context: { comped_months: parsed.data.months, reason: parsed.data.reason },
  });
  revalidatePath(`/admin/applications/${parsed.data.user_id}`);
}
