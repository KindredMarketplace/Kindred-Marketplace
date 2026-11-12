'use client';

/**
 * BrowseClient — the interactive half of /browse: filters, sort, grid/map
 * toggle, and the profile modal.
 *
 * Operates on the REAL approved caregivers passed from the server. Filters that
 * have real backing data (search, max rate, gender, languages) actually filter;
 * specialty matching is text-based against the headline/bio. Distance,
 * availability, and verification chips are shown for parity with the design and
 * become exact as that data fills in — they never fabricate exclusions.
 *
 * LOCKED PREVIEW (Nov 2026): rows come from the browse_caregivers() RPC,
 * which withholds full names and photos unless the viewer is a member family
 * (identity_unlocked). This component never sees data it shouldn't show.
 * Every caregiver here meets the Kindred Standard, so those badges are earned.
 */

import { useMemo, useState } from 'react';
import { FilterButton, FilterSheet, FilterGroup, ChipToggle } from '@/components/FilterSheet';
import Link from 'next/link';

export type Caregiver = {
  user_id: string;
  display_name: string | null;
  last_name: string | null;
  /** Only present when this viewer may see who they are (identity_unlocked). */
  photo_url?: string | null;
  headline: string | null;
  bio: string | null;
  hourly_rate_cents: number | null;
  years_experience: number | null;
  experience_hours: number | null;
  service_zip: string | null;
  languages: string[] | null;
  gender: string | null;
  availability_status: string | null;
  services: string[];
  identity_unlocked: boolean;
};

/** Who is looking, which decides the call to action. */
export type Viewer = 'anon' | 'family' | 'family_member' | 'caregiver' | 'admin';

const STANDARD_BADGES = ['L2 background ✓', 'ID verified ✓', 'Insured ✓'];

const GENDERS: [string, string][] = [
  ['any', 'Any'],
  ['female', 'Female'],
  ['male', 'Male'],
  ['nonbinary', 'Non-binary'],
];
const SPECIALTIES = ['Dementia', "Parkinson's", 'Hospice', 'Mobility', 'Med Aide', 'Post-surgical'];
const AV = ['av-1', 'av-7', 'av-3', 'av-4', 'av-2', 'av-8', 'av-6', 'av-5'];

function initials(c: Caregiver) {
  return `${(c.display_name ?? 'K').charAt(0)}${(c.last_name ?? '').charAt(0)}`.toUpperCase();
}
function displayName(c: Caregiver) {
  if (!c.identity_unlocked) return `${(c.display_name ?? 'K').charAt(0).toUpperCase()}.`;
  return `${c.display_name ?? 'Caregiver'}${c.last_name ? ` ${c.last_name.charAt(0)}.` : ''}`;
}
function hoursLabel(h: number | null) {
  if (h == null) return null;
  return `${h.toLocaleString('en-US')}+ hrs`;
}

