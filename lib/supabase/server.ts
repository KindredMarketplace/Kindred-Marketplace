/**
 * Server-side Supabase client. Reads the session from cookies.
 *
 * Use this in:
 *   - Server components
 *   - Route handlers (app/api/.../route.ts)
 *   - Server actions
 *
 * Like the browser client, this respects Row Level Security. For privileged
 * operations that need to bypass RLS (rare — Stripe webhooks, admin scripts),
 * use createServiceClient() below.
 *
 * NOTE: createClient() is async in Next.js 15+, because cookies() is async.
 * Always `await createClient()` at the call site.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — set() throws. Safe to ignore
            // when paired with middleware that refreshes sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same caveat as set() above.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Use sparingly. Never expose to the
 * browser. Typical uses:
 *   - Stripe webhooks (writing payment records after authenticating webhook signature)
 *   - Admin scripts run by Kindred staff
 *   - Backfill / migration code
 *
 * Even in server code, prefer the regular createClient() when the operation
 * is being performed on behalf of a real user; RLS gives us defense in depth.
 */
export function createServiceClient() {
  return createPlainClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
