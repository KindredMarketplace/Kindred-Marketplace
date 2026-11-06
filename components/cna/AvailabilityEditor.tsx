'use client';

/**
 * Recurring-availability editor — the day/slot checkbox grid from the
 * my-schedule mock. Client component for the toggle interaction.
 *
 * Pure UI for now. When the cna_availability table is wired, the initial
 * state will come from the DB and "Save availability" will persist it.
 */

import { useState } from 'react';

type Slot = 'morning' | 'midday' | 'evening' | 'night';
const SLOTS: Slot[] = ['morning', 'midday', 'evening', 'night'];
const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
};

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const DAYS: { key: DayKey; label: string; hours: string; off?: boolean }[] = [
  { key: 'mon', label: 'Monday', hours: '8 AM – 4 PM' },
  { key: 'tue', label: 'Tuesday', hours: '8 AM – 4 PM' },
  { key: 'wed', label: 'Wednesday', hours: '8 AM – 4 PM' },
  { key: 'thu', label: 'Thursday', hours: '8 AM – 4 PM' },
  { key: 'fri', label: 'Friday', hours: '8 AM – 1 PM' },
  { key: 'sat', label: 'Saturday', hours: 'Off', off: true },
  { key: 'sun', label: 'Sunday', hours: 'Off', off: true },
];

// Default selections matching the mock (weekday morning+midday checked).
const DEFAULTS: Record<DayKey, Set<Slot>> = {
  mon: new Set<Slot>(['morning', 'midday']),
  tue: new Set<Slot>(['morning', 'midday']),
  wed: new Set<Slot>(['morning', 'midday']),
  thu: new Set<Slot>(['morning', 'midday']),
  fri: new Set<Slot>(['morning', 'midday']),
  sat: new Set<Slot>(),
  sun: new Set<Slot>(),
};

export function AvailabilityEditor() {
  const [grid, setGrid] = useState<Record<DayKey, Set<Slot>>>(DEFAULTS);

  function toggle(day: DayKey, slot: Slot) {
    setGrid((prev) => {
      const next = { ...prev };
      const set = new Set(next[day]);
      if (set.has(slot)) set.delete(slot);
      else set.add(slot);
      next[day] = set;
      return next;
    });
  }

  return (
    <div className="bg-white border border-ink/10 rounded-2xl p-5">
      <div className="space-y-3">
        {DAYS.map((d) => (
          <div key={d.key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-medium text-ink/70">{d.label}</span>
              {d.off ? (
                <span className="text-[10px] text-ink/40 italic">Off</span>
              ) : (
                <span className="text-[10px] text-deepteal font-mono">{d.hours}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {SLOTS.map((slot) => {
                const checked = grid[d.key].has(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle(d.key, slot)}
                    className={
                      'py-1.5 px-1 text-center rounded-md text-[11px] border transition ' +
                      (checked
                        ? 'bg-gradient-to-br from-sage to-teal text-cream border-transparent'
                        : 'bg-white text-ink border-ink/10 hover:bg-mist')
                    }
                  >
                    {SLOT_LABEL[slot]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-ink/10">
        <button className="w-full bg-deepteal text-cream py-2.5 rounded-full text-sm hover:bg-inkdark transition">
          Save availability
        </button>
        <div className="text-[10px] text-ink/50 mt-2 text-center font-mono">
          Auto-applies to next 6 weeks
        </div>
      </div>
    </div>
  );
}
