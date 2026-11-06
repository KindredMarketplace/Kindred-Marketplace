'use client';

/**
 * CloseAccountButton — the working "Close account" control on the profile page.
 *
 * Because deletion is permanent, it requires an explicit confirm step: the
 * first click reveals a confirmation panel; the user must click "Yes, delete
 * everything" to actually fire deleteAccountAction. On success the action
 * redirects home, so this component never sees a success state — only errors.
 *
 * For now this is an instant hard delete (testing). Production will become a
 * 30-day soft close.
 */

import { useState, useTransition } from 'react';
import { deleteAccountAction } from '@/app/(auth)/actions';

export function CloseAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAccountAction();
      // Only returns on failure; success redirects away.
      if (res && !res.ok) setError(res.error);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="px-5 py-2 text-sm border border-coral/40 rounded-full hover:bg-coral hover:text-cream transition"
      >
        Close account
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-coral/10 border border-coral/40 rounded-2xl p-5">
        <div className="font-medium text-sm mb-1">Permanently close this account?</div>
        <p className="text-sm text-ink/70 mb-4">
          This deletes your profile, care details, and messages right away. This can&rsquo;t be undone.
        </p>
        {error && (
          <div role="alert" className="mb-3 text-sm text-coral">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={confirmDelete}
            disabled={isPending}
            className="px-5 py-2 text-sm bg-coral text-cream rounded-full hover:bg-coral/90 transition disabled:opacity-60"
          >
            {isPending ? 'Closing…' : 'Yes, delete everything'}
          </button>
          <button
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={isPending}
            className="px-5 py-2 text-sm border border-ink/15 rounded-full hover:bg-mist transition disabled:opacity-60"
          >
            Keep my account
          </button>
        </div>
      </div>
    </div>
  );
}
