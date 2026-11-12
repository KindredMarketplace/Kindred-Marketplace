'use client';

/**
 * BrowseClient — the interactive half of /browse (and the caregiver's
 * "preview as a family"): the full filter set, sorts and map from
 * FilterableList / lib/listConfigs.ts, plus the profile pop-up.
 *
 * Operates on the REAL listed caregivers passed from the server, with
 * distance and map points already worked out there (ZIP areas only).
 *
 * LOCKED PREVIEW (Nov 2026): rows come from the browse_caregivers() RPC,
 * which withholds full names and photos unless the viewer is a member family
 * (identity_unlocked). This component never sees data it shouldn't show.
 * Every caregiver here meets the Kindred Standard, so those badges are earned.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FilterableList } from '@/components/FilterableList';
import { caregiverItem, caregiverFilters, caregiverSorts, type CaregiverRow } from '@/lib/listConfigs';
import { CREDENTIALS, SERVICE_LABEL, normalizeLanguage } from '@/lib/careOptions';

export type Caregiver = CaregiverRow;

/** Who is looking, which decides the call to action. */
export type Viewer = 'anon' | 'family' | 'family_member' | 'caregiver' | 'admin';

const STANDARD_BADGES = ['L2 background ✓', 'ID verified ✓', 'Insured ✓'];
const AV = ['av-1', 'av-7', 'av-3', 'av-4', 'av-2', 'av-8', 'av-6', 'av-5'];
const CRED_LABEL: Record<string, string> = Object.fromEntries(CREDENTIALS.map((o) => [o.value, o.label]));

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
function serviceNames(c: Caregiver): string[] {
  if (c.service_keys?.length) return c.service_keys.map((k) => SERVICE_LABEL[k] ?? k.replace(/_/g, ' '));
  return c.services ?? [];
}

export function BrowseClient({
  caregivers,
  viewer = 'anon',
  home = null,
  distanceHint,
  showMap = true,
}: {
  caregivers: Caregiver[];
  viewer?: Viewer;
  home?: [number, number] | null;
  distanceHint?: React.ReactNode;
  showMap?: boolean;
}) {
  const [selected, setSelected] = useState<Caregiver | null>(null);

  const items = useMemo(() => caregivers.map(caregiverItem), [caregivers]);
  const filters = useMemo(() => caregiverFilters({ distanceHint }), [distanceHint]);
  const cards = useMemo(() => {
    const out: Record<string, React.ReactNode> = {};
    caregivers.forEach((c, i) => {
      out[c.user_id] = (
      <article
        onClick={() => setSelected(c)}
        className="card-hover bg-white border border-ink/10 rounded-2xl p-5 h-full cursor-pointer"
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
              {c.credential && CRED_LABEL[c.credential] ? CRED_LABEL[c.credential] : 'Caregiver'}
              {c.experience_hours ? ` · ${hoursLabel(c.experience_hours)}` : ''}
              {c.rating_avg != null && (c.rating_count ?? 0) > 0 ? ` · ★ ${Number(c.rating_avg).toFixed(1)}` : ''}
            </div>
            {c.distance_mi != null && <div className="text-xs text-deepteal font-mono mt-0.5">~{c.distance_mi} mi away</div>}
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
          {c.languages?.slice(0, 2).map(normalizeLanguage).map((l) => (
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
      );
    });
    return out;
  }, [caregivers]);

  return (
    <>
      <FilterableList
        items={items}
        cards={cards}
        filters={filters}
        sorts={caregiverSorts(!!home)}
        searchPlaceholder="Search, e.g. dementia, Spanish"
        noun={['caregiver', 'caregivers']}
        listClassName="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
        map={showMap ? { home } : undefined}
        empty={
          <div className="text-center py-20 bg-white rounded-2xl border border-ink/10">
            <div className="font-display text-3xl font-light mb-3">Our founding caregivers are being vetted now.</div>
            <p className="text-ink/60 mb-6 max-w-md mx-auto">
              Every caregiver completes a real interview before they appear here. The first profiles are coming soon.
            </p>
          </div>
        }
      />

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
                {selected.credential && CRED_LABEL[selected.credential] ? CRED_LABEL[selected.credential] : 'Caregiver'}
                {selected.experience_hours ? ` · ${hoursLabel(selected.experience_hours)} hands-on` : ''}
                {selected.service_zip ? ` · near ${selected.service_zip}` : ''}
                {selected.distance_mi != null ? ` · ~${selected.distance_mi} mi from you` : ''}
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

              {serviceNames(selected).length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-2">Care they offer</div>
                  <div className="flex flex-wrap gap-1.5">
                    {serviceNames(selected).map((l) => (
                      <span key={l} className="bg-white border border-ink/15 px-2.5 py-1 rounded-full text-xs">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.languages && selected.languages.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-2">Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.languages.map(normalizeLanguage).map((l) => (
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
