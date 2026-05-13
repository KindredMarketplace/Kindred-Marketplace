/**
 * OAuth callback handler. Supabase Auth redirects here after a user completes
 * email-link signup, magic link login, or OAuth (Google etc.).
 *
 * We exchange the code in the URL for a session, set cookies, and redirect
 * the user to their dashboard based on their role.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` is an optional return path after successful login
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Look up the user's role to route them to the right dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        // Honor explicit `next` if provided; otherwise role-based default
        if (next && next !== '/') {
          return NextResponse.redirect(`${origin}${next}`);
        }
        switch (profile?.role) {
          case 'cna':
            return NextResponse.redirect(`${origin}/cna/dashboard`);
          case 'business':
            return NextResponse.redirect(`${origin}/business/dashboard`);
          case 'admin':
            return NextResponse.redirect(`${origin}/admin`);
          case 'client':
          default:
            return NextResponse.redirect(`${origin}/client/dashboard`);
        }
      }
    }
  }

  // Fallback — auth failed, return to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
