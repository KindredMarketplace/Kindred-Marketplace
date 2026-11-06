'use client';

/**
 * CloseJobButton — confirm-before-firing button used at the top of the client
 * job-detail page so the family can close a posting they no longer want
 * applicants for. Open applications get auto-rejected by the action so CNAs
 * see a final status.
 */

import { useState, useTransition } from 'react';
import { closeJobAction } from '@/app/client/jobs/actions';

export function CloseJobButton({ jobId, className }: { jobId: string; className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set('job_id', jobId);
    startTransition(async () => {
      const res = await closeJobAction(fd);
      if (!res.ok) setError(res.error);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          className ??
          'text-xs px-4 py-2 border border-ink/15 text-ink/70 rounded-full hover:bg-mist transition'
        }
      >
        Close job posting
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs text-ink/70 max-w-xs text-right">
        Close this posting? Any open applications will be declined automatically.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition disabled:opacity-60"
        >
          Keep it open
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="text-xs px-4 py-2 bg-coral text-cream rounded-full hover:bg-inkdark transition disabled:opacity-60"
        >
          {pending ? 'Closing…' : 'Yes, close it'}
        </button>
      </div>
      {error && <div className="text-[10px] text-coral">{error}</div>}
    </div>
  );
}
