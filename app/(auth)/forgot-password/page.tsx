'use client';

/**
 * /forgot-password — ask for a reset link by email or username.
 *
 * Setup notes for the Supabase dashboard (Authentication):
 *   - URL Configuration: Site URL = the live app URL, and Redirect URLs
 *     include <app URL>/** so the link may return to /auth/confirm.
 *   - Email Templates > Reset password: link to
 *     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 *     so the link works on any device (the default link only works in the
 *     browser that asked for it).
 *   - Until a custom email sender (SMTP, e.g. Resend) is set up, Supabase
 *     only emails addresses on the Supabase team, a few per hour.
 */

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthShell, authInput, authButton } from '@/components/AuthShell';
import { requestPasswordResetAction, type PasswordState } from '../password-actions';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ForgotForm />
    </Suspense>
  );
}

function ForgotForm() {
  const expired = useSearchParams().get('expired') === '1';
  const [state, action, pending] = useActionState<PasswordState, FormData>(requestPasswordResetAction, null);

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <div className="text-4xl mb-3" aria-hidden="true">🔑</div>
        <h1 className="font-display text-4xl font-medium tracking-tight mb-2">Forgot your password?</h1>
        <p className="text-ink/60">Enter your email or username and we&apos;ll email you a link to choose a new one.</p>
      </div>

      {expired && !state && (
        <div role="alert" className="mb-6 rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
          That reset link has expired or was already used. Ask for a new one below.
        </div>
      )}

      {state?.ok ? (
        <div role="status" className="rounded-2xl bg-sage/20 border border-sage/40 px-4 py-4 text-sm text-ink leading-relaxed">
          <div className="font-medium mb-1">Check your email</div>
          {state.message}
        </div>
      ) : (
        <form action={action} className="space-y-4">
          {state && !state.ok && (
            <div role="alert" className="rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
              {state.message}
            </div>
          )}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium mb-1.5">Email or username</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className={authInput}
              placeholder="you@email.com"
            />
          </div>
          <button type="submit" disabled={pending} className={authButton}>
            {pending ? 'Sending…' : 'Email me a reset link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/60">
        Remembered it? <Link href="/login" className="text-deepteal font-medium hover:underline">Log in</Link>
      </p>
      <p className="mt-3 text-center text-xs text-ink/45">
        Signed up with only a username and no email? Email us and we&apos;ll reset it for you.
      </p>
    </AuthShell>
  );
}
