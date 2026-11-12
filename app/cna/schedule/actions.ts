'use server';

/**
 * Save a caregiver's recurring availability: one cna_availability row per
 * day + part of day they ticked. Replaces what was there.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DAY_TO_DOW, SLOTS } from '@/lib/careOptions';

export type AvailabilityState = { ok: boolean; message: string } | null;

const SLOT_TIMES = Object.fromEntries(SLOTS.map((s) => [s.value, [s.start, s.end]]));

export async function saveAvailabilityAction(_prev: AvailabilityState, formData: FormData): Promise<AvailabilityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Please log in again.' };

  const rows = [
    ...new Set(
      formData
        .getAll('slots')
        .map(String)
        .filter((t) => {
          const [d, s] = t.split(':');
          return d in DAY_TO_DOW && s in SLOT_TIMES;
        })
    ),
  ].map((t) => {
    const [d, s] = t.split(':');
    return {
      cna_id: user.id,
      day_of_week: DAY_TO_DOW[d] as 'monday',
      start_time: SLOT_TIMES[s][0],
      end_time: SLOT_TIMES[s][1],
      is_active: true,
    };
  });

  const { error: delErr } = await supabase.from('cna_availability').delete().eq('cna_id', user.id);
  if (delErr) return { ok: false, message: 'That didn’t save. Please try again.' };
  if (rows.length) {
    const { error } = await supabase.from('cna_availability').insert(rows);
    if (error) return { ok: false, message: 'That didn’t save. Please try again.' };
  }

  revalidatePath('/cna/schedule');
  revalidatePath('/browse');
  return { ok: true, message: rows.length ? 'Saved. Families can now find you by these times.' : 'Saved. You’re showing no regular times.' };
}
