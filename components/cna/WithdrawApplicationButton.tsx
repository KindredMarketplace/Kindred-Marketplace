'use client';

/**
 * WithdrawApplicationButton — small confirm-before-firing button used on the
 * CNA's job-detail page so they can withdraw an active application. We require
 * a confirm step because withdraw is intentional and visible to the family.
 */

import { useState, useTransition } from 'react';
import { withdrawApplicationAction } from '@/app/cna/jobs/actions';

export function WithdrawApplicationButton({
  applicationId,
  className,
}: {
  applicationId: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set('application_id', applicationId);
    startTransition(async () => {
      const res = await withdrawApplicationAction(fd);
      if (!res.ok) setError(res.error);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className ?? 'text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition'}
      >
        Withdraw application
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="text-xs text-ink/70">Withdraw this application? The family will see you withdrew.</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition disabled:opacity-60"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="text-xs px-4 py-2 bg-coral text-cream rounded-full hover:bg-inkdark transition disabled:opacity-60"
        >
          {pending ? 'Withdrawing…' : 'Yes, withdraw'}
        </button>
      </div>
      {error && <div className="text-[10px] text-coral">{error}</div>}
    </div>
  );
}
