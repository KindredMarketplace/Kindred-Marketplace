'use server';

/**
 * Server actions for auth — login, signup, logout.
 *
 * USERNAME + EMAIL
 * ----------------
 * Since Nov 12, 2026 every new account has a real email (so "Forgot
 * password" can reach them) plus a username. People can log in with either:
 * a username is looked up to its account email on the server.
 *
 * Older family test accounts were created with a synthetic address,
 * {username}@kindred.internal, which is never emailed; those still log in
 * with their username, and an admin can reset their password from People.
 *
 * IMPORTANT: Email confirmations must be disabled in the Supabase dashboard
 * (Authentication → Settings → "Enable email confirmations" → OFF) for this
 * flow to work without a confirmation step.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a username to the synthetic internal email we store in auth.users. */
function toInternalEmail(username: string) {
  return `${username.toLowerCase().trim()}@kindred.internal`;
}

/**
 * The sign-in email behind a username (server only; never returned to the
 * browser). Falls back to the old synthetic address for accounts made
 * before real emails were collected.
 */
async function emailForUsername(username: string): Promise<string> {
  try {
    const { data } = await createServiceClient()
      .from('users')
      .select('email')
      .ilike('username', username.trim())
      .maybeSingle();
    if (data?.email) return data.email.toLowerCase();
  } catch {
    // fall through
  }
  return toInternalEmail(username);
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be 30 characters or less.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.');

/**
 * Login accepts EITHER a username OR an email. Staff/admin and the seeded demo
 * accounts were created with real email addresses; CNAs/families use usernames
 * (expanded to {username}@kindred.internal). If the value contains '@' we treat
 * it as a literal email, otherwise as a username.
 */
const LoginIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Username or email is required.')
  .refine(
    (v) =>
      v.includes('@')
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        : /^[a-zA-Z0-9_]+$/.test(v),
    'Enter a valid username or email.',
  );

const LoginSchema = z.object({
  username: LoginIdentifierSchema,
  password: z.string().min(1, 'Password is required.'),
});

const SignupSchema = z.object({
  username: UsernameSchema,
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password is too long.'),
  full_name: z.string().min(1, 'Please enter your name.').max(120),
  role: z.enum(['client', 'cna'], {
    errorMap: () => ({ message: 'Please choose what kind of account you want.' }),
  }),
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<'username' | 'password', string>> };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const raw = {
    username: formData.get('username')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please fix the errors below.', fieldErrors };
  }

  // Email login (admin / staff / demo accounts) vs username login (CNAs / families).
  const identifier = parsed.data.username.trim();
  const email = identifier.includes('@') ? identifier.toLowerCase() : await emailForUsername(identifier);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: 'That username and password don\u2019t match. Please try again.',
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Login succeeded but no session returned. Try again.' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  revalidatePath('/', 'layout');

  // Honour ?next= (e.g. "Log in" from a locked-preview CTA), but only for a
  // same-site path inside the portal this user is allowed into.
  const next = formData.get('next')?.toString() ?? '';
  const portal = profile?.role === 'cna' ? '/cna/' : profile?.role === 'client' ? '/client/' : null;
  if (portal && next.startsWith(portal) && !next.startsWith('//') && !next.includes('..')) {
    redirect(next);
  }

  switch (profile?.role) {
    case 'admin':
      redirect('/admin');
    case 'cna':
      redirect('/cna/dashboard');
    case 'client':
    default:
      redirect('/client/dashboard');
  }
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

export type SignupResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<'username' | 'email' | 'password' | 'full_name' | 'role', string>>;
    };

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const raw = {
    username: formData.get('username')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
    full_name: formData.get('full_name')?.toString() ?? '',
    role: formData.get('role')?.toString() ?? '',
  };

  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please fix the errors below.', fieldErrors };
  }

  // Check username isn't already taken before hitting Supabase Auth.
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('username', parsed.data.username)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: 'That username is already taken. Please choose another.',
      fieldErrors: { username: 'Already taken.' },
    };
  }

  // Create the auth user. Email confirmations should be OFF in Supabase dashboard.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        username: parsed.data.username,
      },
      // Email confirmation is off for now (no custom email sender yet).
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return {
        ok: false,
        error: 'There’s already an account with that email. Try logging in, or use Forgot password.',
        fieldErrors: { email: 'Already in use.' },
      };
    }
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: 'Account creation failed. Please try again.' };
  }

  // Write the username into public.users.
  // The handle_new_user() trigger already created the row; we just update it.
  const { error: updateError } = await supabase
    .from('users')
    .update({ username: parsed.data.username.toLowerCase() })
    .eq('id', data.user.id);

  if (updateError) {
    console.error('[signupAction] failed to set username:', updateError);
    // Non-fatal — the user can still log in, username just won't be set.
  }

  revalidatePath('/', 'layout');

  // If email confirmation is ON (shouldn't be in dev), data.session is null.
  // In that case, just redirect to login with a success message.
  if (!data.session) {
    redirect('/login?created=1');
  }

  switch (parsed.data.role) {
    case 'cna':
      redirect('/cna/dashboard');
    case 'client':
    default:
      // New clients go through the care-setup flow first.
      redirect('/setup');
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Close / delete account
// ---------------------------------------------------------------------------

/**
 * Permanently deletes the logged-in user's account.
 *
 * For now this is an INSTANT hard delete (per Nick, for testing). In production
 * this should become a 30-day soft-close: flip users.status to 'closing', keep
 * billing/records accessible, then purge via a scheduled job.
 *
 * Deletion order:
 *   1. Verify there's a real session (so we only ever delete the caller).
 *   2. Delete the public.users row with the service client. Most child tables
 *      (client_profiles, care_recipients, jobs, messages, etc.) CASCADE from
 *      here, cleaning themselves up.
 *   3. Delete the auth.users row via the admin API.
 *   4. Sign out + redirect home.
 *
 * Returns a result object on failure; on success it redirects (never returns).
 */
export type DeleteAccountResult = { ok: false; error: string };

export async function deleteAccountAction(): Promise<DeleteAccountResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'You need to be signed in to close your account.' };
  }

  const userId = user.id;
  const admin = createServiceClient();

  // 1. Delete the public.users row (cascades to most child data).
  const { error: profileDeleteError } = await admin.from('users').delete().eq('id', userId);
  if (profileDeleteError) {
    return {
      ok: false,
      error:
        'We couldn\u2019t close your account. You may have active bookings or payments that need to be resolved first. ' +
        `(${profileDeleteError.message})`,
    };
  }

  // 2. Delete the auth user via the admin API.
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    // public.users is already gone; log so we can clean up the orphaned auth row.
    console.error('[deleteAccountAction] auth user delete failed:', authDeleteError);
  }

  // 3. Clear the local session, then send them home.
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/?account_closed=1');
}
