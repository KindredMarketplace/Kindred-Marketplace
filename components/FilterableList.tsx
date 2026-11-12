'use client';

/**
 * FilterableList — results first, filters behind one button (Zillow-style).
 *
 * The server renders each card (so cards keep their own server data and
 * buttons) and passes them in as `cards`, plus a small description of each
 * item (`items`) that the filters, search and sort work on. Everything here
 * actually filters: no decorative controls.
 */

import { useMemo, useState } from 'react';
import { FilterButton, FilterSheet, FilterGroup, ChipToggle } from '@/components/FilterSheet';

export type ListItem = {
  id: string;
  /** Lower-cased text the search box looks through. */
  text: string;
  nums: Record<string, number | null>;
  tags: Record<string, string[]>;
  /** ISO date for "posted within" and newest-first. */
  date?: string | null;
};

export type ListFilter =
  | { kind: 'min' | 'max'; key: string; label: string; prefix?: string; suffix?: string; min: number; max: number; step: number }
  | { kind: 'tags'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'recent'; label: string; options: { days: number; label: string }[] };

export type ListSort = { key: string; label: string; by?: string; dir?: 'asc' | 'desc' };

type Values = Record<string, number | Set<string> | null>;

function initialValues(filters: ListFilter[]): Values {
  const v: Values = {};
  for (const f of filters) {
    if (f.kind === 'min') v[f.key] = f.min;
    else if (f.kind === 'max') v[f.key] = f.max;
    else if (f.kind === 'tags') v[f.key] = new Set();
    else v.__recent = null;
  }
  return v;
}

export function FilterableList({
  items,
  cards,
  filters,
  sorts,
  searchPlaceholder,
  noun,
  toolbarExtra,
  banner,
  empty,
  listClassName = 'space-y-4',
}: {
  items: ListItem[];
  cards: Record<string, React.ReactNode>;
  filters: ListFilter[];
  sorts: ListSort[];
  searchPlaceholder: string;
  noun: [string, string];
  toolbarExtra?: React.ReactNode;
  banner?: React.ReactNode;
  empty: React.ReactNode;
  listClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(sorts[0]?.key ?? '');
  const [values, setValues] = useState<Values>(() => initialValues(filters));

  const activeCount = filters.reduce((n, f) => {
    if (f.kind === 'min') return n + (values[f.key] !== f.min ? 1 : 0);
    if (f.kind === 'max') return n + (values[f.key] !== f.max ? 1 : 0);
    if (f.kind === 'tags') return n + ((values[f.key] as Set<string>).size > 0 ? 1 : 0);
    return n + (values.__recent != null ? 1 : 0);
  }, 0);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const now = Date.now();
    const list = items.filter((it) => {
      if (needle && !it.text.includes(needle)) return false;
      for (const f of filters) {
        if (f.kind === 'min' || f.kind === 'max') {
          const v = values[f.key] as number;
          const x = it.nums[f.key];
          if (x == null) continue;
          if (f.kind === 'min' && v !== f.min && x < v) return false;
          if (f.kind === 'max' && v !== f.max && x > v) return false;
        } else if (f.kind === 'tags') {
          const want = values[f.key] as Set<string>;
          if (want.size > 0 && !(it.tags[f.key] ?? []).some((t) => want.has(t))) return false;
        } else if (values.__recent != null) {
          if (!it.date || now - new Date(it.date).getTime() > (values.__recent as number) * 86400000) return false;
        }
      }
      return true;
    });
    const s = sorts.find((x) => x.key === sort);
    if (!s?.by) return list;
    const dir = s.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = s.by === 'date' ? (a.date ? Date.parse(a.date) : null) : a.nums[s.by!];
      const bv = s.by === 'date' ? (b.date ? Date.parse(b.date) : null) : b.nums[s.by!];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
  }, [items, q, values, sort, sorts, filters]);

  const set = (key: string, v: number | Set<string> | null) => setValues((prev) => ({ ...prev, [key]: v }));
  const toggleTag = (key: string, value: string) => {
    const next = new Set(values[key] as Set<string>);
    next.has(value) ? next.delete(value) : next.add(value);
    set(key, next);
  };
  const reset = () => {
    setValues(initialValues(filters));
    setQ('');
  };

  return (
    <>
      {/* Toolbar: Filters · search · sort */}
      <div className="flex items-center gap-2">
        <FilterButton count={activeCount} onClick={() => setOpen(true)} />
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search</span>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-ink/15 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {toolbarExtra}
        {sorts.length > 1 && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm focus:outline-none focus:border-teal"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-ink/55">
          {results.length} {results.length === 1 ? noun[0] : noun[1]}
        </span>
      </div>

      {banner && <div className="mt-4">{banner}</div>}

      <div className="mt-4">
        {items.length === 0 ? (
          empty
        ) : results.length === 0 ? (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="font-display text-xl font-medium mb-1">No {noun[1]} match that</div>
            <p className="text-sm text-ink/60 mb-4">Try fewer filters or a different search.</p>
            <button type="button" onClick={reset} className="bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Clear filters
            </button>
          </div>
        ) : (
          <div className={listClassName}>{results.map((it) => <div key={it.id}>{cards[it.id]}</div>)}</div>
        )}
      </div>

      <FilterSheet open={open} onClose={() => setOpen(false)} onReset={reset} resultCount={results.length} noun={noun}>
        {filters.map((f) => {
          if (f.kind === 'min' || f.kind === 'max') {
            const v = values[f.key] as number;
            const off = f.kind === 'min' ? v === f.min : v === f.max;
            return (
              <FilterGroup key={f.key} label={f.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink/60">{f.kind === 'min' ? 'At least' : 'Up to'}</span>
                  <span className="font-mono font-medium">{off ? 'Any' : `${f.prefix ?? ''}${v}${f.suffix ?? ''}`}</span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={v}
                  onChange={(e) => set(f.key, Number(e.target.value))}
                  className="w-full accent-deepteal"
                />
              </FilterGroup>
            );
          }
          if (f.kind === 'tags') {
            if (f.options.length === 0) return null;
            return (
              <FilterGroup key={f.key} label={f.label}>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => (
                    <ChipToggle key={o.value} on={(values[f.key] as Set<string>).has(o.value)} onClick={() => toggleTag(f.key, o.value)}>
                      {o.label}
                    </ChipToggle>
                  ))}
                </div>
              </FilterGroup>
            );
          }
          if (f.kind !== 'recent') return null;
          return (
            <FilterGroup key="__recent" label={f.label}>
              <div className="flex flex-wrap gap-2">
                <ChipToggle on={values.__recent == null} onClick={() => set('__recent', null)}>Any time</ChipToggle>
                {f.options.map((o) => (
                  <ChipToggle key={o.days} on={values.__recent === o.days} onClick={() => set('__recent', o.days)}>
                    {o.label}
                  </ChipToggle>
                ))}
              </div>
            </FilterGroup>
          );
        })}
      </FilterSheet>
    </>
  );
}
