'use client';

/**
 * FilterSheet — Zillow-style filtering: results come first, filters live
 * behind one "Filters" button.
 *
 *   <FilterButton count={n} onClick={...} />   the toolbar button (shows how
 *                                              many filters are on)
 *   <FilterSheet open onClose onReset resultCount noun>  full-screen on
 *     phones, a right-hand drawer on bigger screens; the bottom button says
 *     how many results the current filters give ("Show 4 caregivers").
 */

import { useEffect } from 'react';

export function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        count > 0 ? 'bg-deepteal text-cream border-deepteal' : 'bg-white border-ink/15 hover:border-teal'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
      Filters{count > 0 ? ` (${count})` : ''}
    </button>
  );
}

export function FilterSheet({
  open,
  onClose,
  onReset,
  resultCount,
  noun,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  resultCount: number;
  noun: [string, string];
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" aria-label="Close filters" className="hidden sm:block absolute inset-0 bg-inkdark/40" onClick={onClose} />
      <div className="absolute inset-0 sm:left-auto sm:w-[420px] bg-cream flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-3">
          <button type="button" onClick={onClose} aria-label="Back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-mist text-xl">
            ‹
          </button>
          <div className="font-display text-lg font-medium">Filters</div>
          <button type="button" onClick={onReset} className="text-sm text-deepteal hover:text-coral font-medium px-2">
            Reset
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="border-t border-ink/10 bg-cream px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-deepteal text-cream py-3 font-medium hover:bg-inkdark transition"
          >
            {resultCount === 0 ? `No ${noun[1]} match` : `Show ${resultCount} ${resultCount === 1 ? noun[0] : noun[1]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** One labelled group inside the sheet. */
export function FilterGroup({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="text-sm font-medium mb-1">{label}</div>
      {hint ? <div className="text-xs text-ink/55 mb-2.5">{hint}</div> : <div className="mb-1.5" />}
      {children}
    </div>
  );
}

export function ChipToggle({
  on,
  onClick,
  muted,
  children,
}: {
  on: boolean;
  onClick: () => void;
  /** Nothing would match right now: still tappable, just quieter. */
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm border transition ${
        on ? 'bg-deepteal text-cream border-deepteal' : muted ? 'bg-white/60 border-ink/10 text-ink/45 hover:bg-mist' : 'bg-white border-ink/15 hover:bg-mist'
      }`}
    >
      {children}
    </button>
  );
}
