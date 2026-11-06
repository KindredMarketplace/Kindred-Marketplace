'use client';

/**
 * Quick-filter chips for the find-jobs page. Client component so chips
 * toggle active state on click. Pure UI for now — no query wired yet.
 */

import { useState } from 'react';

const CHIPS = [
  'In your service area',
  '$28+/hr',
  'Mornings',
  'Recurring',
  'One-time',
  'Posted today',
];

export function JobFilterChips() {
  const [active, setActive] = useState<Set<string>>(new Set(['In your service area']));

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
            (active.has(chip)
              ? 'active border-transparent'
              : 'bg-white border-ink/15 hover:bg-mist')
          }
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
