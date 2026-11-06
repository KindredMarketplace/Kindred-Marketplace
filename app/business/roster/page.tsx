/**
 * /business/roster — the facility's approved/preferred caregivers. Ported from
 * Business-Portal/roster.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: roster cards come from approved_roster joined to
 * cna_profiles for THIS org. Stat strip is computed from the real roster. The
 * tab bar + filter chips render for visual parity (not yet wired). When the
 * roster is empty, an explicit empty state replaces the mock's 14-card grid.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

export default async function BusinessRosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await getBusinessContext();
  if (!ctx?.orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Approved roster</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">Your trusted caregivers.</h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility to start building a roster.</p>
        </div>
      </main>
    );
  }

  // Roster rows for this org, with the CNA profile data.
  const { data: roster } = await supabase
    .from('approved_roster')
    .select('id, cna_id, notes, last_worked_at, created_at')
    .eq('org_id', ctx.orgId)
    .order('last_worked_at', { ascending: false, nullsFirst: false });

  const rosterRows = roster ?? [];
  const cnaIds = rosterRows.map((r) => r.cna_id);

  const cnaMap = new Map<
    string,
    {
      name: string;
      bio: string | null;
      years: number | null;
      rating: number | null;
      ratingCount: number;
      tier: string;
      services: string[];
    }
  >();

  if (cnaIds.length > 0) {
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, bio, years_experience, rating_avg, rating_count, tier')
      .in('user_id', cnaIds);
    (cnas ?? []).forEach((c) =>
      cnaMap.set(c.user_id, {
        name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`,
        bio: c.bio,
        years: c.years_experience,
        rating: c.rating_avg,
        ratingCount: c.rating_count,
        tier: c.tier,
        services: [],
      }),
    );

    // Attach service tags.
    const { data: svc } = await supabase
      .from('cna_services')
      .select('cna_id, service_taxonomy(label)')
      .in('cna_id', cnaIds);
    (svc ?? []).forEach((row: any) => {
      const entry = cnaMap.get(row.cna_id);
      if (entry && row.service_taxonomy?.label) entry.services.push(row.service_taxonomy.label);
    });
  }

  const activeThisMonth = rosterRows.filter((r) => {
    if (!r.last_worked_at) return false;
    const d = new Date(r.last_worked_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12 relative">
      <div className="absolute -top-20 right-0 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Approved roster</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your{' '}
          <span className="italic font-medium text-gradient">
            {rosterRows.length > 0 ? `trusted ${rosterRows.length} caregivers.` : 'trusted caregivers.'}
          </span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Roster CNAs see your shifts first. The more familiar faces on this list, the faster you fill
          — and the happier your residents stay.
        </p>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">On roster</div>
          <div className="font-display text-3xl font-medium mt-1">{rosterRows.length}</div>
          <div className="text-xs text-ink/60 mt-1">{activeThisMonth} active this month</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Roster head start</div>
          <div className="font-display text-3xl font-medium mt-1">1 hr</div>
          <div className="text-xs text-deepteal mt-1">Before shifts open to all</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Avg rating</div>
          <div className="font-display text-3xl font-medium mt-1">
            {(() => {
              const rated = Array.from(cnaMap.values()).filter((c) => c.rating != null);
              if (rated.length === 0) return '—';
              const avg = rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length;
              return `★ ${avg.toFixed(1)}`;
            })()}
          </div>
          <div className="text-xs text-ink/60 mt-1">Across your roster</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Active this month</div>
          <div className="font-display text-3xl font-medium mt-1">{activeThisMonth}</div>
          <div className="text-xs text-ink/60 mt-1">Worked a shift here</div>
        </div>
      </section>

      {/* TABS (visual parity) */}
      <section className="mb-6 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="flex items-center gap-6 border-b border-ink/10">
          <button className="py-3 text-sm tab-active border-b-2">
            On roster <span className="text-ink/40 ml-1">{rosterRows.length}</span>
          </button>
          <button className="py-3 text-sm text-ink/50 border-b-2 border-transparent" disabled>Recently worked</button>
          <button className="py-3 text-sm text-ink/50 border-b-2 border-transparent" disabled>Removed</button>
        </div>
      </section>

      {/* FILTERS (visual parity) */}
      <section className="mb-6 flex flex-wrap items-center gap-3 fade-up" style={{ animationDelay: '.12s' }}>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            placeholder="Search by name, license, certs…"
            className="w-full pl-10 pr-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="filter-chip active border border-ink/15 px-3 py-1.5 rounded-full text-xs font-medium">All</button>
          <button className="filter-chip bg-white border border-ink/15 px-3 py-1.5 rounded-full text-xs hover:bg-mist">Dementia cert</button>
          <button className="filter-chip bg-white border border-ink/15 px-3 py-1.5 rounded-full text-xs hover:bg-mist">NOC available</button>
          <button className="filter-chip bg-white border border-ink/15 px-3 py-1.5 rounded-full text-xs hover:bg-mist">Bilingual</button>
        </div>
      </section>

      {/* ROSTER GRID */}
      {rosterRows.length > 0 ? (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          {rosterRows.map((r) => {
            const c = cnaMap.get(r.cna_id);
            const name = c?.name ?? 'Caregiver';
            const av = avatarClass(name);
            const lastWorked = r.last_worked_at
              ? new Date(r.last_worked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : null;
            return (
              <div key={r.id} className="card-hover bg-white border border-ink/10 rounded-2xl p-5 relative">
                {c?.tier === 'top_rated' && (
                  <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono bg-sage/15 text-deepteal border border-sage/30">
                    ★ Top performer
                  </span>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-full ${av} flex items-center justify-center text-cream font-display text-lg font-medium flex-shrink-0`}>
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="font-display text-lg font-medium leading-tight">{name}</div>
                    <div className="text-xs text-ink/60 font-mono">
                      CNA{c?.years != null ? ` · ${c.years} yrs exp` : ''}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-mist/40 rounded-lg py-2">
                    <div className="text-base font-medium font-display">{c?.rating != null ? `★ ${Number(c.rating).toFixed(1)}` : '—'}</div>
                    <div className="text-[10px] text-ink/50 font-mono">RATING</div>
                  </div>
                  <div className="bg-mist/40 rounded-lg py-2">
                    <div className="text-base font-medium font-display">{c?.ratingCount ?? 0}</div>
                    <div className="text-[10px] text-ink/50 font-mono">REVIEWS</div>
                  </div>
                  <div className="bg-mist/40 rounded-lg py-2">
                    <div className="text-base font-medium font-display">{lastWorked ?? '—'}</div>
                    <div className="text-[10px] text-ink/50 font-mono">LAST SHIFT</div>
                  </div>
                </div>
                {c && c.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.services.slice(0, 4).map((s) => (
                      <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono bg-deepteal/10 text-deepteal">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {r.notes && <div className="text-xs text-ink/60 mb-3 italic">{r.notes}</div>}
                <div className="flex gap-2">
                  <Link href="/business/post-shifts" className="flex-1 text-xs px-3 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition text-center">
                    Offer next shift
                  </Link>
                  <Link href="/business/messages" className="text-xs px-3 py-2 border border-ink/15 rounded-full hover:bg-mist transition">💬</Link>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
          <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-12 text-center">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-display text-xl font-medium mb-1">No one on your roster yet</h3>
            <p className="text-sm text-ink/60 max-w-md mx-auto mb-5">
              As caregivers complete shifts at your facility, save the ones you'd want back. Roster
              CNAs see your shifts an hour before everyone else — the fastest way to fill reliably.
            </p>
            <Link href="/business/post-shifts" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Post your first shift →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
