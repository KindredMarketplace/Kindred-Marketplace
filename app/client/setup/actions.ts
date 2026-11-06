'use server';

import type { TablesInsert, TablesUpdate } from '@/types/database.types';

/**
 * Server actions for the client care-setup flow + profile editing.
 *
 * Both the multi-step setup form (/client/setup) and the care profile editor
 * (/client/profile) write through saveCareProfileAction. It upserts two rows:
 *   - client_profiles  (the family member: name, ZIP, relationship)
 *   - care_recipients  (the cared-for person + their care needs)
 *
 * Everything is optional/skippable — we only write the fields that were filled.
 * A real write, not a mock.
 */

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SaveSchema = z.object({
  relationship: z.string().max(60).optional(),
  client_zip: z.string().max(10).optional(),
  recipient_name: z.string().max(120).optional(),
  recipient_dob: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  care_types: z.array(z.string()).optional(),
  care_frequency: z.enum(['one_time', 'recurring', 'live_in', 'on_call']).optional(),
  hours_per_week: z.coerce.number().int().positive().max(168).optional(),
  budget_min_cents: z.coerce.number().int().nonnegative().optional(),
  budget_max_cents: z.coerce.number().int().nonnegative().optional(),
  priorities: z.array(z.string()).optional(),
  preferences: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  care_types_other: z.string().max(500).optional(),
  schedule_detail: z.string().max(1000).optional(),
  payer_type: z.enum(['self_pay', 'ltc_insurance', 'medicaid', 'medicare_advantage', 'va', 'workers_comp']).optional(),
  insurance_detail: z.string().max(500).optional(),
  mobility_level: z.string().max(60).optional(),
  living_situation: z.string().max(60).optional(),
  bio: z.string().max(2000).optional(),
  fav_foods: z.array(z.string()).optional(),
  fav_movies: z.array(z.string()).optional(),
  fav_shows: z.array(z.string()).optional(),
  fav_music: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  personal_other: z.array(z.string()).optional(),
  mark_complete: z.coerce.boolean().optional(),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveCareProfileAction(formData: FormData): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You need to be signed in.' };

  const minDollars = formData.get('budget_min')?.toString();
  const maxDollars = formData.get('budget_max')?.toString();
  const budget_min_cents = minDollars ? Math.round(parseFloat(minDollars) * 100) : undefined;
  const budget_max_cents = maxDollars ? Math.round(parseFloat(maxDollars) * 100) : undefined;

  const raw = {
    relationship: formData.get('relationship')?.toString() || undefined,
    client_zip: formData.get('client_zip')?.toString() || undefined,
    recipient_name: formData.get('recipient_name')?.toString() || undefined,
    recipient_dob: formData.get('recipient_dob')?.toString() || undefined,
    conditions: formData.getAll('conditions').map((s) => s.toString()).filter(Boolean),
    allergies: formData.getAll('allergies').map((s) => s.toString()).filter(Boolean),
    care_types: formData.getAll('care_types').map((s) => s.toString()).filter(Boolean),
    care_frequency: (formData.get('care_frequency')?.toString() || undefined) as
      | 'one_time' | 'recurring' | 'live_in' | 'on_call' | undefined,
    hours_per_week: formData.get('hours_per_week')?.toString() || undefined,
    budget_min_cents,
    budget_max_cents,
    priorities: formData.getAll('priorities').map((s) => s.toString()).filter(Boolean),
    preferences: formData.get('preferences')?.toString() || undefined,
    notes: formData.get('notes')?.toString() || undefined,
    care_types_other: formData.get('care_types_other')?.toString() || undefined,
    schedule_detail: formData.get('schedule_detail')?.toString() || undefined,
    payer_type: (formData.get('payer_type')?.toString() || undefined) as
      | 'self_pay' | 'ltc_insurance' | 'medicaid' | 'medicare_advantage' | 'va' | 'workers_comp' | undefined,
    insurance_detail: formData.get('insurance_detail')?.toString() || undefined,
    mobility_level: formData.get('mobility_level')?.toString() || undefined,
    living_situation: formData.get('living_situation')?.toString() || undefined,
    bio: formData.get('bio')?.toString() || undefined,
    fav_foods: formData.getAll('fav_foods').map((s) => s.toString()).filter(Boolean),
    fav_movies: formData.getAll('fav_movies').map((s) => s.toString()).filter(Boolean),
    fav_shows: formData.getAll('fav_shows').map((s) => s.toString()).filter(Boolean),
    fav_music: formData.getAll('fav_music').map((s) => s.toString()).filter(Boolean),
    hobbies: formData.getAll('hobbies').map((s) => s.toString()).filter(Boolean),
    personal_other: formData.getAll('personal_other').map((s) => s.toString()).filter(Boolean),
    mark_complete: formData.get('mark_complete')?.toString() || undefined,
  };

  const parsed = SaveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Some of that didn\u2019t look right. Please review and try again.' };
  }
  const d = parsed.data;

  if (d.budget_min_cents != null && d.budget_max_cents != null && d.budget_max_cents < d.budget_min_cents) {
    return { ok: false, error: 'Maximum budget must be at least the minimum.' };
  }

  // ---- 1. Upsert client_profiles -----------------------------------------
  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('user_id, name, zip')
    .eq('user_id', user.id)
    .maybeSingle();

  let defaultName = existingProfile?.name;
  if (!defaultName) {
    const { data: userRow } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    defaultName =
      (userRow?.full_name && userRow.full_name.trim()) || userRow?.email?.split('@')[0] || 'Client';
  }

  const profilePayload: Record<string, unknown> = {
    user_id: user.id,
    name: defaultName,
    zip: d.client_zip || existingProfile?.zip || '00000',
  };
  if (d.relationship) profilePayload.relationship_to_recipient = d.relationship;
  if (d.mark_complete) profilePayload.setup_completed_at = new Date().toISOString();

  const { error: profileError } = await supabase
    .from('client_profiles')
    .upsert(profilePayload as TablesInsert<'client_profiles'>, { onConflict: 'user_id' });
  if (profileError) {
    return { ok: false, error: `Couldn\u2019t save your details: ${profileError.message}` };
  }

  // ---- 2. Upsert care_recipients -----------------------------------------
  const { data: existingRecipient } = await supabase
    .from('care_recipients')
    .select('id')
    .eq('client_id', user.id)
    .limit(1)
    .maybeSingle();

  const recipientFields: Record<string, unknown> = {};
  if (d.recipient_name) recipientFields.name = d.recipient_name;
  if (d.recipient_dob) recipientFields.date_of_birth = d.recipient_dob;
  if (d.conditions && d.conditions.length) recipientFields.conditions = d.conditions;
  if (d.allergies && d.allergies.length) recipientFields.allergies = d.allergies;
  if (d.care_types && d.care_types.length) recipientFields.care_types = d.care_types;
  if (d.care_frequency) recipientFields.care_frequency = d.care_frequency;
  if (d.hours_per_week != null) recipientFields.hours_per_week = d.hours_per_week;
  if (d.budget_min_cents != null) recipientFields.budget_min_cents = d.budget_min_cents;
  if (d.budget_max_cents != null) recipientFields.budget_max_cents = d.budget_max_cents;
  if (d.priorities && d.priorities.length) recipientFields.priorities = d.priorities;
  if (d.preferences) recipientFields.preferences = d.preferences;
  if (d.notes) recipientFields.notes = d.notes;
  if (d.care_types_other) recipientFields.care_types_other = d.care_types_other;
  if (d.schedule_detail) recipientFields.schedule_detail = d.schedule_detail;
  if (d.payer_type) recipientFields.payer_type = d.payer_type;
  if (d.insurance_detail) recipientFields.insurance_detail = d.insurance_detail;
  if (d.mobility_level) recipientFields.mobility_level = d.mobility_level;
  if (d.living_situation) recipientFields.living_situation = d.living_situation;
  if (d.bio) recipientFields.bio = d.bio;
  if (d.fav_foods && d.fav_foods.length) recipientFields.fav_foods = d.fav_foods;
  if (d.fav_movies && d.fav_movies.length) recipientFields.fav_movies = d.fav_movies;
  if (d.fav_shows && d.fav_shows.length) recipientFields.fav_shows = d.fav_shows;
  if (d.fav_music && d.fav_music.length) recipientFields.fav_music = d.fav_music;
  if (d.hobbies && d.hobbies.length) recipientFields.hobbies = d.hobbies;
  if (d.personal_other && d.personal_other.length) recipientFields.personal_other = d.personal_other;

  const hasRecipientData = Object.keys(recipientFields).length > 0;

  if (existingRecipient) {
    if (hasRecipientData) {
      const { error } = await supabase
        .from('care_recipients')
        .update(recipientFields as TablesUpdate<'care_recipients'>)
        .eq('id', existingRecipient.id);
      if (error) return { ok: false, error: `Couldn\u2019t save care details: ${error.message}` };
    }
  } else if (hasRecipientData) {
    const { error } = await supabase.from('care_recipients').insert({
      client_id: user.id,
      name: d.recipient_name || 'Care recipient',
      ...recipientFields,
    });
    if (error) return { ok: false, error: `Couldn\u2019t save care details: ${error.message}` };
  }

  revalidatePath('/client/profile');
  revalidatePath('/client/my-care');
  revalidatePath('/client/dashboard');

  // ---- 3. Grow the shared tag bank ---------------------------------------
  // Record any tags the user entered so they become autocomplete suggestions
  // for the next person. New words land as 'pending' (flaggable); existing
  // ones get a usage bump. Best-effort — never blocks the save.
  await recordTags({
    food: d.fav_foods,
    movie: d.fav_movies,
    show: d.fav_shows,
    music: d.fav_music,
    hobby: d.hobbies,
  });

  return { ok: true };
}

