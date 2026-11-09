'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Record that the caregiver has seen the one-time acceptance welcome. */
export async function dismissWelcomeAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('cna_profiles')
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('welcome_seen_at', null);
  revalidatePath('/cna', 'layout');
}
