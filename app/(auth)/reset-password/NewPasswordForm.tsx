'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { authInput, authButton } from '@/components/AuthShell';
import { setNewPasswordAction, type PasswordState } from '../password-actions';

export function NewPasswordForm({ home }: { home: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(setNewPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="text-center">
        <div role="status" className="rounded-2xl bg-sage/20 border border-sage/40 px-4 py-4 text-sm text-ink mb-6">
          ✓ {state.message} You&apos;re logged in.
        </div>
        <Link href={home} className="inline-block rounded-xl bg-deepteal px-5 py-2.5 font-medium text-cream hover:bg-deepteal/90">
          Continue →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && (
        <div role="alert" className="rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
          {state.message}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={authInput} />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={authInput} />
      </div>
      <button type="submit" disabled={pending} className={authButton}>
        {pending ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
