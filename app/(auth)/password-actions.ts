'use server';

/**
 * Passwords: forgot (email a reset link), set a new one from that link, and
 * change it while signed in.
 *
 * Forgot password never says whether an account exists (the same message
 * every time), so it can't be used to find out who has a Kindred account.
 * The link comes back to /auth/confirm, which signs the person in for this
 * one purpose and sends them to /reset-password.
 */

import { headers } from 'next/headers';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export type PasswordState = { ok: boolean; message: string } | null;

const MIN = 8;
const MAX = 72;

async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function checkNew(pw: string, confirm: string): string | null {
  if (pw.length < MIN) return `Use at least ${MIN} characters.`;
  if (pw.length > MAX) return 'That password is too long.';
  if (pw !== confirm) return 'The two passwords don’t match.';
  return null;
}

/** "Forgot password": email or username in, the same answer out. */
export async function requestPasswordResetAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const raw = (formData.get('identifier')?.toString() ?? '').trim();
  const sent: PasswordState = {
    ok: true,
    message:
      'If there’s a Kindred account with an email for that, a reset link is on its way. It can take a few minutes; check your spam folder too. The link works once and expires after an hour.',
  };
  if (!raw || raw.length > 254) return { ok: false, message: 'Enter your email or username.' };

  let email: string | null = null;
  if (raw.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return { ok: false, message: 'That email doesn’t look right.' };
    email = raw.toLowerCase();
  } else if (/^[a-zA-Z0-9_]{3,30}$/.test(raw)) {
    const { data } = await createServiceClient().from('users').select('email').ilike('username', raw).maybeSingle();
    email = data?.email?.toLowerCase() ?? null;
  } else {
    return { ok: false, message: 'Enter your email or username.' };
  }

  // Old username-only test accounts have no real inbox; say nothing different.
  if (!email || email.endsWith('@kindred.internal')) return sent;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  if (error && /rate limit|too many|seconds/i.test(error.message)) {
    return { ok: false, message: 'Too many tries. Please wait a minute and try again.' };
  }
  // Any other error (e.g. unknown address) gets the same answer on purpose.
  return sent;
}

/** From the emailed link: set the new password. */
export async function setNewPasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const pw = formData.get('password')?.toString() ?? '';
  const problem = checkNew(pw, formData.get('confirm')?.toString() ?? '');
  if (problem) return { ok: false, message: problem };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'This reset link has expired. Ask for a new one.' };

  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) {
    if (/different from the old|same as/i.test(error.message)) return { ok: false, message: 'Pick a password you haven’t used here before.' };
    if (/weak|pwned|leaked/i.test(error.message)) return { ok: false, message: 'That password is too easy to guess. Try a longer one.' };
    return { ok: false, message: 'That didn’t save. Ask for a new reset link and try again.' };
  }
  return { ok: true, message: 'Your password is changed.' };
}

/** Signed in: change the password (asks for the current one first). */
export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = formData.get('current')?.toString() ?? '';
  const pw = formData.get('password')?.toString() ?? '';
  const problem = checkNew(pw, formData.get('confirm')?.toString() ?? '');
  if (!current) return { ok: false, message: 'Enter your current password.' };
  if (problem) return { ok: false, message: problem };
  if (pw === current) return { ok: false, message: 'Pick a new password, different from the current one.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: 'Please log in again.' };

  // Check the current password on a throwaway client, so a wrong guess
  // doesn't touch this browser's session.
  const check = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: wrong } = await check.auth.signInWithPassword({ email: user.email, password: current });
  if (wrong) return { ok: false, message: 'Your current password isn’t right.' };
  await check.auth.signOut({ scope: 'local' }).catch(() => {});

  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) {
    if (/weak|pwned|leaked/i.test(error.message)) return { ok: false, message: 'That password is too easy to guess. Try a longer one.' };
    if (/reauth/i.test(error.message)) return { ok: false, message: 'For safety, log out and use “Forgot password” to change it.' };
    return { ok: false, message: 'That didn’t save. Please try again.' };
  }
  return { ok: true, message: 'Password changed. Use the new one next time you log in.' };
}
