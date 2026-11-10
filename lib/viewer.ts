/**
 * getViewer — "who is this page for?"
 *
 * Normally that's the signed-in user. When an admin is using "View as"
 * (the kindred_impersonating_* cookies, set by startImpersonationAction), the
 * caregiver / family portal pages should show the PERSON BEING VIEWED, not
 * the admin's own (empty) account. So this returns the target's id + email in
 * place of the admin's, while `supabase` stays the admin's own client:
 * admins can read every row through RLS, and nothing runs with the
 * service-role key.
 *
 * Viewing is read-only: the middleware rejects form submissions / server
 * actions from the portals while the cookies are set, so an admin can't
 * accidentally post or message as themselves inside someone else's view.
 *
 * Use this in portal PAGES and LAYOUTS. Server actions keep using
 * supabase.auth.getUser() (they're blocked while viewing anyway).
 */

import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const VIEW_AS_ROLE_COOKIE = 'kindred_impersonating_role';
export const VIEW_AS_TARGET_COOKIE = 'kindred_impersonating_target_user_id';

export async function getViewer(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  viewingAs: { adminId: string; targetId: string } | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, viewingAs: null };

  const jar = await cookies();
  const targetId = jar.get(VIEW_AS_TARGET_COOKIE)?.value;
  if (!targetId || targetId === user.id) return { supabase, user, viewingAs: null };

  const { data: me } = await supabase.from('users').select('role, status').eq('id', user.id).single();
  if (me?.role !== 'admin' || me.status !== 'active') return { supabase, user, viewingAs: null };

  const { data: target } = await supabase.from('users').select('id, email').eq('id', targetId).maybeSingle();
  if (!target) return { supabase, user, viewingAs: null };

  return {
    supabase,
    user: { ...user, id: target.id, email: target.email } as User,
    viewingAs: { adminId: user.id, targetId: target.id },
  };
}
