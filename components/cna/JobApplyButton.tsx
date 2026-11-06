'use client';

/**
 * JobApplyButton — wraps the "Apply now" button on a job card. Calls
 * applyToJobAction on submit, then shows "Submitting…" while pending and
 * "Applied ✓" once done. Idempotent — if the CNA already applied, the action
 * returns ok: 'already_applied' and we still flip to the applied state.
 *
 * The parent server component decides the initial state (alreadyApplied?)
 * based on the join we ran on the page.
 */

import { useState, useTransition } from 'react';
import { applyToJobAction } from '@/app/cna/jobs/actions';

export function JobApplyButton({
  jobId,
  alreadyApplied = false,
  className,
}: {
  jobId: string;
  alreadyApplied?: boolean;
  className?: string;
}) {
  const [applied, setApplied] = useState(alreadyApplied);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    const fd = new FormData();
    fd.set('job_id', jobId);
    startTransition(async () => {
      const res = await applyToJobAction(fd);
      if (res.ok) setApplied(true);
      else setError(res.error);
    });
  }

  if (applied) {
    return (
      <button
        type="button"
        disabled
        className={className ?? 'flex-1 text-xs py-2 bg-sage/20 text-deepteal border border-sage/40 rounded-full cursor-default'}
      >
        ✓ Applied
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={className ?? 'flex-1 text-xs py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition disabled:opacity-60'}
      >
        {pending ? 'Submitting…' : 'Apply now'}
      </button>
      {error && <span className="text-[10px] text-coral mt-1 block">{error}</span>}
    </>
  );
}
