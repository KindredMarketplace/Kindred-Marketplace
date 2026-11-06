import 'server-only';

/**
 * Server-side membership reads. All gating decisions are made in Postgres
 * (RLS + security-definer functions); this file just fetches what the UI needs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { AccessPlan, AccessSnapshot } from './membership-shared';

type Client = SupabaseClient<Database>;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return key.startsWith('sk_') && !key.includes('PASTE');
}

export async function getMyAccess(supabase: Client): Promise<AccessSnapshot | null> {
  const { data, error } = await supabase.rpc('my_access');
  if (error || !data || data.length === 0) return null;
  return data[0] as AccessSnapshot;
}

export async function getPlanForRole(supabase: Client, role: 'client' | 'cna'): Promise<AccessPlan | null> {
  const { data } = await supabase
    .from('access_plans')
    .select('key, role, label, startup_fee_cents, monthly_cents')
    .eq('role', role)
    .eq('active', true)
    .order('sort')
    .limit(1)
    .maybeSingle();
  return (data as AccessPlan | null) ?? null;
}

export async function getAllPlans(supabase: Client): Promise<AccessPlan[]> {
  const { data } = await supabase
    .from('access_plans')
    .select('key, role, label, startup_fee_cents, monthly_cents')
    .eq('active', true)
    .order('sort');
  return (data as AccessPlan[] | null) ?? [];
}

export async function getFoundingSlotsLeft(supabase: Client): Promise<number | null> {
  // Public settings + the caller can't count other people's memberships, so
  // for logged-out pages we only show the cap, not the live count.
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'founding_caregiver_cap')
    .maybeSingle();
  const cap = data?.value != null ? Number(data.value) : null;
  return Number.isFinite(cap) ? cap : null;
}
