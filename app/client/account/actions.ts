'use server';

/** Family account basics: name, phone and account photo. */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AccountSaveState } from '@/app/cna/settings/actions';

export async function saveFamilyAccountAction(_prev: AccountSaveState, formData: FormData): Promise<AccountSaveState> {
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
  const full = `${first} ${last}`.trim();

  const { error: uErr } = await supabase.from('users').update({ full_name: full, phone: phone || null }).eq('id', user.id);
  if (uErr) return { ok: false, message: 'That didn’t save. Please try again.' };
  // Keep the family profile in step if there is one (there may not be yet).
  await supabase.from('client_profiles').update({ name: full, primary_contact_phone: phone || null }).eq('user_id', user.id);

  revalidatePath('/client', 'layout');
  return { ok: true, message: 'Saved.' };
}

/** After the browser uploads to kindred-avatars/<uid>/..., make it the account photo. */
export async function setFamilyPhotoAction(path: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Please log in again.' };
  if (!new RegExp(`^${user.id}/avatar-\\d{10,16}\\.(jpg|jpeg|png|webp)$`).test(path)) {
    return { ok: false, message: 'That upload didn’t look right. Please try again.' };
  }
  const bucket = supabase.storage.from('kindred-avatars');
  const { data: files } = await bucket.list(user.id, { limit: 100 });
  if (!(files ?? []).some((f) => `${user.id}/${f.name}` === path)) {
    return { ok: false, message: 'We couldn’t find that photo. Please try again.' };
  }
  const url = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
  if (error) return { ok: false, message: 'The photo uploaded but didn’t save. Please try again.' };

  const old = (files ?? []).map((f) => `${user.id}/${f.name}`).filter((p) => p !== path && /\/avatar-/.test(p));
  if (old.length) await bucket.remove(old);
  revalidatePath('/client', 'layout');
  return { ok: true, url };
}
