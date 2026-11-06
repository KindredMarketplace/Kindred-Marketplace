/**
 * Business portal helpers — shared server-side utilities for resolving the
 * logged-in user's organization. Most /business/* pages start by asking
 * "which facility is this user part of?", so that lookup lives here once.
 */

import { createClient } from '@/lib/supabase/server';

export type BusinessContext = {
  userId: string;
  orgId: string | null;
  role: string | null;
};

/**
 * Resolve the logged-in user's organization membership. Returns the org id +
 * role, or nulls if the user isn't linked to an org yet. Assumes the caller
 * has already confirmed there's a session (the layout does this).
 */
export async function getBusinessContext(): Promise<BusinessContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    orgId: membership?.org_id ?? null,
    role: membership?.role ?? null,
  };
}

export const SHIFT_STATUS_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  open: {
    label: 'Open',
    dot: 'status-open',
    chip: 'bg-coral/15 text-coral border-coral/30',
  },
  assigned: {
    label: 'Confirmed',
    dot: 'status-filled',
    chip: 'bg-mist text-deepteal border-ink/15',
  },
  in_progress: {
    label: 'On shift',
    dot: 'status-filled',
    chip: 'bg-sage/15 text-deepteal border-sage/30',
  },
  completed: {
    label: 'Completed',
    dot: 'status-filled',
    chip: 'bg-sage/15 text-deepteal border-sage/30',
  },
  no_show: {
    label: 'No-show',
    dot: 'status-open',
    chip: 'bg-coral/15 text-coral border-coral/30',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'status-pending',
    chip: 'bg-creamdark text-ink/60 border-ink/15',
  },
};

/** "07:00:00" + "15:00:00" → "7 AM – 3 PM" */
export function formatShiftTime(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m === 0 ? `${h} ${ampm}` : `${h}:${mStr.padStart(2, '0')} ${ampm}`;
}
