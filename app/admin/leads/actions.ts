'use server';

/**
 * Admin action to move a lead through new → contacted → archived.
 * Admin-gated; writes under the leads_admin_all RLS policy.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateLeadStatusAction(formData: FormData) {
  const id = formData.get('id')?.toString();
  const status = formData.get('status')?.toString();
  if (!id || !status || !['new', 'contacted', 'archived'].includes(status)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin' || me?.status !== 'active') return;

  // leads isn't in the generated types yet — cast until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('leads') as any).update({ status }).eq('id', id);
  revalidatePath('/admin/leads');
}
