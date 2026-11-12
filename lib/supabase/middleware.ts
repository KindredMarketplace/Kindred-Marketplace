/**
 * Middleware-level Supabase client + route protection.
 *
 * Runs on every request (except static files / images / favicon, see matcher
 * in /middleware.ts). Two jobs:
 *
 *   1. Refresh the user's session if the access token is near expiry
 *   2. Enforce role-based route access:
 *        - /client/*     → clients (and admins-impersonating-clients) only
 *        - /cna/*        → CNAs (and admins-impersonating-CNAs) only
 *        - /admin/*      → admins only
 *
 * Admin impersonation: when an admin starts "view as," we set the cookie
 * `kindred_impersonating_role` to one of `client | cna | business`. While
 * that cookie is set, the admin is treated as that role for routing purposes.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

// Routes that don't require auth
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/how-it-works',
  '/pricing',
  '/contact',
  '/terms',
  '/privacy',
  '/hipaa',
  '/careers',
  '/press',
  '/trust-safety',
  '/caregiver-resources',
  '/community',
  '/stories',
  '/faq',
  '/browse',
  '/find-care',
  '/apply',
  '/kindred-standard',
  '/offline',
  '/manifest.webmanifest',
  '/post-job',
  '/auth/callback',
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  // Sub-paths of public marketing routes
  if (pathname.startsWith('/caregiver/')) return true; // public caregiver profiles
  if (pathname.startsWith('/browse/')) return true; // a caregiver's profile from Browse
  if (pathname.startsWith('/api/health')) return true;
  if (pathname.startsWith('/api/stripe/webhook')) return true;
  return false;
}

type EffectiveRole = 'client' | 'cna' | 'business' | 'admin';

function pathnameRequiresRole(pathname: string): EffectiveRole | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/client')) return 'client';
  if (pathname.startsWith('/cna/')) return 'cna';
  if (pathname === '/cna') return 'cna';
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do NOT remove the getUser() call. It refreshes the session
  // and writes new auth cookies if the access token is close to expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes — let everyone through
  if (isPublicRoute(pathname)) {
    // If a logged-in user hits /login or /signup, send them to their dashboard.
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const role = await getEffectiveRole(supabase, user.id, request);
      if (role) {
        return NextResponse.redirect(new URL(roleHomePath(role), request.url));
      }
    }
    return supabaseResponse;
  }

  // Beyond this point: protected route. User must be logged in.
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check whether this route needs a specific role
  const requiredRole = pathnameRequiresRole(pathname);
  if (!requiredRole) return supabaseResponse;

  const viewingAs = !!request.cookies.get(VIEW_AS_TARGET)?.value;

  // Admins can always get back to /admin. Arriving there ends "View as".
  if (requiredRole === 'admin' && viewingAs && (await isRealAdmin(supabase, user.id))) {
    supabaseResponse.cookies.delete(VIEW_AS_ROLE);
    supabaseResponse.cookies.delete(VIEW_AS_TARGET);
    return supabaseResponse;
  }

  const effectiveRole = await getEffectiveRole(supabase, user.id, request);

  if (!effectiveRole) {
    // No user row yet — odd state, send to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // "View as" is read-only: refuse form posts / server actions from the
  // portals while an admin is viewing as someone, so nothing gets saved
  // under the admin's account inside another person's view.
  if (
    viewingAs &&
    request.method === 'POST' &&
    (requiredRole === 'client' || requiredRole === 'cna') &&
    effectiveRole === requiredRole &&
    (await isRealAdmin(supabase, user.id))
  ) {
    return new NextResponse('Viewing as someone is read-only. Go back to admin to make changes.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // Admin can access /admin/*; they need impersonation to access the role portals
  if (requiredRole === 'admin') {
    if (effectiveRole === 'admin') return supabaseResponse;
    return NextResponse.redirect(new URL(roleHomePath(effectiveRole), request.url));
  }

  // For /client/*, /cna/*, /business/* — match required role or impersonating it
  if (effectiveRole === requiredRole) return supabaseResponse;

  // Wrong portal — send them home
  return NextResponse.redirect(new URL(roleHomePath(effectiveRole), request.url));
}

const VIEW_AS_ROLE = 'kindred_impersonating_role';
const VIEW_AS_TARGET = 'kindred_impersonating_target_user_id';

async function isRealAdmin(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from('users').select('role, status').eq('id', userId).single();
  return data?.role === 'admin' && data?.status === 'active';
}

/**
 * Effective role = the user's real role, unless they're an admin currently
 * impersonating another role via the kindred_impersonating_role cookie.
 */
async function getEffectiveRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
  request: NextRequest
): Promise<EffectiveRole | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  const realRole = data?.role as EffectiveRole | undefined;
  if (!realRole) return null;

  // Only admins can impersonate. Anyone else's cookie is ignored.
  if (realRole === 'admin') {
    const impersonating = request.cookies.get('kindred_impersonating_role')?.value;
    if (impersonating === 'client' || impersonating === 'cna') {
      return impersonating;
    }
  }

  return realRole;
}

function roleHomePath(role: EffectiveRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'cna':
      return '/cna/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}
