import 'server-only';

/**
 * The Kindred Standard, item by item, for one caregiver: the single source
 * the dashboard, Credentials, profile badges and insurance card all read, so
 * they can never disagree with what an admin verified.
 *
 *   interview  passed when application_status is 'verifying' or 'approved'
 *   hours      confirmed by Kindred (cna_profiles.experience_hours) >= minimum
 *   l2bg / identity / insurance   from cna_verifications (latest row wins;
 *              'verified' counts only while not expired)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type DocState = 'verified' | 'pending' | 'rejected' | 'expired' | 'none';

export type StandardStatus = {
  stage: string | null;
  accepted: boolean;
  interview: boolean;
  hours: { confirmed: number | null; reported: number | null; min: number; met: boolean };
  l2bg: { state: DocState; expiresAt: string | null };
  identity: { state: DocState; expiresAt: string | null };
  insurance: { state: DocState; expiresAt: string | null };
  allMet: boolean;
};

export async function getStandardStatus(
  supabase: SupabaseClient<Database>,
  cnaId: string
): Promise<StandardStatus> {
  const [{ data: profile }, { data: verifs }, { data: setting }] = await Promise.all([
    supabase
      .from('cna_profiles')
      .select('application_status, experience_hours, experience_hours_reported')
      .eq('user_id', cnaId)
      .maybeSingle(),
    supabase
      .from('cna_verifications')
      .select('type, status, expires_at, created_at')
      .eq('cna_id', cnaId)
      .order('created_at', { ascending: false }),
    supabase.from('platform_settings').select('value').eq('key', 'kindred_standard_min_hours').maybeSingle(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const min = setting?.value != null ? Number(setting.value) : 1500;

  const doc = (type: 'l2bg' | 'identity' | 'insurance') => {
    const rows = (verifs ?? []).filter((v) => v.type === type);
    const live = rows.find((v) => v.status === 'verified' && (!v.expires_at || v.expires_at >= today));
    if (live) return { state: 'verified' as DocState, expiresAt: live.expires_at };
    const latest = rows[0];
    if (!latest) return { state: 'none' as DocState, expiresAt: null };
    if (latest.status === 'verified') return { state: 'expired' as DocState, expiresAt: latest.expires_at };
    return { state: latest.status as DocState, expiresAt: latest.expires_at };
  };

  const stage = profile?.application_status ?? null;
  const accepted = stage === 'verifying' || stage === 'approved';
  const confirmed = profile?.experience_hours ?? null;
  const hours = { confirmed, reported: profile?.experience_hours_reported ?? null, min, met: (confirmed ?? 0) >= min };
  const l2bg = doc('l2bg');
  const identity = doc('identity');
  const insurance = doc('insurance');

  return {
    stage,
    accepted,
    interview: accepted,
    hours,
    l2bg,
    identity,
    insurance,
    allMet: accepted && hours.met && [l2bg, identity, insurance].every((d) => d.state === 'verified'),
  };
}

export const DOC_STATE_LABEL: Record<DocState, string> = {
  verified: '✓ Verified',
  pending: 'In review',
  rejected: 'Needs a new copy',
  expired: 'Expired',
  none: 'Not uploaded',
};

export function formatExpiry(d: string | null): string | null {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
