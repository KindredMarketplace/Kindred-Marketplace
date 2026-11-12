'use client';

/** Change password while signed in (Settings > Security). Asks for the current one first. */

import { useActionState, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { changePasswordAction, type PasswordState } from '@/app/(auth)/password-actions';

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const field = 'kfield';
  const label = 'text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block';

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm">Change password</div>
          <div className={`text-xs ${state?.ok ? 'text-deepteal' : 'text-ink/60'}`}>
            {state?.ok ? `✓ ${state.message}` : 'You’ll need your current password.'}
          </div>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-sm px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition"
          >
            Change
          </button>
        )}
      </div>
      {open && (
        <form ref={form} action={action} className="mt-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className={label} htmlFor="pw-current">Current</label>
            <input id="pw-current" name="current" type="password" autoComplete="current-password" required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pw-new">New</label>
            <input id="pw-new" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pw-confirm">New again</label>
            <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={field} />
          </div>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="bg-deepteal text-cream px-5 py-2 rounded-full text-sm hover:bg-inkdark transition disabled:opacity-60">
              {pending ? 'Saving…' : 'Save new password'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/60 hover:text-ink">
              Cancel
            </button>
            {state && !state.ok && (
              <span role="alert" className="text-sm text-coral">{state.message}</span>
            )}
          </div>
          <p className="sm:col-span-3 text-xs text-ink/50">
            Forgot your current one? Log out and use <Link href="/forgot-password" className="text-deepteal underline">Forgot password</Link>.
          </p>
        </form>
      )}
    </div>
  );
}
