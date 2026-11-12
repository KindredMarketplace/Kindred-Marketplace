'use server';

/**
 * Server action for posting a job (family → marketplace).
 *
 * Inserts a row into public.jobs for the logged-in client. Validated with Zod.
 * On success, redirects to the dashboard (where the new post will appear once
 * the jobs feed UI is wired). Real write — this is not a mock.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PostJobSchema = z.object({
  title: z.string().min(1, 'Please add a short job title.').max(200),
  description: z.string().min(1, 'Please describe the care needed.'),
  schedule_type: z.enum(['one_time', 'recurring', 'live_in', 'on_call']).default('recurring'),
  hours_per_week: z.coerce.number().int().positive().max(168).optional(),
  budget_min_cents: z.coerce.number().int().nonnegative().optional(),
  budget_max_cents: z.coerce.number().int().nonnegative().optional(),
  services_needed: z.array(z.string()).default([]),
  zip: z.string().min(3, 'A ZIP is required so caregivers nearby can see this.').max(10),
  care_recipient_id: z.string().uuid().optional().or(z.literal('')),
  days: z.array(z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])).default([]),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
});

export type PostJobResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function postJobAction(formData: FormData): Promise<PostJobResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You need to be signed in to post a job.' };

  // Dollars → cents for budget fields.
  const minDollars = formData.get('budget_min')?.toString();
  const maxDollars = formData.get('budget_max')?.toString();
  const budget_min_cents = minDollars ? Math.round(parseFloat(minDollars) * 100) : undefined;
  const budget_max_cents = maxDollars ? Math.round(parseFloat(maxDollars) * 100) : undefined;

  const raw = {
    title: formData.get('title')?.toString() ?? '',
    description: formData.get('description')?.toString() ?? '',
    schedule_type: (formData.get('schedule_type')?.toString() || 'recurring') as
      | 'one_time'
      | 'recurring'
      | 'live_in'
      | 'on_call',
    hours_per_week: formData.get('hours_per_week')?.toString() || undefined,
    budget_min_cents,
    budget_max_cents,
    services_needed: formData.getAll('services_needed').map((s) => s.toString()),
    zip: formData.get('zip')?.toString() ?? '',
    care_recipient_id: formData.get('care_recipient_id')?.toString() ?? '',
    days: [...new Set(formData.getAll('days').map((s) => s.toString()))] as ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[],
    start_time: formData.get('start_time')?.toString() ?? '',
    end_time: formData.get('end_time')?.toString() ?? '',
  };

  const parsed = PostJobSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please fix the errors below.', fieldErrors };
  }

  const d = parsed.data;
  if (
    d.budget_min_cents != null &&
    d.budget_max_cents != null &&
    d.budget_max_cents < d.budget_min_cents
  ) {
    return { ok: false, error: 'Maximum budget must be at least the minimum.' };
  }
  if (!!d.start_time !== !!d.end_time) {
    return { ok: false, error: 'Add both a start and an end time, or leave both empty.', fieldErrors: { start_time: 'Add both times.' } };
  }

  // Ensure this user has a client_profiles row. `jobs.client_id` FKs to
  // client_profiles(user_id), so without this an FK error fires on insert.
  // We only insert; never overwrite an existing profile.
  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    // Pull a default name from public.users (full_name) — falls back to email.
    const { data: userRow } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    const defaultName =
      (userRow?.full_name && userRow.full_name.trim()) ||
      userRow?.email?.split('@')[0] ||
      'Client';

    const { error: profileError } = await supabase.from('client_profiles').insert({
      user_id: user.id,
      name: defaultName,
      zip: d.zip,
    });
    if (profileError) {
      return {
        ok: false,
        error:
          'We couldn\u2019t finish setting up your account before posting. Please try again or contact support. ' +
          `(${profileError.message})`,
      };
    }
  }

  const { error } = await supabase.from('jobs').insert({
    client_id: user.id,
    care_recipient_id: d.care_recipient_id || null,
    title: d.title,
    description: d.description,
    schedule_type: d.schedule_type,
    hours_per_week: d.hours_per_week ?? null,
    budget_min_cents: d.budget_min_cents ?? null,
    budget_max_cents: d.budget_max_cents ?? null,
    services_needed: d.services_needed,
    days: d.days,
    start_time: d.start_time || null,
    end_time: d.end_time || null,
    zip: d.zip,
    status: 'open',
    posted_at: new Date().toISOString(),
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      return { ok: false, error: 'Posting a job is part of membership. Join from the Membership page, then post.' };
    }
    return { ok: false, error: 'That didn’t post. Please try again.' };
  }

  revalidatePath('/client/dashboard');
  redirect('/client/dashboard?posted=1');
}
