/**
 * Browser-side Supabase client.
 *
 * Use this in:
 *   - 'use client' components
 *   - Client-side event handlers
 *
 * Do NOT use this in:
 *   - Server components (use ./server.ts)
 *   - Route handlers (use ./server.ts)
 *   - Server actions (use ./server.ts)
 *
 * This client respects Row Level Security — all queries run as the
 * currently-authenticated user.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
