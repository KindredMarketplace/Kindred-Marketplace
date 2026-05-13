/**
 * Middleware-level Supabase client.
 *
 * Wired in /middleware.ts at the project root. Runs on every request to:
 *   1. Refresh the user's session if expired
 *   2. Set updated auth cookies on the response
 *
 * This is what lets server components consistently see a logged-in user.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // IMPORTANT: do NOT remove the getUser() call. It refreshes the session
  // and writes new auth cookies if the access token is close to expiry.
  await supabase.auth.getUser();

  return supabaseResponse;
}
