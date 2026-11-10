'use client';

/**
 * The ♡ on a job card. Fills in immediately when tapped, saves to the
 * caregiver's Saved jobs, and stays filled (it's stored, not a hover state).
 * If the save fails, it flips back and says so.
 */

import { useState, useTransition } from 'react';
import { toggleSaveJobAction } from '@/app/cna/jobs/actions';

export function SaveJobButton({ jobId, initiallySaved, size = 'sm' }: { jobId: string; initiallySaved: boolean; size?: 'sm' | 'md' }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next);
    setFailed(false);
    startTransition(async () => {
      try {
        const res = await toggleSaveJobAction(jobId, next);
        setSaved(res.saved);
        if (!res.ok) setFailed(true);
      } catch {
        setSaved(!next);
        setFailed(true);
      }
    });
  }

  const dim = size === 'md' ? 'w-11 h-11 text-lg' : 'w-9 h-9';
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
      title={failed ? 'Couldn’t save. Try again.' : saved ? 'Saved' : 'Save'}
      className={`${dim} shrink-0 flex items-center justify-center rounded-full border transition ${
        saved ? 'bg-coral border-coral text-cream' : 'border-ink/15 text-ink/70 bg-white'
      } ${failed ? 'ring-2 ring-coral/40' : ''}`}
    >
      {saved ? '♥' : '♡'}
    </button>
  );
}