export function BrowseClient({ caregivers, viewer = 'anon' }: { caregivers: Caregiver[]; viewer?: Viewer }) {
  const [search, setSearch] = useState('');
  const [maxRate, setMaxRate] = useState(80);
  const [gender, setGender] = useState('any');
  const [specialties, setSpecialties] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState('best');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Caregiver | null>(null);

  // Language chips come from the real caregivers (honest — only what they speak).
  const languageOptions = useMemo(() => {
    const s = new Set<string>();
    caregivers.forEach((c) => c.languages?.forEach((l) => s.add(l)));
    return s.size > 0 ? [...s] : ['English', 'Español', 'Kreyòl'];
  }, [caregivers]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  function reset() {
    setSearch(''); setMaxRate(80); setGender('any');
    setSpecialties(new Set()); setLangs(new Set());
  }

  const activeCount =
    (maxRate !== 80 ? 1 : 0) + (gender !== 'any' ? 1 : 0) + (specialties.size > 0 ? 1 : 0) + (langs.size > 0 ? 1 : 0);

  const results = useMemo(() => {
    let list = caregivers.filter((c) => {
      const text = `${c.display_name ?? ''} ${c.last_name ?? ''} ${c.headline ?? ''} ${c.bio ?? ''} ${(c.services ?? []).join(' ')}`.toLowerCase();
      if (search.trim() && !text.includes(search.trim().toLowerCase())) return false;
      const rate = c.hourly_rate_cents != null ? c.hourly_rate_cents / 100 : null;
      if (rate != null && rate > maxRate) return false;
      if (gender !== 'any' && (c.gender ?? '').toLowerCase() !== gender) return false;
      if (langs.size > 0 && !(c.languages ?? []).some((l) => langs.has(l))) return false;
      if (specialties.size > 0 && ![...specialties].some((s) => text.includes(s.toLowerCase()))) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const ra = a.hourly_rate_cents ?? Infinity;
      const rb = b.hourly_rate_cents ?? Infinity;
      switch (sort) {
        case 'rate-low': return ra - rb;
        case 'rate-high': return rb - ra;
        case 'experience': return (b.years_experience ?? 0) - (a.years_experience ?? 0);
        default: return 0;
      }
    });
    return list;
  }, [caregivers, search, maxRate, gender, langs, specialties, sort]);

  return (
    <>
      {/* Toolbar: Filters · search, then sort. Results come right after. */}
      <section className="mb-4 fade-up">
        <div className="flex items-center gap-2">
          <FilterButton count={activeCount} onClick={() => setFiltersOpen(true)} />
          <label className="relative flex-1 min-w-0">
            <span className="sr-only">Search caregivers</span>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search, e.g. dementia, Spanish"
              className="w-full rounded-full border border-ink/15 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm focus:outline-none focus:border-teal"
          >
            <option value="best">Sort: Best match</option>
            <option value="rate-low">Sort: Rate, low to high</option>
            <option value="rate-high">Sort: Rate, high to low</option>
            <option value="experience">Sort: Most experienced</option>
          </select>
          <span className="ml-auto text-xs text-ink/55">
            {results.length} {results.length === 1 ? 'caregiver' : 'caregivers'}
          </span>
        </div>
      </section>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={reset}
        resultCount={results.length}
        noun={['caregiver', 'caregivers']}
      >
        <Slider label="Max rate" value={maxRate === 80 ? 'Any' : `$${maxRate}/hr`} min={15} max={80} step={1} v={maxRate} onChange={setMaxRate} />
        <FilterGroup label="Caregiver gender">
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(([val, lbl]) => (
              <ChipToggle key={val} on={gender === val} onClick={() => setGender(val)}>{lbl}</ChipToggle>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label="Specialties">
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((v) => (
              <ChipToggle key={v} on={specialties.has(v)} onClick={() => toggle(setSpecialties, v)}>{v}</ChipToggle>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label="Languages">
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((v) => (
              <ChipToggle key={v} on={langs.has(v)} onClick={() => toggle(setLangs, v)}>{v}</ChipToggle>
            ))}
          </div>
        </FilterGroup>
      </FilterSheet>

      <section className="fade-up">
        {/* Results */}
        <div>
          {results.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-ink/10">
              {caregivers.length === 0 ? (
                <>
                  <div className="font-display text-3xl font-light mb-3">Our founding caregivers are being vetted now.</div>
                  <p className="text-ink/60 mb-6 max-w-md mx-auto">Every caregiver completes a real interview before they appear here. The first profiles are coming soon.</p>
                </>
              ) : (
                <>
                  <div className="font-display text-3xl font-light mb-3">No caregivers match those filters.</div>
                  <p className="text-ink/60 mb-6">Try widening your search to see more caregivers.</p>
                  <button onClick={reset} className="bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition">Reset filters</button>
                </>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map((c, i) => (
                <article
                  key={c.user_id}
                  onClick={() => setSelected(c)}
                  className="card-hover bg-white border border-ink/10 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {c.identity_unlocked && c.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full ${AV[i % AV.length]} flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}>
                        {initials(c)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-lg font-medium leading-tight">{displayName(c)}</div>
                      <div className="text-xs text-ink/60 font-mono">
                        {c.years_experience ? `${c.years_experience} yrs` : 'Caregiver'}
                        {c.experience_hours ? ` · ${hoursLabel(c.experience_hours)}` : ''}
                        {c.service_zip ? ` · ${c.service_zip}` : ''}
                      </div>
                      <div className="mt-1.5 text-xs text-deepteal font-medium">✓ Meets the Kindred Standard</div>
                      {!c.identity_unlocked && (
                        <div className="mt-1 text-[11px] text-ink/50">🔒 Name &amp; photo unlock with membership</div>
                      )}
                    </div>
                  </div>
                  {c.headline && <p className="text-sm text-ink/75 leading-relaxed mb-3 italic font-display">&ldquo;{c.headline}&rdquo;</p>}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {STANDARD_BADGES.map((b) => (
                      <span key={b} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-deepteal/10 text-deepteal">{b}</span>
                    ))}
                    {c.languages?.slice(0, 2).map((l) => (
                      <span key={l} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky/15 text-deepteal">{l}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-ink/10">
                    <div>
                      {c.hourly_rate_cents != null ? (
                        <><span className="font-display text-lg font-medium">${(c.hourly_rate_cents / 100).toFixed(0)}</span><span className="text-xs text-ink/60">/hr</span></>
                      ) : (
                        <span className="text-sm text-deepteal font-medium">Rate on request</span>
                      )}
                    </div>
                    <span className="text-xs px-3 py-1.5 bg-deepteal text-cream rounded-full">View profile</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-br from-mist/60 to-creamdark/60 border border-ink/10 rounded-3xl p-6 lg:p-8 text-center">
            <h3 className="font-display text-2xl font-medium mb-1">Don&apos;t see the right fit?</h3>
            <p className="text-sm text-ink/70 max-w-xl mx-auto mb-4">
              Members can post what they need, and listed caregivers near you can reach out directly.
            </p>
            <Link href={viewer === 'anon' ? '/signup?role=client' : '/client/membership'} className="inline-flex bg-coral text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">
              {viewer === 'anon' ? 'Create a family account →' : 'See membership →'}
            </Link>
          </div>
        </div>
      </section>

      {/* Profile modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 p-4 overflow-y-auto flex items-start justify-center"
          style={{ background: 'rgba(31,58,61,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="relative max-w-lg w-full my-8 bg-cream rounded-3xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-cream border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-cream transition"
            >
              ✕
            </button>
            <div className={`h-32 ${AV[0]}`} />
            <div className="px-6 pb-8 -mt-12 relative">
              {selected.identity_unlocked && selected.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.photo_url} alt="" className="w-24 h-24 rounded-full border-4 border-cream object-cover" />
              ) : (
                <div className={`w-24 h-24 rounded-full ${AV[0]} border-4 border-cream flex items-center justify-center text-cream font-display text-3xl font-medium`}>
                  {initials(selected)}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <h2 className="font-display text-3xl font-medium">{displayName(selected)}</h2>
                <span className="bg-sage/20 text-deepteal px-2 py-0.5 rounded-full text-xs font-medium">✓ Kindred Standard</span>
              </div>
              <div className="text-ink/70 text-sm mt-1">
                {selected.years_experience ? `${selected.years_experience} yrs experience` : 'Caregiver'}
                {selected.experience_hours ? ` · ${hoursLabel(selected.experience_hours)} hands-on` : ''}
                {selected.service_zip ? ` · ${selected.service_zip}` : ''}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {STANDARD_BADGES.map((b) => (
                  <span key={b} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-deepteal/10 text-deepteal">{b}</span>
                ))}
              </div>
              {!selected.identity_unlocked && (
                <div className="mt-4 bg-white border border-ink/10 rounded-xl p-3 text-xs text-ink/70 leading-relaxed">
                  🔒 To protect caregivers, full names, photos and messaging open up once you&apos;re a member.
                  Everything else you see here is real.
                </div>
              )}

              {selected.bio && <p className="text-ink/80 leading-relaxed mt-5">{selected.bio}</p>}
              {selected.headline && (
                <div className="mt-4 bg-mist/60 rounded-xl p-4 italic font-display text-deepteal">&ldquo;{selected.headline}&rdquo;</div>
              )}

              {selected.services && selected.services.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-2">Services</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.services.map((l) => (
                      <span key={l} className="bg-white border border-ink/15 px-2.5 py-1 rounded-full text-xs">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.languages && selected.languages.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-2">Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.languages.map((l) => (
                      <span key={l} className="bg-white border border-ink/15 px-2.5 py-1 rounded-full text-xs">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-ink/10">
                <div>
                  {selected.hourly_rate_cents != null && (
                    <div className="font-display text-2xl font-medium">${(selected.hourly_rate_cents / 100).toFixed(0)}<span className="text-sm text-ink/50 font-sans">/hr</span></div>
                  )}
                </div>
                <ModalActions viewer={viewer} />
              </div>
              <p className="text-center text-xs text-ink/45 mt-4">
                Browsing is free. You pay the caregiver directly; Kindred never takes a cut of their rate.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalActions({ viewer }: { viewer: Viewer }) {
  const base = 'px-4 py-2.5 rounded-full text-sm transition';
  if (viewer === 'family_member' || viewer === 'admin') {
    return (
      <Link href="/client/browse" className={`${base} bg-deepteal text-cream font-medium hover:bg-inkdark`}>
        Message from your portal →
      </Link>
    );
  }
  if (viewer === 'family') {
    return (
      <Link href="/client/membership" className={`${base} bg-deepteal text-cream font-medium hover:bg-inkdark`}>
        Unlock with membership
      </Link>
    );
  }
  if (viewer === 'caregiver') {
    return <span className="text-xs text-ink/50 max-w-[12rem] text-right">You&apos;re signed in as a caregiver.</span>;
  }
  return (
    <div className="flex gap-2">
      <Link href="/login?next=/client/membership" className={`${base} border border-ink/20 hover:bg-ink hover:text-cream`}>Log in</Link>
      <Link href="/signup?role=client" className={`${base} bg-deepteal text-cream font-medium hover:bg-inkdark`}>Join to message</Link>
    </div>
  );
}

function Slider({
  label, value, min, max, step, v, onChange,
}: {
  label: string; value: string; min: number; max: number; step: number; v: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-display text-deepteal">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

