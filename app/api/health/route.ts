/**
 * Health check endpoint. Used for uptime monitoring + smoke tests.
 *
 * Returns 200 + JSON if Supabase is reachable, 503 otherwise.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = createClient();

    // Cheapest possible query — confirms the connection works.
    // We don't query an actual table because RLS would return zero rows
    // (no auth context here) and we'd misread that as a DB failure.
    const { error } = await supabase.from('service_taxonomy').select('key').limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      uptime_ms: Date.now() - startedAt,
      service: 'kindred-marketplace',
      version: '0.1.0',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        uptime_ms: Date.now() - startedAt,
        message,
      },
      { status: 503 }
    );
  }
}
