'use client';

/**
 * FilterableList — results first, filters behind one button (Zillow-style),
 * with an optional map above the results.
 *
 * The server renders each card (so cards keep their own server data and
 * buttons) and passes them in as `cards`, plus a small description of each
 * item (`items`) that the filters, search, sort and map work on.
 *
 * Every filter actually filters: no decorative controls. Every option is
 * listed (not just the ones today's results happen to have), and each one
 * shows how many results it would give, so nobody taps their way into
 * "0 results" without seeing it coming.
 *
 * Filter kinds:
 *   atLeast / atMost  one-tap chips ("$25+", "Within 10 mi"); "Any" clears
 *   tags              chips, optionally in collapsible groups; matches ANY chosen
 *   schedule          days x parts of the day (Mon morning, Tue evening...)
 *   recent            posted within N days
 */

import { useMemo, useState, useEffect } from 'react';
import { FilterButton, FilterSheet, FilterGroup, ChipToggle } from '@/components/FilterSheet';
import { ResultsMap, type MapPin, type DrawnArea } from '@/components/ResultsMap';
import { DAYS, SLOTS, type Option } from '@/lib/careOptions';

export type ListItem = {
  id: string;
  /** Lower-cased text the search box looks through. */
  text: string;
  nums: Record<string, number | null>;
  tags: Record<string, string[]>;
  /** ISO date for "posted within" and newest-first. */
  date?: string | null;
  /** Approximate map position (inside the ZIP, never an address) and pin label. */
  point?: [number, number] | null;
  pin?: string;
};

type NumOption = { value: number; label: string };

export type ListFilter =
  | { kind: 'atLeast' | 'atMost'; key: string; label: string; options: NumOption[]; hint?: React.ReactNode }
  | {
      kind: 'tags';
      key: string;
      label: string;
      options?: Option[];
      groups?: { label: string; options: Option[] }[];
      hint?: React.ReactNode;
    }
  | { kind: 'schedule'; key: string; label: string; hint?: React.ReactNode }
  | { kind: 'recent'; label: string; options: { days: number; label: string }[] };

