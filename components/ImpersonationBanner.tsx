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
import { stopImpersonationAction } from '@/app/admin/actions';

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
    <div className="sticky top-0 z-50 bg-coral text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium whitespace-nowrap">Admin mode &middot;</span>
          <span className="truncate">
            Viewing as <strong>{target.full_name || target.email}</strong>{' '}
            <span className="opacity-80">({target.role})</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="rounded-md bg-white/20 px-3 py-1 hover:bg-white/30 text-xs"
          >
            Back to admin
          </Link>
          <form action={stopImpersonationAction}>
            <button
              type="submit"
              className="rounded-md bg-white text-coral px-3 py-1 hover:bg-stone-100 text-xs font-medium"
            >
              Stop viewing
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
