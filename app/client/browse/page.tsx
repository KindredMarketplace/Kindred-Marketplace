/**
 * /client/browse — browse caregivers. Ported from Client-Portal/browse.html.
 * Shell lives in app/client/layout.tsx.
 *
 * Real-data-only: caregiver cards are real cna_profiles (with their service
 * tags from cna_services → service_taxonomy). The sidebar filter controls are
 * rendered for visual parity but are not yet wired to the query (a later pass
 * will hook them up). The result count is the real count of returned CNAs.
 *
 * Note on routing: the Page Map reserves a PUBLIC /browse for logged-out
 * visitors. This page is the LOGGED-IN client experience that inherits the
 * family portal shell, matching the mock. The public version is a later build.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { BrowseFilterChips } from '@/components/client/BrowseFilterChips';
import { StartMessageModal } from '@/components/client/StartMessageModal';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';


export default async function ClientBrowsePage() {
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  const profileRes = await supabase.from('client_profiles').select('zip').eq('user_id', user.id).maybeSingle();
  const clientZip = profileRes.data?.zip ?? null;

  // Locked preview (Nov 2026): rows come from browse_caregivers(), which only
  // returns LISTED caregivers (Kindred Standard + membership) and withholds
  // names/photos unless this family is a member or already connected.
  const [{ data: rows }, access] = await Promise.all([
    supabase.rpc('browse_caregivers'),
    viewingAs && user ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
  ]);
  const caregivers = rows ?? [];
  const isMember = access?.is_member ?? false;
  const servicesByCna = new Map<string, string[]>(caregivers.map((c) => [c.user_id, c.services ?? []]));

  // Who is this client currently working with (to badge "Currently hired").
  const { data: bookings } = await supabase
    .from('bookings')
    .select('cna_id, status')
    .eq('client_id', user.id)
    .in('status', ['active', 'scheduled']);
  const hiredCnaIds = new Set((bookings ?? []).map((b) => b.cna_id));

  return (
    <>
      {/* BROWSE HEADER */}
      <section className="max-w-kindred mx-auto px-6 pt-10 pb-6 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Search &amp; discover</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Find <span className="italic font-medium text-gradient">the right caregiver</span> for your family.
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          {caregivers.length > 0
            ? `Caregivers who meet the Kindred Standard${clientZip ? `, near ${clientZip}` : ''}. Talk to a few before you choose.`
            : 'As caregivers join Kindred in your area, they\u2019ll appear here.'}
        </p>

        {/* Search bar */}
        <div className="mt-6 bg-white border border-ink/15 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-sm">
          <input
            type="text"
            placeholder="Try 'overnight dementia care' or 'bilingual'"
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
          <div className="hidden md:block w-px bg-ink/10" />
          <input
            type="text"
            placeholder="📍 ZIP or city"
            defaultValue={clientZip ?? ''}
            className="md:w-40 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
          <button className="bg-deepteal text-cream px-6 py-3 rounded-xl md:rounded-full text-sm font-medium hover:bg-inkdark transition">
            Search
          </button>
        </div>

        <BrowseFilterChips />

        {!isMember && (
          <div className="mt-6 bg-gradient-to-br from-mist/70 to-creamdark/70 border border-ink/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <div className="font-display text-lg font-medium">You&apos;re browsing the preview.</div>
              <p className="text-sm text-ink/70 mt-1 max-w-xl">
                Everything below is real. Names, photos and messaging open up with a Kindred membership,
                which protects caregivers&apos; privacy until someone is serious about hiring.
              </p>
            </div>
            <Link href="/client/membership" className="shrink-0 bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition text-center">
              Unlock with membership →
            </Link>
          </div>
        )}
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-kindred mx-auto px-6 pb-16 grid lg:grid-cols-12 gap-6">
        {/* SIDEBAR FILTERS (visual parity; not yet wired) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start space-y-6">
          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-medium">Filters</h3>
              <button className="text-xs text-coral hover:underline">Clear all</button>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Serves my address</label>
              <div className="bg-mist/40 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-coral">📍</span>
                  <span className="font-mono">{clientZip ?? 'Set your ZIP'}</span>
                  <Link href="/client/profile" className="ml-auto text-xs text-deepteal hover:text-coral">Change</Link>
                </div>
                <div className="text-xs text-ink/60 mt-2">Showing caregivers whose service area covers your home.</div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Hourly rate</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="$22" className="px-3 py-2 text-sm bg-white border border-ink/15 rounded-lg focus:outline-none focus:border-teal" />
                <input type="text" placeholder="$40" className="px-3 py-2 text-sm bg-white border border-ink/15 rounded-lg focus:outline-none focus:border-teal" />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-2 block">Trust level</label>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-deepteal focus:ring-teal" /> Top-rated</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-deepteal focus:ring-teal" /> Verified</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-deepteal focus:ring-teal" /> New caregivers</label>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4 text-xs text-ink/60 leading-relaxed">
              💡 To change your home location, update your{' '}
              <Link href="/client/profile" className="text-deepteal hover:text-coral underline">profile</Link>.
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink/70">
              <span className="font-medium text-ink">{caregivers.length}</span>{' '}
              {caregivers.length === 1 ? 'caregiver' : 'caregivers'} — sorted by best fit
            </div>
            <select className="text-sm bg-white border border-ink/15 rounded-full px-4 py-2 focus:outline-none focus:border-teal">
              <option>Best fit</option>
              <option>Highest rated</option>
              <option>Lowest price</option>
            </select>
          </div>

          {caregivers.length === 0 ? (
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-display text-xl font-medium mb-1">No caregivers to show yet</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto">
                Our founding caregivers are being vetted now. Each one appears here once they meet the
                Kindred Standard. You can also post what you need and let caregivers come to you.
              </p>
              <Link href="/client/post-job" className="inline-block mt-5 bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                Post a job →
              </Link>
            </div>
          ) : (
            caregivers.map((c) => {
              const fullName = c.identity_unlocked
                ? `${c.display_name ?? 'Caregiver'}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`
                : `${(c.display_name ?? 'K').charAt(0).toUpperCase()}.`;
              const av = avatarClass(c.display_name);
              const tags = servicesByCna.get(c.user_id) ?? [];
              const isHired = hiredCnaIds.has(c.user_id);
              return (
                <div
                  key={c.user_id}
                  className={`card-hover bg-white rounded-2xl p-5 relative border ${isHired ? 'border-teal/30' : 'border-ink/10'}`}
                >
                  {isHired && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-sage to-teal text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl-2xl">
                      Currently hired
                    </div>
                  )}
                  <div className="flex gap-5">
                    <div className={`w-20 h-20 rounded-2xl ${av} flex items-center justify-center text-cream font-display text-3xl font-medium flex-shrink-0`}>
                      {initials(c.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="font-display text-xl font-medium">{fullName}</div>
                          <div className="text-xs text-ink/60 mt-1 font-mono">
                            {c.rating_avg != null && (c.rating_count ?? 0) > 0
                              ? `★ ${Number(c.rating_avg).toFixed(1)} · ${c.rating_count} reviews · `
                              : 'New to Kindred · '}
                            {c.experience_hours ? `${c.experience_hours.toLocaleString('en-US')}+ hrs · ` : ''}
                            Kindred Standard ✓
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-xl font-medium">
                            {c.hourly_rate_cents ? formatCents(c.hourly_rate_cents, { showFraction: false }) : '—'}
                            <span className="text-sm text-ink/50">/hr</span>
                          </div>
                          {c.years_experience != null && (
                            <div className="text-[10px] text-ink/50 font-mono">{c.years_experience} yrs experience</div>
                          )}
                        </div>
                      </div>
                      {c.bio && <p className="text-sm text-ink/75 mt-2 leading-relaxed line-clamp-2">{c.bio}</p>}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">
                              {t}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">
                              + {tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        {isMember || c.identity_unlocked ? (
                        <StartMessageModal
                          cnaId={c.user_id}
                          cnaName={fullName}
                          cnaSubtitle={
                            c.hourly_rate_cents
                              ? `${formatCents(c.hourly_rate_cents, { showFraction: false })}/hr`
                              : undefined
                          }
                          startedVia="browse"
                          buttonClassName="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition"
                          buttonLabel="Message"
                        />
                        ) : (
                          <Link
                            href="/client/membership"
                            className="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition"
                          >
                            🔒 Unlock to message
                          </Link>
                        )}
                        <button className="flex-1 text-xs py-2 border border-ink/15 rounded-full hover:bg-mist transition">View profile</button>
                        <button className="w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-coral hover:text-cream hover:border-coral transition" aria-label="Save">
                          ♡
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
