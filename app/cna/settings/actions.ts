'use server';

/** Save the caregiver's account basics: name and phone. */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AccountSaveState = { ok: boolean; message: string } | null;

export async function saveAccountAction(_prev: AccountSaveState, formData: FormData): Promise<AccountSaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Please log in again.' };

  const first = (formData.get('first_name')?.toString() ?? '').trim().slice(0, 60);
  const last = (formData.get('last_name')?.toString() ?? '').trim().slice(0, 60);
  const phone = (formData.get('phone')?.toString() ?? '').trim().slice(0, 30);
  if (!first) return { ok: false, message: 'Add your first name.' };
  if (phone && !/^[0-9+().\-\s]{7,30}$/.test(phone)) return { ok: false, message: 'That phone number doesn’t look right.' };

  const [{ error: uErr }, { error: pErr }] = await Promise.all([
    supabase.from('users').update({ full_name: `${first} ${last}`.trim(), phone: phone || null }).eq('id', user.id),
    supabase.from('cna_profiles').update({ display_name: first, last_name: last || null }).eq('user_id', user.id),
  ]);
  if (uErr || pErr) return { ok: false, message: 'That didn’t save. Please try again.' };

  revalidatePath('/cna', 'layout');
  return { ok: true, message: 'Saved.' };
}
