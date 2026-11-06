/**
 * PATCH /api/cna/availability
 *
 * Updates the logged-in CNA's availability_status field on cna_profiles.
 * Called by the AvailabilityToggle client component on the dashboard.
 *
 * Body: { status: 'available' | 'unavailable' }
 * Returns: { ok: true } or { error: string } with appropriate status code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BodySchema = z.object({
  status: z.enum(['available', 'fully_booked', 'on_break', 'inactive']),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'status must be "available" or "unavailable"' }, { status: 400 });
  }

  const { status } = parsed.data;

  const { error } = await supabase
    .from('cna_profiles')
    .update({ availability_status: status })
    .eq('user_id', user.id);

  if (error) {
    console.error('[PATCH /api/cna/availability]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
