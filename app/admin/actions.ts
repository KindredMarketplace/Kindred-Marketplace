'use server';

/**
 * Server actions used by the admin panel.
 *
 * Admins only — every action re-checks the requester's role server-side
 * even though middleware also gates the route. Defense in depth.
 */

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const IMPERSONATION_COOKIE = 'kindred_impersonating_role';
const IMPERSONATION_TARGET_COOKIE = 'kindred_impersonating_target_user_id';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin' || profile.status !== 'active') {
    throw new Error('Not authorized');
  }
  return { supabase, user };
}

/**
 * Start impersonating a user. The admin will be routed to that role's
 * dashboard and treated as that role for routing purposes until they stop.
 *
 * NOTE: this does not change the auth identity — the database still sees
 * the admin's user id, just with RLS allowing reads everywhere. For now,
 * impersonation is read-only-ish: admins viewing-as a user can navigate
 * around but can't post jobs, send messages, etc. We'll wire write
 * restrictions on a per-action basis later.
 */
export async function startImpersonationAction(formData: FormData) {
  const target_user_id = formData.get('target_user_id')?.toString();
  const reason = formData.get('reason')?.toString() ?? null;

  if (!target_user_id) {
    throw new Error('Missing target user id');
  }

  const { supabase, user: admin } = await requireAdmin();

  // Look up the target user's role
  const { data: target, error: targetErr } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', target_user_id)
    .single();

  if (targetErr || !target) {
    throw new Error('Target user not found');
  }

  if (target.role !== 'client' && target.role !== 'cna' && target.role !== 'business') {
    throw new Error('Can only impersonate client, cna, or business roles');
  }

  // Log it (RLS allows admins to insert their own log rows)
  const hdrs = await headers();
  await supabase.from('admin_impersonation_log').insert({
    admin_user_id: admin.id,
    impersonated_user_id: target.id,
    impersonated_role: target.role,
    reason,
    user_agent: hdrs.get('user-agent') ?? null,
    // ip_address is hard to get reliably behind Vercel — skip for now
  });

  // Set cookies — session cookies (no max-age) so they auto-clear on browser close
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, target.role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  cookieStore.set(IMPERSONATION_TARGET_COOKIE, target.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  revalidatePath('/', 'layout');

  switch (target.role) {
    case 'cna':
      redirect('/cna/dashboard');
    case 'business':
      redirect('/business/dashboard');
    case 'client':
    default:
      redirect('/client/dashboard');
  }
}

/**
 * Stop impersonating — return to the admin panel.
 */
export async function stopImpersonationAction() {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
  cookieStore.delete(IMPERSONATION_TARGET_COOKIE);

  revalidatePath('/', 'layout');
  redirect('/admin');
}
