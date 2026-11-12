'use server';

/**
 * Families saving caregivers (♡). Works before membership too: the database
 * function maps the id the family was shown to the real caregiver, so a
 * locked preview never learns who it is.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleSaveCaregiverAction(shownId: string): Promise<{ ok: boolean; saved: boolean; message?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(shownId)) return { ok: false, saved: false, message: 'That link looks wrong.' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, saved: false, message: 'Log in to save caregivers.' };

  const { data, error } = await supabase.rpc('toggle_saved_caregiver', { shown: shownId });
  if (error) {
    const msg = /care details/i.test(error.message)
      ? 'Finish your care details first, then you can save caregivers.'
      : /family accounts/i.test(error.message)
        ? 'Only family accounts can save caregivers.'
        : 'Couldn’t save. Try again.';
    return { ok: false, saved: false, message: msg };
  }
  revalidatePath('/client/browse');
  return { ok: true, saved: data === true };
}
