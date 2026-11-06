/**
 * /cna/profile — caregiver's public profile editor. Ported from
 * CNA-Portal/profile.html.
 *
 * Today's scope (per "real data only"): render the profile in the mock's exact
 * shape, populated with the caregiver's REAL data (name, bio, rate, languages,
 * license, bg check, tier). Editing/saving is stubbed for a follow-up session —
 * fields show real values but the Save action is not yet wired. Reviews show an
 * empty state until the reviews system is connected.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

export default async function CnaProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const fullName = profile?.display_name
    ? `${profile.display_name} ${profile.last_name ?? ''}`.trim()
    : me?.full_name ?? 'Caregiver';
  const publicName = profile?.display_name
    ? `${profile.display_name} ${(profile.last_name ?? '').charAt(0)}.`.trim()
    : fullName;

  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);
  const rateText = profile?.hourly_rate_cents ? formatCents(profile.hourly_rate_cents, { showFraction: false }) : null;
  const languages: string[] = profile?.languages ?? [];

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-8 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Your public profile</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            How <span className="italic font-medium text-gradient">families see you.</span>
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            A great profile means more job invites. Keep it current so the right families find you.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-ink/15 px-4 py-2.5 text-sm rounded-full hover:bg-mist transition">
            👁️ Preview as client
          </button>
          <button className="bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition">
            ✓ Save changes
          </button>
        </div>
      </section>

      {/* TOP PROFILE PREVIEW CARD */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-ink/10 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-deepteal via-teal to-sky h-32 relative grain" />
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex items-end gap-6 flex-wrap">
              <div className={`w-32 h-32 rounded-3xl ${avClass} ring-4 ring-cream flex items-center justify-center text-cream font-display text-5xl font-medium shadow-xl`}>
                {userInitials}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink/50">Caregiver</div>
                  {profile?.tier === 'verified' && (
                    <span className="text-[10px] bg-sage/20 text-deepteal px-2 py-0.5 rounded-full font-medium">Verified</span>
                  )}
                  {profile?.tier === 'top_rated' && (
                    <span className="text-[10px] bg-coral/20 text-coral px-2 py-0.5 rounded-full font-medium">Top-Rated</span>
                  )}
                  {profile?.bg_check_status === 'clear' && (
                    <span className="text-[10px] bg-mist text-deepteal px-2 py-0.5 rounded-full font-medium">L2 BG check</span>
                  )}
                  {profile?.license_verified_at && (
                    <span className="text-[10px] bg-mist text-deepteal px-2 py-0.5 rounded-full font-medium">License verified</span>
                  )}
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-medium">{publicName}</h2>
                <div className="text-ink/70 text-sm mt-1.5 flex flex-wrap items-center gap-2">
                  {profile?.rating_avg != null && profile?.rating_count ? (
                    <>
                      <span className="text-coral">★ {Number(profile.rating_avg).toFixed(1)}</span>
                      <span>({profile.rating_count} reviews)</span>
                      <span className="opacity-40">·</span>
                    </>
                  ) : (
                    <>
                      <span className="text-ink/50">No reviews yet</span>
                      <span className="opacity-40">·</span>
                    </>
                  )}
                  {profile?.years_experience != null && (
                    <>
                      <span>{profile.years_experience} years experience</span>
                      <span className="opacity-40">·</span>
                    </>
                  )}
                  {rateText && <span className="font-mono">{rateText}/hr</span>}
                </div>
              </div>
              <div className="text-right pb-2">
                <div className="text-xs text-ink/50 font-mono mb-1">Profile views</div>
                <div className="font-display text-2xl font-medium">—</div>
                <div className="text-[10px] text-ink/50">last 30 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDITABLE SECTIONS */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* BIO */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.15s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Tell families about yourself</div>
                <h3 className="font-display text-xl font-medium">Your story</h3>
              </div>
            </div>
            <textarea
              rows={6}
              defaultValue={profile?.bio ?? ''}
              placeholder="Tell families why you do this work…"
              className="w-full px-4 py-3 border border-ink/15 rounded-xl text-base focus:outline-none focus:border-teal leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-ink/50">Tip: families respond strongly to "why you do this work."</span>
              <span className="font-mono text-ink/40">{(profile?.bio ?? '').length} / 800 chars</span>
            </div>
          </div>

          {/* HEADLINE */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.18s' }}>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">One-line headline</div>
            <h3 className="font-display text-xl font-medium mb-3">How you describe yourself</h3>
            <input
              type="text"
              defaultValue={profile?.headline ?? ''}
              placeholder="e.g. Bilingual dementia & post-surgical care specialist"
              className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal"
            />
          </div>

          {/* RATE */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.25s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your pay</div>
                <h3 className="font-display text-xl font-medium">Hourly rate</h3>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-ink/70 mb-1.5 block">Standard rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                  <input
                    type="number"
                    defaultValue={profile?.hourly_rate_cents ? Math.round(profile.hourly_rate_cents / 100) : ''}
                    className="w-full pl-8 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm font-mono focus:outline-none focus:border-teal"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70 mb-1.5 block">Overnight rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                  <input type="number" placeholder="—" className="w-full pl-8 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm font-mono focus:outline-none focus:border-teal" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70 mb-1.5 block">Weekend / holiday</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                  <input type="number" placeholder="—" className="w-full pl-8 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm font-mono focus:outline-none focus:border-teal" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* REVIEWS — empty state (no reviews wired yet) */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.3s' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">What families say</div>
                <h3 className="font-display text-xl font-medium">
                  Reviews {profile?.rating_count ? `(${profile.rating_count})` : ''}
                </h3>
              </div>
              {profile?.rating_avg != null && profile?.rating_count ? (
                <div className="text-right">
                  <div className="text-coral font-display text-2xl font-medium">★ {Number(profile.rating_avg).toFixed(1)}</div>
                </div>
              ) : null}
            </div>
            <div className="bg-mist/30 border border-dashed border-ink/15 rounded-xl p-8 text-center">
              <p className="text-sm text-ink/60">
                Reviews from families you've worked with will appear here once the review system is live.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* BADGES — real verification data */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.15s' }}>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Trust badges</div>
            <h3 className="font-display text-xl font-medium mb-4">Verifications</h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${profile?.license_verified_at ? 'bg-sage/10 border-sage/30' : 'bg-mist/50 border-ink/10 opacity-70'}`}>
                <div className="text-xl">🏅</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">CNA license</div>
                  <div className="text-[10px] text-ink/60 font-mono">
                    {profile?.license_number ? `FL #${profile.license_number}` : 'Not added'}
                    {profile?.license_verified_at ? ' · Active' : ''}
                  </div>
                </div>
                <span className={profile?.license_verified_at ? 'text-sage' : 'text-ink/30'}>
                  {profile?.license_verified_at ? '✓' : '—'}
                </span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl border ${profile?.bg_check_status === 'clear' ? 'bg-sage/10 border-sage/30' : 'bg-mist/50 border-ink/10 opacity-70'}`}>
                <div className="text-xl">🛡️</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">L2 background check</div>
                  <div className="text-[10px] text-ink/60 font-mono">
                    {profile?.bg_check_status === 'clear' ? 'Cleared' : 'Not complete'}
                  </div>
                </div>
                <span className={profile?.bg_check_status === 'clear' ? 'text-sage' : 'text-ink/30'}>
                  {profile?.bg_check_status === 'clear' ? '✓' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* LANGUAGES — real data */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.2s' }}>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Languages</div>
            <h3 className="font-display text-lg font-medium mb-3">Languages spoken</h3>
            {languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span key={lang} className="text-xs bg-mist px-3 py-1.5 rounded-full border border-teal/20">
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <button className="w-full bg-cream border border-ink/15 py-2.5 rounded-full text-sm hover:bg-mist transition">
                + Add languages
              </button>
            )}
          </div>

          {/* INSURANCE STATUS */}
          <div className="bg-gradient-to-br from-butter/25 to-coral/10 border border-coral/20 rounded-2xl p-6 fade-up" style={{ animationDelay: '.3s' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <div className="font-display text-lg font-medium">Insurance status</div>
                <div className="text-xs text-ink/60">Not yet enrolled</div>
              </div>
            </div>
            <p className="text-xs text-ink/70 leading-relaxed mb-4">
              Adding insurance shows clients you take this seriously — and policies are affordable
              through our partner.
            </p>
            <Link
              href="/cna/get-insured"
              className="block bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition"
            >
              Get insured →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
