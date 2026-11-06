'use server';

/**
 * Server action for posting business shifts (facility → marketplace).
 *
 * Bulk mode: given a template's shift parameters + a date range + selected days
 * of week + caregivers-per-shift, expands into one business_shifts row per
 * (matching date × caregiver slot) and inserts them all. Real write.
 *
 * On success, redirects to the dashboard where the new shifts appear on the
 * board. Validated with Zod.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { z } from 'zod';

const PostShiftsSchema = z.object({
  name: z.string().max(120).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time is required.'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time is required.'),
  bill_rate_cents: z.coerce.number().int().positive('Set a bill rate.'),
  pay_rate_cents: z.coerce.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date.'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick an end date.'),
  days: z.array(z.coerce.number().int().min(0).max(6)).min(1, 'Pick at least one day of the week.'),
  caregivers_per_shift: z.coerce.number().int().min(1).max(20).default(1),
  requires_dementia_cert: z.coerce.boolean().default(false),
  requires_cpr: z.coerce.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export type PostShiftsResult =
  | { ok: true; count: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function postShiftsAction(formData: FormData): Promise<PostShiftsResult> {
  const ctx = await getBusinessContext();
  if (!ctx) return { ok: false, error: 'You need to be signed in.' };
  if (!ctx.orgId) return { ok: false, error: 'Finish setting up your facility before posting shifts.' };

  // Dollars → cents.
  const billDollars = formData.get('bill_rate')?.toString();
  const payDollars = formData.get('pay_rate')?.toString();

  const raw = {
    name: formData.get('name')?.toString() || undefined,
    start_time: formData.get('start_time')?.toString() ?? '',
    end_time: formData.get('end_time')?.toString() ?? '',
    bill_rate_cents: billDollars ? Math.round(parseFloat(billDollars) * 100) : 0,
    pay_rate_cents: payDollars ? Math.round(parseFloat(payDollars) * 100) : 0,
    start_date: formData.get('start_date')?.toString() ?? '',
    end_date: formData.get('end_date')?.toString() ?? '',
    days: formData.getAll('days').map((d) => Number(d)),
    caregivers_per_shift: formData.get('caregivers_per_shift')?.toString() || '1',
    requires_dementia_cert: formData.get('requires_dementia_cert') === 'on',
    requires_cpr: formData.get('requires_cpr') === 'on',
    notes: formData.get('notes')?.toString() || undefined,
  };

  const parsed = PostShiftsSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please fix the errors below.', fieldErrors };
  }

  const d = parsed.data;
  const start = new Date(d.start_date + 'T00:00:00');
  const end = new Date(d.end_date + 'T00:00:00');
  if (end < start) return { ok: false, error: 'End date must be on or after the start date.' };

  // Expand the date range → matching weekdays → caregiver slots.
  const services = d.requires_dementia_cert ? ['dementia_care'] : [];
  const rows: Array<Record<string, unknown>> = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 400) {
    if (d.days.includes(cursor.getDay())) {
      for (let slot = 0; slot < d.caregivers_per_shift; slot++) {
        rows.push({
          org_id: ctx.orgId,
          posted_by_user_id: ctx.userId,
          shift_date: cursor.toISOString().slice(0, 10),
          start_time: d.start_time + ':00',
          end_time: d.end_time + ':00',
          services_required: services,
          pay_rate_cents: d.pay_rate_cents,
          bill_rate_cents: d.bill_rate_cents,
          status: 'open',
          requires_dementia_cert: d.requires_dementia_cert,
          requires_cpr: d.requires_cpr,
          notes: d.notes ?? null,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  if (rows.length === 0) {
    return { ok: false, error: 'No shifts matched — check your date range and selected days.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('business_shifts').insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/business/dashboard');
  revalidatePath('/business/schedule');
  redirect('/business/dashboard?posted=' + rows.length);
}
