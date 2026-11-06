'use client';

/**
 * AvailabilityToggle — dropdown selector for the CNA's availability_status.
 * Shows all four enum values with a label and color-coded dot.
 * Calls PATCH /api/cna/availability with optimistic UI and error rollback.
 */

import { useState, useTransition, useRef, useEffect } from 'react';

type Status = 'available' | 'fully_booked' | 'on_break' | 'inactive';

const OPTIONS: { value: Status; label: string; dot: string; bg: string }[] = [
  {
    value: 'available',
    label: 'Available · accepting jobs',
    dot: 'bg-sage',
    bg: 'hover:bg-sage/10',
  },
  {
    value: 'fully_booked',
    label: 'Fully booked',
    dot: 'bg-butter',
    bg: 'hover:bg-butter/10',
  },
  {
    value: 'on_break',
    label: 'On break',
    dot: 'bg-sky',
    bg: 'hover:bg-sky/10',
  },
  {
    value: 'inactive',
    label: 'Not accepting jobs',
    dot: 'bg-ink/30',
    bg: 'hover:bg-creamdark',
  },
];

function getOption(value: Status) {
  return OPTIONS.find((o) => o.value === value) ?? OPTIONS[3];
}

export function AvailabilityToggle({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(next: Status) {
    setOpen(false);
    if (next === status) return;
    const prev = status;
    setStatus(next); // optimistic
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/cna/availability', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? 'Failed to update status');
        }
      } catch (err) {
        setStatus(prev); // revert
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  const current = getOption(status);
  const isAvailable = status === 'available';

  return (
    <div ref={ref} className="hidden md:flex flex-col items-end gap-1 relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all cursor-pointer select-none
          ${isAvailable
            ? 'bg-mist/60 border-teal/20 hover:bg-mist hover:border-teal/40'
            : 'bg-creamdark border-ink/15 hover:bg-mist/30 hover:border-teal/20'
          }
          ${isPending ? 'opacity-60 cursor-wait' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${current.dot} ${isAvailable ? 'live-dot' : ''}`}
        />
        <span className="text-sm">{isPending ? 'Updating…' : current.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-ink/40 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 w-56 bg-white border border-ink/10 rounded-2xl shadow-xl shadow-ink/10 overflow-hidden z-50"
          role="listbox"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === status}
              onClick={() => select(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                ${opt.value === status ? 'bg-mist/50 font-medium' : `${opt.bg}`}
              `}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
              <span>{opt.label}</span>
              {opt.value === status && (
                <svg className="w-3.5 h-3.5 text-deepteal ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-coral font-mono">{error}</p>}
    </div>
  );
}