/** Is a [lat, lng] point inside a drawn area? (ray casting) */
function inArea(pt: [number, number], area: DrawnArea): boolean {
  const [y, x] = pt;
  let inside = false;
  for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
    const [yi, xi] = area[i];
    const [yj, xj] = area[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export type ListSort = { key: string; label: string; by?: string; dir?: 'asc' | 'desc' };

type Sched = { days: Set<string>; slots: Set<string> };
type Values = Record<string, number | Set<string> | Sched | null>;

function initialValues(filters: ListFilter[]): Values {
  const v: Values = {};
  for (const f of filters) {
    if (f.kind === 'atLeast' || f.kind === 'atMost') v[f.key] = null;
    else if (f.kind === 'tags') v[f.key] = new Set();
    else if (f.kind === 'schedule') v[f.key] = { days: new Set(), slots: new Set() };
    else v.__recent = null;
  }
  return v;
}

function keyOf(f: ListFilter) {
  return f.kind === 'recent' ? '__recent' : f.key;
}

function isActive(f: ListFilter, v: Values) {
  const x = v[keyOf(f)];
  if (f.kind === 'tags') return (x as Set<string>).size > 0;
  if (f.kind === 'schedule') return (x as Sched).days.size > 0 || (x as Sched).slots.size > 0;
  return x != null;
}

/** Does one item pass one filter with these values? */
function passOne(f: ListFilter, v: Values, it: ListItem, now: number): boolean {
  if (!isActive(f, v)) return true;
  if (f.kind === 'atLeast' || f.kind === 'atMost') {
    const want = v[f.key] as number;
    const x = it.nums[f.key];
    if (x == null) return false;
    return f.kind === 'atLeast' ? x >= want : x <= want;
  }
  if (f.kind === 'tags') {
    const want = v[f.key] as Set<string>;
    return (it.tags[f.key] ?? []).some((t) => want.has(t));
  }
  if (f.kind === 'schedule') {
    const s = v[f.key] as Sched;
    const have = it.tags[f.key] ?? [];
    return have.some((t) => {
      const [d, slot] = t.split(':');
      return (s.days.size === 0 || s.days.has(d)) && (s.slots.size === 0 || s.slots.has(slot));
    });
  }
  const days = v.__recent as number;
  return !!it.date && now - new Date(it.date).getTime() <= days * 86400000;
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
  map,
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
  /** Show the results map. `home` is the viewer's own ZIP area. */
  map?: { home?: [number, number] | null; note?: string };
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(sorts[0]?.key ?? '');
  const [values, setValues] = useState<Values>(() => initialValues(filters));
  const [showMap, setShowMap] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [area, setArea] = useState<DrawnArea | null>(null);

  // Remember whether this person likes the map open (this browser only).
  useEffect(() => {
    try {
      if (localStorage.getItem('kindred-map') === 'off') setShowMap(false);
    } catch {}
  }, []);
  const toggleMap = () => {
    setShowMap((s) => {
      try {
        localStorage.setItem('kindred-map', s ? 'off' : 'on');
      } catch {}
      return !s;
    });
  };

  const needle = q.trim().toLowerCase();
  const now = useMemo(() => Date.now(), []);

  /** Items passing search and every filter except `skip` (for option counts). */
  const passAllBut = useMemo(() => {
    return (skip: string | null, it: ListItem) => {
      if (needle && !it.text.includes(needle)) return false;
      if (area && !(it.point && inArea(it.point, area))) return false;
      for (const f of filters) if (keyOf(f) !== skip && !passOne(f, values, it, now)) return false;
      return true;
    };
  }, [needle, filters, values, now, area]);

  const results = useMemo(() => {
    const list = items.filter((it) => passAllBut(null, it));
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
  }, [items, passAllBut, sort, sorts]);

  /** How many results each option would give, with the other filters as they are. */
  const countFor = (f: ListFilter, test: (it: ListItem) => boolean) =>
    items.reduce((n, it) => n + (passAllBut(keyOf(f), it) && test(it) ? 1 : 0), 0);

  const activeCount = filters.reduce((n, f) => n + (isActive(f, values) ? 1 : 0), 0) + (area ? 1 : 0);

  const set = (key: string, v: Values[string]) => setValues((prev) => ({ ...prev, [key]: v }));
  const toggleTag = (key: string, value: string) => {
    const next = new Set(values[key] as Set<string>);
    next.has(value) ? next.delete(value) : next.add(value);
    set(key, next);
  };
  const toggleSched = (key: string, part: 'days' | 'slots', value: string) => {
    const cur = values[key] as Sched;
    const next = new Set(cur[part]);
    next.has(value) ? next.delete(value) : next.add(value);
    set(key, { ...cur, [part]: next });
  };
  const reset = () => {
    setValues(initialValues(filters));
    setQ('');
    setArea(null);
  };

  const pins: MapPin[] = useMemo(
    () =>
      results
        .filter((it) => it.point)
        .map((it) => ({ id: it.id, lat: it.point![0], lng: it.point![1], label: it.pin ?? '•' })),
    [results]
  );
  const unmapped = results.length - pins.length;

  const pick = (id: string) => {
    setPicked(id);
    document.getElementById(`result-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const Count = ({ n }: { n: number }) => <span className={`ml-1 font-mono text-[11px] ${n === 0 ? 'opacity-50' : 'opacity-70'}`}>{n}</span>;

  const chip = (on: boolean, n: number, onClick: () => void, label: React.ReactNode, key: string) => (
    <ChipToggle key={key} on={on} onClick={onClick} muted={!on && n === 0}>
      {label}
      <Count n={n} />
    </ChipToggle>
  );

  return (
    <>
      {/* Toolbar: Filters · search */}
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
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm focus:outline-none focus:border-teal max-w-full"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        )}
        {map && (
          <button
            type="button"
            onClick={toggleMap}
            aria-pressed={showMap}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm hover:bg-mist transition"
          >
            {showMap ? '☰ Hide map' : '🗺 Show map'}
          </button>
        )}
        <span className="ml-auto text-xs text-ink/55">
          {results.length} {results.length === 1 ? noun[0] : noun[1]}
        </span>
      </div>

      {map && showMap && items.length > 0 && (
        <div className="mt-4">
          <ResultsMap
            pins={pins}
            home={map.home ?? null}
            selectedId={picked}
            onSelect={pick}
            area={area}
            onArea={setArea}
            className="h-64 sm:h-72 lg:h-96"
          />
          <p className="mt-1.5 text-[11px] text-ink/50">
            {area
              ? 'Showing only what’s inside the area you drew. '
              : 'Tap ✏️ Draw to trace an area. '}
            {map.note ?? 'Pins show the general area (ZIP code), never an address.'}
            {unmapped > 0 && ` ${unmapped} ${unmapped === 1 ? noun[0] : noun[1]} without a ZIP aren’t on the map.`}
          </p>
        </div>
      )}

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
          <div className={listClassName}>
            {results.map((it) => (
              <div
                key={it.id}
                id={`result-${it.id}`}
                className={`scroll-mt-24 rounded-2xl transition ${picked === it.id ? 'ring-2 ring-deepteal ring-offset-2 ring-offset-cream' : ''}`}
                onClick={() => setPicked(it.id)}
              >
                {cards[it.id]}
              </div>
            ))}
          </div>
        )}
      </div>

      <FilterSheet open={open} onClose={() => setOpen(false)} onReset={reset} resultCount={results.length} noun={noun}>
        {filters.map((f) => {
          if (f.kind === 'atLeast' || f.kind === 'atMost') {
            const cur = values[f.key] as number | null;
            return (
              <FilterGroup key={f.key} label={f.label} hint={f.hint}>
                <div className="flex flex-wrap gap-2">
                  <ChipToggle on={cur == null} onClick={() => set(f.key, null)}>Any</ChipToggle>
                  {f.options.map((o) =>
                    chip(
                      cur === o.value,
                      countFor(f, (it) => {
                        const x = it.nums[f.key];
                        return x != null && (f.kind === 'atLeast' ? x >= o.value : x <= o.value);
                      }),
                      () => set(f.key, cur === o.value ? null : o.value),
                      o.label,
                      String(o.value)
                    )
                  )}
                </div>
              </FilterGroup>
            );
          }
          if (f.kind === 'tags') {
            const cur = values[f.key] as Set<string>;
            const renderOpts = (opts: Option[]) => (
              <div className="flex flex-wrap gap-2">
                {opts.map((o) =>
                  chip(cur.has(o.value), countFor(f, (it) => (it.tags[f.key] ?? []).includes(o.value)), () => toggleTag(f.key, o.value), o.label, o.value)
                )}
              </div>
            );
            return (
              <FilterGroup key={f.key} label={f.label} hint={f.hint}>
                {f.options && renderOpts(f.options)}
                {f.groups && (
                  <div className="space-y-2">
                    {f.groups.map((g, i) => {
                      const chosen = g.options.filter((o) => cur.has(o.value)).length;
                      return (
                        <details key={g.label} open={i === 0 || chosen > 0} className="group rounded-xl border border-ink/10 bg-white">
                          <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm">
                            <span>
                              {g.label}
                              {chosen > 0 && <span className="ml-2 rounded-full bg-deepteal px-2 py-0.5 text-[10px] text-cream">{chosen}</span>}
                            </span>
                            <span className="text-ink/40 transition group-open:rotate-90" aria-hidden="true">›</span>
                          </summary>
                          <div className="px-3.5 pb-3">{renderOpts(g.options)}</div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </FilterGroup>
            );
          }
          if (f.kind === 'schedule') {
            const cur = values[f.key] as Sched;
            const has = (it: ListItem, d: string | null, s: string | null) =>
              (it.tags[f.key] ?? []).some((t) => {
                const [td, ts] = t.split(':');
                const dayOk = d ? td === d : cur.days.size === 0 || cur.days.has(td);
                const slotOk = s ? ts === s : cur.slots.size === 0 || cur.slots.has(ts);
                return dayOk && slotOk;
              });
            return (
              <FilterGroup key={f.key} label={f.label} hint={f.hint}>
                <div className="text-xs text-ink/55 mb-1.5">Days</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS.map((d) => chip(cur.days.has(d.value), countFor(f, (it) => has(it, d.value, null)), () => toggleSched(f.key, 'days', d.value), d.label, d.value))}
                </div>
                <div className="text-xs text-ink/55 mb-1.5">Time of day</div>
                <div className="flex flex-wrap gap-2">
                  {SLOTS.map((s) =>
                    chip(
                      cur.slots.has(s.value),
                      countFor(f, (it) => has(it, null, s.value)),
                      () => toggleSched(f.key, 'slots', s.value),
                      <>
                        {s.label} <span className="opacity-60 text-[11px]">{s.hint}</span>
                      </>,
                      s.value
                    )
                  )}
                </div>
              </FilterGroup>
            );
          }
          if (f.kind !== 'recent') return null;
          const cur = values.__recent as number | null;
          return (
            <FilterGroup key="__recent" label={f.label}>
              <div className="flex flex-wrap gap-2">
                <ChipToggle on={cur == null} onClick={() => set('__recent', null)}>Any time</ChipToggle>
                {f.options.map((o) =>
                  chip(
                    cur === o.days,
                    countFor(f, (it) => !!it.date && now - new Date(it.date).getTime() <= o.days * 86400000),
                    () => set('__recent', cur === o.days ? null : o.days),
                    o.label,
                    String(o.days)
                  )
                )}
              </div>
            </FilterGroup>
          );
        })}
      </FilterSheet>
    </>
  );
}
