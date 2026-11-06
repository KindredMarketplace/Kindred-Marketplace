'use client';

/**
 * Browse quick-filter chips (client side). Client component so chips toggle
 * active state on click. Pure UI for now — the actual result query runs
 * server-side from real cna_profiles; these chips are visual filters that a
 * future pass will wire to the query string.
 */

import { useState } from 'react';

const CHIPS = [
  'Dementia care',
  'Overnight',
  'Bilingual',
  'Hoyer lift',
  'Hospice support',
  'Post-surgical',
  'Driver license',
];

export function BrowseFilterChips() {
  const [active, setActive] = useState<Set<string>>(new Set());

  function toggle(chip: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2 mt-5">
      <span className="text-xs uppercase tracking-widest text-ink/50 self-center mr-1 font-mono">
        Quick filters —
      </span>
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => toggle(chip)}
          className={
            'filter-chip px-4 py-1.5 text-xs border rounded-full transition ' +
            (active.has(chip) ? 'active border-transparent' : 'bg-white border-ink/15 hover:bg-mist')
          }
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
