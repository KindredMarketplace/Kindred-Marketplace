/**
 * /cna/profile — the caregiver's public profile: how families see them, with
 * a working editor (headline, story, rate, area, languages) and trust badges
 * read from what Kindred actually verified (lib/standard.ts).
 * "Preview as a family" opens /cna/profile/preview.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getViewer } from '@/lib/viewer';
import { getStandardStatus, formatExpiry, type DocState } from '@/lib/standard';
import { ProfileEditor } from '@/components/cna/ProfileEditor';
import { normalizeLanguage } from '@/lib/careOptions';
import { AvatarUpload } from '@/components/cna/AvatarUpload';

export const dynamic = 'force-dynamic';

export default async function CnaProfilePage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [userRes, profileRes, servicesRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('cna_services').select('service_key').eq('cna_id', user.id),
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
  const standard = await getStandardStatus(supabase, user.id);
  const badgeOn = (st: DocState) => st === 'verified';

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 py-10 lg:py-14">
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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cna/profile/preview"
            className="bg-white border border-ink/15 px-4 py-2.5 text-sm rounded-full hover:bg-mist transition"
          >
            👁️ Preview as a family
          </Link>
          <button
            type="submit"
            form="profile-form"
            className="bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition"
          >
            ✓ Save changes
          </button>
        </div>
      </section>

      {/* TOP PROFILE CARD */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-ink/10 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-deepteal via-teal to-sky h-24 sm:h-32 relative grain" />
          <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <AvatarUpload userId={user.id} photoUrl={profile?.photo_url ?? null} initials={userInitials} avatarClass={avClass} />
              <div className="flex-1 min-w-0 sm:pb-2">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Caregiver</div>
                <h2 className="font-display text-3xl lg:text-4xl font-medium leading-tight break-words">{publicName}</h2>
                <div className="text-ink/70 text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {profile?.rating_avg != null && profile?.rating_count ? (
                    <span className="text-coral whitespace-nowrap">★ {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count} reviews)</span>
                  ) : (
                    <span className="text-ink/50 whitespace-nowrap">No reviews yet</span>
                  )}
                  {profile?.years_experience != null && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="whitespace-nowrap">{profile.years_experience} years experience</span>
                    </>
                  )}
                  {rateText && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="font-mono whitespace-nowrap">{rateText}/hr</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {(standard.allMet || badgeOn(standard.l2bg.state) || badgeOn(standard.identity.state) || badgeOn(standard.insurance.state)) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {standard.allMet && <Pill strong>✓ Kindred Standard</Pill>}
                {badgeOn(standard.l2bg.state) && <Pill>🛡️ Level 2 background check</Pill>}
                {badgeOn(standard.identity.state) && <Pill>🪪 ID verified</Pill>}
                {badgeOn(standard.insurance.state) && <Pill>📄 Insured</Pill>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EDITABLE SECTIONS */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileEditor
            initial={{
              headline: profile?.headline ?? '',
              bio: profile?.bio ?? '',
              rate: profile?.hourly_rate_cents ? String(Math.round(profile.hourly_rate_cents / 100)) : '',
              languages: languages.map(normalizeLanguage),
              services: (servicesRes.data ?? []).map((r) => r.service_key),
              gender: profile?.gender ?? '',
              age_bracket: profile?.age_bracket ?? '',
              service_zip: profile?.service_zip ?? '',
              service_radius_miles: profile?.service_radius_miles != null ? String(profile.service_radius_miles) : '',
            }}
          />

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
          {/* TRUST BADGES — from what Kindred verified */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6 fade-up" style={{ animationDelay: '.15s' }}>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Trust badges</div>
            <h3 className="font-display text-xl font-medium mb-4">Verified by Kindred</h3>
            <div className="space-y-3">
              <Badge icon="🤝" title="Interviewed by Kindred" detail={standard.interview ? 'Passed' : 'Not yet'} on={standard.interview} />
              <Badge
                icon="⏱️"
                title="1,500+ hours of care"
                detail={standard.hours.confirmed != null ? `${standard.hours.confirmed.toLocaleString('en-US')} hours confirmed` : 'Not confirmed yet'}
                on={standard.hours.met}
              />
              <Badge icon="🛡️" title="Level 2 background check" detail={docDetail(standard.l2bg.state, standard.l2bg.expiresAt)} on={badgeOn(standard.l2bg.state)} />
              <Badge icon="🪪" title="ID verified" detail={docDetail(standard.identity.state, standard.identity.expiresAt)} on={badgeOn(standard.identity.state)} />
              <Badge icon="📄" title="Own liability insurance" detail={docDetail(standard.insurance.state, standard.insurance.expiresAt)} on={badgeOn(standard.insurance.state)} />
            </div>
            {profile?.credential && (
              <p className="mt-4 text-xs text-ink/55">
                Credential you listed: {profile.credential.toUpperCase()}
                {profile.license_number ? ` #${profile.license_number}` : ''}
              </p>
            )}
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
              <p className="text-sm text-ink/55">Add the languages you speak in &ldquo;About you&rdquo;.</p>
            )}
          </div>

          {/* INSURANCE STATUS — from the verified certificate */}
          {standard.insurance.state === 'verified' ? (
            <div className="bg-sage/15 border border-sage/40 rounded-2xl p-6 fade-up" style={{ animationDelay: '.3s' }}>
              <div className="flex items-start gap-3 mb-2">
                <div className="text-2xl">🛡️</div>
                <div>
                  <div className="font-display text-lg font-medium">Insurance verified</div>
                  <div className="text-xs text-ink/60">
                    {standard.insurance.expiresAt ? `Good through ${formatExpiry(standard.insurance.expiresAt)}` : 'On file with Kindred'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed">We&rsquo;ll remind you before it expires so your badge doesn&rsquo;t lapse.</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-butter/25 to-coral/10 border border-coral/20 rounded-2xl p-6 fade-up" style={{ animationDelay: '.3s' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">🛡️</div>
                <div>
                  <div className="font-display text-lg font-medium">Insurance</div>
                  <div className="text-xs text-ink/60">
                    {standard.insurance.state === 'pending'
                      ? 'Your certificate is in review'
                      : standard.insurance.state === 'expired'
                        ? 'Your policy expired'
                        : standard.insurance.state === 'rejected'
                          ? 'We need a new copy'
                          : standard.accepted
                            ? 'Not uploaded yet'
                            : 'Needed after you’re accepted'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed mb-4">
                Your own liability insurance is part of the Kindred Standard. Kindred doesn&rsquo;t sell insurance or
                partner with an insurer; here&rsquo;s where caregivers often start.
              </p>
              <Link
                href="/cna/get-insured"
                className="block bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition"
              >
                Get insured →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function docDetail(state: DocState, expiresAt: string | null): string {
  switch (state) {
    case 'verified':
      return expiresAt ? `Verified · through ${formatExpiry(expiresAt)}` : 'Verified';
    case 'pending':
      return 'In review';
    case 'rejected':
      return 'Needs a new copy';
    case 'expired':
      return 'Expired';
    default:
      return 'Not on file';
  }
}

function Badge({ icon, title, detail, on }: { icon: string; title: string; detail: string; on: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${on ? 'bg-sage/10 border-sage/30' : 'bg-mist/50 border-ink/10 opacity-70'}`}>
      <div className="text-xl" aria-hidden="true">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-[10px] text-ink/60 font-mono">{detail}</div>
      </div>
      <span className={on ? 'text-sage' : 'text-ink/30'} aria-label={on ? 'verified' : 'not verified'}>{on ? '✓' : '—'}</span>
    </div>
  );
}

function Pill({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={`whitespace-nowrap text-xs px-3 py-1 rounded-full font-medium ${
        strong ? 'bg-sage/25 text-deepteal' : 'bg-mist text-deepteal'
      }`}
    >
      {children}
    </span>
  );
}