/**
 * Upserts user-entered tags into the shared tag_bank. New labels are inserted
 * as status='pending'; existing labels get usage_count incremented. Uses the
 * service client because RLS lets regular users INSERT but not UPDATE the bank.
 * Wrapped so a failure here never breaks the profile save.
 */
async function recordTags(byCategory: Record<string, string[] | undefined>) {
  try {
    const admin = createServiceClient();
    for (const [category, labels] of Object.entries(byCategory)) {
      if (!labels || !labels.length) continue;
      for (const rawLabel of labels) {
        const label = rawLabel.trim();
        if (!label || label.length > 80) continue;
        const label_norm = label.toLowerCase();

        const { data: existing } = await admin
          .from('tag_bank')
          .select('id, usage_count')
          .eq('category', category)
          .eq('label_norm', label_norm)
          .maybeSingle();

        if (existing) {
          await admin
            .from('tag_bank')
            .update({ usage_count: (existing.usage_count ?? 1) + 1 })
            .eq('id', existing.id);
        } else {
          await admin.from('tag_bank').insert({
            category,
            label,
            label_norm,
            status: 'pending', // community-submitted, awaiting light review
          });
        }
      }
    }
  } catch (err) {
    console.error('[recordTags] non-fatal:', err);
  }
}

/**
 * Marks the client's setup as skipped without saving form data.
 * Used by "skip for now" on the setup flow.
 */
export async function skipSetupAction(): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You need to be signed in.' };

  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('user_id, name, zip')
    .eq('user_id', user.id)
    .maybeSingle();

  let name = existingProfile?.name;
  if (!name) {
    const { data: userRow } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    name = (userRow?.full_name && userRow.full_name.trim()) || userRow?.email?.split('@')[0] || 'Client';
  }

  const { error } = await supabase.from('client_profiles').upsert(
    {
      user_id: user.id,
      name,
      zip: existingProfile?.zip || '00000',
      setup_skipped: true,
    },
    { onConflict: 'user_id' }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/client/dashboard');
  return { ok: true };
}
