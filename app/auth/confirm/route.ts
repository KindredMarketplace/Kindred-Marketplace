/**
 * /auth/confirm — where emailed links land (password reset now; email
 * confirmation later).
 *
 * Handles both link styles Supabase can send:
 *   ?token_hash=...&type=recovery   works on any device or browser (needs the
 *                                   "Reset password" email template to use
 *                                   {{ .TokenHash }}; see the note in
 *                                   app/(auth)/forgot-password/page.tsx)
 *   ?code=...                       the default template; only works in the
 *                                   same browser that asked for the email
 * Then sends the person to `next` (same-site paths only).
 */

import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const TYPES: EmailOtpType[] = ['recovery', 'email', 'signup', 'invite', 'magiclink', 'email_change'];

function safeNext(raw: string | null): string {
  const n = raw ?? '/';
  return n.startsWith('/') && !n.startsWith('//') && !n.includes('..') && !n.includes('\\') && !n.includes('@') ? n : '/';
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  const supabase = await createClient();

  let ok = false;
  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, url.origin));
  const back = next === '/reset-password' ? '/forgot-password?expired=1' : '/login?error=link_expired';
  return NextResponse.redirect(new URL(back, url.origin));
}
