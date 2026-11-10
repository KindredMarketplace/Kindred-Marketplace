/**
 * <ImpersonationBanner /> — sticky banner shown across the app whenever an
 * admin is currently "viewing as" another user.
 *
 * Server component. Reads cookies + DB on every request to figure out
 * whether to render. Returns null when not impersonating.
 */

import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ImpersonationBanner() {
  const cookieStore = await cookies();
  const impersonatingRole = cookieStore.get('kindred_impersonating_role')?.value;
  const targetUserId = cookieStore.get('kindred_impersonating_target_user_id')?.value;

  if (!impersonatingRole || !targetUserId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Confirm the current user is actually an admin (defensive — middleware
  // already ignores this cookie for non-admins, but render-time check is cheap)
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin') return null;

  // Look up who we're viewing as
  const { data: target } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', targetUserId)
    .single();

  if (!target) return null;

  return (
    <div className="sticky top-0 z-[60] bg-coral text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <span className="truncate block">
            Viewing as <strong>{target.full_name || target.email}</strong>{' '}
            <span className="opacity-80">({target.role === 'cna' ? 'caregiver' : target.role === 'client' ? 'family' : target.role})</span>
          </span>
          <span className="text-[11px] opacity-85 block">Read-only: nothing you click here gets saved.</span>
        </div>
        <Link
          href="/admin"
          prefetch={false}
          className="shrink-0 rounded-full bg-white text-coral px-4 py-1.5 hover:bg-stone-100 text-xs font-semibold"
        >
          ← Back to admin
        </Link>
      </div>
    </div>
  );
}
