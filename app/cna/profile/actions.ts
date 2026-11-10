'use server';

/**
 * Save the caregiver's public profile: headline, story, rate, languages,
 * service area. Everything Kindred verifies (hours, documents, stage) is
 * pinned by the database guard trigger, so it can't be changed from here.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type ProfileSaveState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const Schema = z.object({
  headline: z.string().trim().max(120, 'Keep the headline under 120 characters.'),
  bio: z.string().trim().max(800, 'Keep your story under 800 characters.'),
  rate: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d{1,3}(\.\d{1,2})?$/.test(v) && Number(v) >= 15 && Number(v) <= 150), 'Enter a rate between $15 and $150 an hour.'),
  languages: z.string().trim().max(200),
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
    languages: formData.get('languages')?.toString() ?? '',
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
      d.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.slice(0, 30))
    ),
  ].slice(0, 8);

  const { error } = await supabase
    .from('cna_profiles')
    .update({
      headline: d.headline || null,
      bio: d.bio || null,
      hourly_rate_cents: d.rate === '' ? null : Math.round(Number(d.rate) * 100),
      languages,
      service_zip: d.service_zip || null,
      service_radius_miles: d.service_radius_miles === '' ? null : Number(d.service_radius_miles),
    })
    .eq('user_id', user.id);
  if (error) return { ok: false, message: 'That didn’t save. Please try again.' };

  revalidatePath('/cna/profile');
  revalidatePath('/cna/dashboard');
  revalidatePath('/browse');
  return { ok: true, message: 'Saved. Families see the update right away.' };
}
