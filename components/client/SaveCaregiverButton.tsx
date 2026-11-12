'use client';

/**
 * The ♡ on a caregiver. Fills in right away, saves to the family's Saved
 * list, and stays filled. If it fails it flips back and says why.
 */

import { useState, useTransition } from 'react';
import { toggleSaveCaregiverAction } from '@/app/client/caregivers/actions';

export function SaveCaregiverButton({
  shownId,
  initiallySaved,
  size = 'sm',
  withLabel = false,
}: {
  shownId: string;
  initiallySaved: boolean;
  size?: 'sm' | 'md';
  withLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const before = saved;
    setSaved(!before);
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await toggleSaveCaregiverAction(shownId);
        if (res.ok) setSaved(res.saved);
        else {
          setSaved(before);
          setMsg(res.message ?? 'Couldn’t save. Try again.');
        }
      } catch {
        setSaved(before);
        setMsg('Couldn’t save. Try again.');
      }
    });
  }

  const dim = withLabel ? 'h-11 px-4 gap-2 text-sm' : size === 'md' ? 'w-11 h-11 text-lg' : 'w-9 h-9';
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved caregivers' : 'Save this caregiver'}
        className={`${dim} shrink-0 inline-flex items-center justify-center rounded-full border transition ${
          saved ? 'bg-coral border-coral text-cream' : 'border-ink/15 text-ink/70 bg-white hover:bg-mist'
        }`}
      >
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        {withLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
      </button>
      {msg && (
        <span role="status" className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-inkdark px-3 py-2 text-[11px] text-cream shadow-lg z-10">
          {msg}
        </span>
      )}
    </span>
  );
}
