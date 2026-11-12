'use server';

/**
 * Save the caregiver's public profile: headline, story, rate, service area,
 * care offered (cna_services), languages, and optional gender / age range. Everything Kindred verifies (hours, documents, stage) is
 * pinned by the database guard trigger, so it can't be changed from here.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SERVICE_LABEL, GENDERS, CAREGIVER_AGES, normalizeLanguage } from '@/lib/careOptions';

export type ProfileSaveState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const Schema = z.object({
  headline: z.string().trim().max(120, 'Keep the headline under 120 characters.'),
  bio: z.string().trim().max(800, 'Keep your story under 800 characters.'),
  rate: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d{1,3}(\.\d{1,2})?$/.test(v) && Number(v) >= 15 && Number(v) <= 150), 'Enter a rate between $15 and $150 an hour.'),
  languages: z.array(z.string().max(40)).max(30),
  languages_other: z.string().trim().max(200),
  services: z.array(z.string()).max(60),
  gender: z.string().refine((v) => v === '' || GENDERS.some((g) => g.value === v)),
  age_bracket: z.string().refine((v) => v === '' || CAREGIVER_AGES.some((a) => a.value === v)),
  service_zip: z.string().trim().refine((v) => v === '' || /^\d{5}$/.test(v), 'Use a 5-digit ZIP code.'),
  service_radius_miles: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= 100), 'Pick 1 to 100 miles.'),
});

export async function saveProfileAction(_prev: ProfileSaveState, formData: FormData): Promise<ProfileSaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Please log in again.' };

  const parsed = Schema.safeParse({
    headline: formData.get('headline')?.toString() ?? '',
    bio: formData.get('bio')?.toString() ?? '',
    rate: formData.get('rate')?.toString() ?? '',
    languages: formData.getAll('languages').map(String),
    languages_other: formData.get('languages_other')?.toString() ?? '',
    services: formData.getAll('services').map(String),
    gender: formData.get('gender')?.toString() ?? '',
    age_bracket: formData.get('age_bracket')?.toString() ?? '',
    service_zip: formData.get('service_zip')?.toString() ?? '',
    service_radius_miles: formData.get('service_radius_miles')?.toString() ?? '',
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { ok: false, message: 'A couple of things need a look.', errors };
  }
  const d = parsed.data;

  const languages = [
    ...new Set(
      [...d.languages, ...d.languages_other.split(',')]
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => normalizeLanguage(l).slice(0, 30))
    ),
  ].slice(0, 12);
  const services = [...new Set(d.services.filter((k) => k in SERVICE_LABEL))];

  const { error } = await supabase
    .from('cna_profiles')
    .update({
      headline: d.headline || null,
      bio: d.bio || null,
      hourly_rate_cents: d.rate === '' ? null : Math.round(Number(d.rate) * 100),
      languages,
      gender: d.gender || null,
      age_bracket: d.age_bracket || null,
      service_zip: d.service_zip || null,
      service_radius_miles: d.service_radius_miles === '' ? null : Number(d.service_radius_miles),
    })
    .eq('user_id', user.id);
  if (error) return { ok: false, message: 'That didn’t save. Please try again.' };

  // Care offered: replace the list with exactly what's ticked.
  const { data: had } = await supabase.from('cna_services').select('service_key').eq('cna_id', user.id);
  const before = new Set((had ?? []).map((r) => r.service_key));
  const remove = [...before].filter((k) => !services.includes(k));
  const add = services.filter((k) => !before.has(k));
  if (remove.length) {
    const { error: delErr } = await supabase.from('cna_services').delete().eq('cna_id', user.id).in('service_key', remove);
    if (delErr) return { ok: false, message: 'Your details saved, but the care list didn’t. Please try again.' };
  }
  if (add.length) {
    const { error: insErr } = await supabase.from('cna_services').insert(add.map((service_key) => ({ cna_id: user.id, service_key })));
    if (insErr) return { ok: false, message: 'Your details saved, but the care list didn’t. Please try again.' };
  }

  revalidatePath('/cna/profile');
  revalidatePath('/cna/dashboard');
  revalidatePath('/browse');
  return { ok: true, message: 'Saved. Families see the update right away.' };
}

/**
 * After the browser uploads a new photo to kindred-avatars/<uid>/..., record
 * it as the profile photo and clean up older photos in that folder.
 */
export async function setProfilePhotoAction(path: string): Promise<{ ok: boolean; url?: string; message?: string }> {
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

  const [{ error: pErr }, { error: uErr }] = await Promise.all([
    supabase.from('cna_profiles').update({ photo_url: url }).eq('user_id', user.id),
    supabase.from('users').update({ avatar_url: url }).eq('id', user.id),
  ]);
  if (pErr || uErr) return { ok: false, message: 'The photo uploaded but didn’t save. Please try again.' };

  const old = (files ?? []).map((f) => `${user.id}/${f.name}`).filter((p) => p !== path && /\/avatar-/.test(p));
  if (old.length) await bucket.remove(old);

  revalidatePath('/cna', 'layout');
  revalidatePath('/browse');
  return { ok: true, url };
}
