'use client';

/**
 * Recurring availability — which parts of which days you're usually free.
 * Saves to cna_availability (one row per day + part of day), and families
 * filter Browse by it ("When they're free").
 */

import { useActionState, useState } from 'react';
import { saveAvailabilityAction, type AvailabilityState } from '@/app/cna/schedule/actions';
import { DAYS, SLOTS } from '@/lib/careOptions';

const FULL_DAY: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function AvailabilityEditor({ initial }: { initial: string[] }) {
  const [state, action, pending] = useActionState<AvailabilityState, FormData>(saveAvailabilityAction, null);
  const [on, setOn] = useState<Set<string>>(() => new Set(initial));
  const [dirty, setDirty] = useState(false);

  const flip = (tag: string) => {
    setDirty(true);
    setOn((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };
  const preset = (tags: string[]) => {
    setDirty(true);
    setOn(new Set(tags));
  };
  const all = (days: string[], slots: string[]) => days.flatMap((d) => slots.map((s) => `${d}:${s}`));

  return (
    <form
      action={(fd) => {
        setDirty(false);
        return action(fd);
      }}
      className="bg-white border border-ink/10 rounded-2xl p-5"
    >
      {[...on].map((t) => (
        <input key={t} type="hidden" name="slots" value={t} />
      ))}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <button type="button" onClick={() => preset(all(['mon', 'tue', 'wed', 'thu', 'fri'], ['morning', 'afternoon']))} className="text-[11px] px-3 py-1.5 rounded-full border border-ink/15 hover:bg-mist">
          Weekday days
        </button>
        <button type="button" onClick={() => preset(all(['sat', 'sun'], ['morning', 'afternoon', 'evening']))} className="text-[11px] px-3 py-1.5 rounded-full border border-ink/15 hover:bg-mist">
          Weekends
        </button>
        <button type="button" onClick={() => preset(all(DAYS.map((d) => d.value), ['overnight']))} className="text-[11px] px-3 py-1.5 rounded-full border border-ink/15 hover:bg-mist">
          Overnights
        </button>
        <button type="button" onClick={() => preset([])} className="text-[11px] px-3 py-1.5 rounded-full border border-ink/15 hover:bg-mist text-ink/60">
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {DAYS.map((d) => {
          const count = SLOTS.filter((s) => on.has(`${d.value}:${s.value}`)).length;
          return (
            <div key={d.value}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-medium text-ink/70">{FULL_DAY[d.value]}</span>
                {count === 0 && <span className="text-[10px] text-ink/40 italic">Off</span>}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {SLOTS.map((s) => {
                  const tag = `${d.value}:${s.value}`;
                  const checked = on.has(tag);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={checked}
                      title={s.hint}
                      onClick={() => flip(tag)}
                      className={
                        'py-1.5 px-1 text-center rounded-md text-[11px] border transition ' +
                        (checked ? 'bg-gradient-to-br from-sage to-teal text-cream border-transparent' : 'bg-white text-ink border-ink/10 hover:bg-mist')
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-ink/50 leading-relaxed">
        {SLOTS.map((s) => `${s.label} ${s.hint}`).join(' · ')}
      </p>

      <div className="mt-4 pt-4 border-t border-ink/10">
        <button type="submit" disabled={pending} className="w-full bg-deepteal text-cream py-2.5 rounded-full text-sm hover:bg-inkdark transition disabled:opacity-60">
          {pending ? 'Saving…' : 'Save availability'}
        </button>
        <p role="status" className={`text-[11px] mt-2 text-center ${state && !dirty ? (state.ok ? 'text-deepteal' : 'text-coral') : 'text-ink/50'}`}>
          {dirty ? 'Unsaved changes' : state?.message ?? 'Families can filter by the times you choose.'}
        </p>
      </div>
    </form>
  );
}
