/**
 * /client/browse — browse caregivers. Ported from Client-Portal/browse.html.
 * Shell lives in app/client/layout.tsx.
 *
 * Real-data-only: caregiver cards are real cna_profiles (with their service
 * tags from cna_services → service_taxonomy). Results come first, with a
 * map; the full filter set (lib/listConfigs.ts) lives behind one Filters
 * button, every option listed with how many caregivers it would show.
 * Distance is ZIP to ZIP (lib/geo.ts), never an address.
 *
 * Note on routing: the Page Map reserves a PUBLIC /browse for logged-out
 * visitors. This page is the LOGGED-IN client experience that inherits the
 * family portal shell, matching the mock. The public version is a later build.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { FilterableList } from '@/components/FilterableList';
import { caregiverItem, caregiverFilters, caregiverSorts, type CaregiverRow } from '@/lib/listConfigs';
import { CREDENTIALS } from '@/lib/careOptions';
import { zipPoint, milesBetween, pinPoint } from '@/lib/geo';
import { StartMessageModal } from '@/components/client/StartMessageModal';
import { SaveCaregiverButton } from '@/components/client/SaveCaregiverButton';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const CRED_LABEL: Record<string, string> = Object.fromEntries(CREDENTIALS.map((o) => [o.value, o.label]));


export default async function ClientBrowsePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const showSaved = (await searchParams).saved === '1';
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  const profileRes = await supabase.from('client_profiles').select('zip').eq('user_id', user.id).maybeSingle();
  const clientZip = profileRes.data?.zip ?? null;

  // Locked preview (Nov 2026): rows come from browse_caregivers(), which only
  // returns LISTED caregivers (Kindred Standard + membership) and withholds
  // names/photos unless this family is a member or already connected.
  const [{ data: rows }, access, { data: savedIds }] = await Promise.all([
    supabase.rpc('browse_caregivers'),
    viewingAs && user ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
    supabase.rpc('my_saved_caregivers'),
  ]);
  const savedSet = new Set((savedIds ?? []) as string[]);
  const home = zipPoint(clientZip);
  const allRows = (rows ?? []) as CaregiverRow[];
  const savedCount = allRows.filter((c) => savedSet.has(c.user_id)).length;
  const caregivers: CaregiverRow[] = (showSaved ? allRows.filter((c) => savedSet.has(c.user_id)) : allRows).map((c) => ({
    ...c,
    distance_mi: milesBetween(home, zipPoint(c.service_zip)),
    pin_point: pinPoint(c.service_zip, c.user_id),
  }));
  const isMember = access?.is_member ?? false;
  const servicesByCna = new Map<string, string[]>(caregivers.map((c) => [c.user_id, c.services ?? []]));

  // Who is this client currently working with (to badge "Currently hired").
  const { data: bookings } = await supabase
    .from('bookings')
    .select('cna_id, status')
    .eq('client_id', user.id)
    .in('status', ['active', 'scheduled']);
  const hiredCnaIds = new Set((bookings ?? []).map((b) => b.cna_id));

  const items = caregivers.map(caregiverItem);
  const filters = caregiverFilters({
    distanceHint: clientZip ? (
      <>From your ZIP {clientZip}.</>
    ) : (
      <>Add your ZIP in <Link href="/client/setup" className="text-deepteal underline">your care details</Link> to filter by distance.</>
    ),
  });

  const cards: Record<string, React.ReactNode> = {};
  for (const c of caregivers) {
    const fullName = c.identity_unlocked
      ? `${c.display_name ?? 'Caregiver'}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`
      : `${(c.display_name ?? 'K').charAt(0).toUpperCase()}.`;
    const av = avatarClass(c.display_name);
    const tags = servicesByCna.get(c.user_id) ?? [];
    const isHired = hiredCnaIds.has(c.user_id);
    cards[c.user_id] = (
      <div className={`card-hover bg-white rounded-2xl p-5 relative border h-full ${isHired ? 'border-teal/30' : 'border-ink/10'}`}>
        {isHired && (
          <div className="absolute top-0 right-0 bg-gradient-to-br from-sage to-teal text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl-2xl">
            Currently hired
          </div>
        )}
        <div className="flex gap-4">
          {c.identity_unlocked && c.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photo_url} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${av} flex items-center justify-center text-cream font-display text-2xl sm:text-3xl font-medium flex-shrink-0`}>
              {initials(c.display_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/client/caregivers/${c.user_id}`} className="font-display text-xl font-medium hover:text-deepteal">
                  {fullName}
                </Link>
                <div className="text-xs text-ink/60 mt-1 font-mono">
                  {c.rating_avg != null && (c.rating_count ?? 0) > 0
                    ? `★ ${Number(c.rating_avg).toFixed(1)} · ${c.rating_count} reviews · `
                    : 'New to Kindred · '}
                  {c.experience_hours ? `${c.experience_hours.toLocaleString('en-US')}+ hrs · ` : ''}
                  Kindred Standard ✓
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl font-medium whitespace-nowrap">
                  {c.hourly_rate_cents ? formatCents(c.hourly_rate_cents, { showFraction: false }) : '—'}
                  <span className="text-sm text-ink/50">/hr</span>
                </div>
                {c.credential && CRED_LABEL[c.credential] && (
                  <div className="text-[10px] text-ink/50 font-mono">{CRED_LABEL[c.credential]}</div>
                )}
                {c.distance_mi != null && <div className="text-[10px] text-deepteal font-mono">~{c.distance_mi} mi away</div>}
              </div>
            </div>
            {c.bio && <p className="text-sm text-ink/75 mt-2 leading-relaxed line-clamp-2">{c.bio}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">{t}</span>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] bg-mist/70 px-2.5 py-1 rounded-full border border-teal/20">+ {tags.length - 3} more</span>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4 items-center">
              <Link
                href={`/client/caregivers/${c.user_id}`}
                className="flex-1 text-xs py-2 border border-ink/15 rounded-full text-center hover:bg-mist transition"
              >
                View profile
              </Link>
              {isMember || c.identity_unlocked ? (
                <StartMessageModal
                  cnaId={c.user_id}
                  cnaName={fullName}
                  cnaSubtitle={c.hourly_rate_cents ? `${formatCents(c.hourly_rate_cents, { showFraction: false })}/hr` : undefined}
                  startedVia="browse"
                  buttonClassName="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition"
                  buttonLabel="Message"
                />
              ) : (
                <Link href="/client/membership" className="flex-1 text-xs py-2 bg-deepteal text-cream rounded-full text-center hover:bg-inkdark transition">
                  🔒 Unlock to message
                </Link>
              )}
              <SaveCaregiverButton shownId={c.user_id} initiallySaved={savedSet.has(c.user_id)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tab = (on: boolean, coral?: boolean) =>
    `rounded-full px-4 py-2 text-sm border transition ${on ? (coral ? 'bg-coral text-cream border-coral' : 'bg-ink text-cream border-ink') : 'bg-white border-ink/15 hover:bg-mist'}`;

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 pt-5 lg:pt-10 pb-16">
      <h1 className="font-display text-3xl md:text-4xl font-light leading-tight mb-4 fade-up">
        {showSaved ? (
          <>Your <span className="italic font-medium text-gradient">saved caregivers</span></>
        ) : (
          <>Find <span className="italic font-medium text-gradient">care</span></>
        )}
        {clientZip && !showSaved && <span className="text-base text-ink/50 font-sans ml-2">near {clientZip}</span>}
      </h1>

      <FilterableList
        items={items}
        cards={cards}
        filters={filters}
        sorts={caregiverSorts(!!home)}
        map={{ home }}
        searchPlaceholder="Search, e.g. dementia, Spanish"
        noun={['caregiver', 'caregivers']}
        listClassName="grid gap-4 lg:grid-cols-2"
        toolbarExtra={
          <>
            <Link href="/client/browse" className={tab(!showSaved)}>All</Link>
            <Link href="/client/browse?saved=1" className={tab(showSaved, true)}>
              ♥ Saved{savedCount ? ` (${savedCount})` : ''}
            </Link>
          </>
        }
        banner={
          !isMember ? (
            <div className="bg-gradient-to-br from-mist/70 to-creamdark/70 border border-ink/10 rounded-2xl px-4 py-3 flex items-center gap-3 justify-between">
              <p className="text-sm text-ink/75">
                <span className="font-medium text-ink">Preview.</span> Names, photos and messaging open with a membership.
              </p>
              <Link href="/client/membership" className="shrink-0 text-sm text-deepteal font-medium hover:text-coral whitespace-nowrap">
                Unlock →
              </Link>
            </div>
          ) : null
        }
        empty={
          showSaved ? (
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
              <div className="text-3xl mb-3">♡</div>
              <h3 className="font-display text-xl font-medium mb-1">Nothing saved yet</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto">Tap the ♡ on any caregiver to keep them here.</p>
            </div>
          ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
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
          )
        }
      />
    </main>
  );
}
