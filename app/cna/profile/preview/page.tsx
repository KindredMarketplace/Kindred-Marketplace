/**
 * /cna/profile/preview — "Preview as a family".
 *
 * Renders the caregiver's own card through the same Browse component families
 * use, in the two ways families can see it:
 *   - ?as=visitor  (default) a visitor or non-member family: first initial,
 *                  names / emails / phones masked in the headline and story,
 *                  the same way the database masks them in browse_caregivers
 *   - ?as=member   a member family: full name and story
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { pinPoint } from '@/lib/geo';
import { getViewer } from '@/lib/viewer';
import { BrowseClient, type Caregiver } from '@/app/browse/BrowseClient';
import { getStandardStatus } from '@/lib/standard';

export const dynamic = 'force-dynamic';

/** Mirror of kindred_internal.mask_names() for the preview. */
function maskNames(body: string | null, first: string | null, last: string | null): string | null {
  if (!body) return body;
  let out = body
    .replace(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email hidden]')
    .replace(/(\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g, '[phone hidden]');
  const tokens = `${first ?? ''} ${last ?? ''}`.split(/[^\p{L}']+/u).filter((t) => t.length >= 2);
  for (const tok of tokens) {
    const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const initial = `${tok[0].toUpperCase()}.`;
    out = out.replace(new RegExp(`\\b${esc}\\b`, 'gi'), initial);
    if (tok.length >= 4) out = out.replace(new RegExp(esc, 'gi'), initial);
  }
  return out;
}

export default async function ProfilePreviewPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const asMember = (await searchParams).as === 'member';
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [{ data: p }, { data: services }, { data: avail }, standard] = await Promise.all([
    supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, photo_url, headline, bio, hourly_rate_cents, years_experience, experience_hours, service_zip, service_radius_miles, languages, gender, availability_status, credential, age_bracket, rating_avg, rating_count')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('cna_services').select('service_key').eq('cna_id', user.id),
    supabase.from('cna_availability').select('day_of_week, start_time, end_time').eq('cna_id', user.id).eq('is_active', true),
    getStandardStatus(supabase, user.id),
  ]);
  if (!p) redirect('/cna/profile');

  const keys = (services ?? []).map((s) => s.service_key);
  const { data: labels } = keys.length
    ? await supabase.from('service_taxonomy').select('key, label').in('key', keys)
    : { data: [] as { key: string; label: string }[] };
  const labelBy = new Map((labels ?? []).map((l) => [l.key, l.label]));

  const me: Caregiver = {
    user_id: p.user_id,
    display_name: asMember ? p.display_name : (p.display_name ?? '').charAt(0) || null,
    last_name: asMember ? p.last_name : null,
    photo_url: asMember ? p.photo_url : null,
    headline: asMember ? p.headline : maskNames(p.headline, p.display_name, p.last_name),
    bio: asMember ? p.bio : maskNames(p.bio, p.display_name, p.last_name),
    hourly_rate_cents: p.hourly_rate_cents,
    years_experience: p.years_experience,
    experience_hours: p.experience_hours,
    service_zip: p.service_zip,
    languages: p.languages,
    gender: p.gender,
    availability_status: p.availability_status,
    services: keys.map((k) => labelBy.get(k) ?? k.replace(/_/g, ' ')),
    identity_unlocked: asMember,
    service_keys: keys,
    credential: p.credential,
    age_bracket: p.age_bracket,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    service_radius_miles: p.service_radius_miles,
    availability: (avail ?? []).map((a) => ({ d: a.day_of_week, s: a.start_time, e: a.end_time })),
    pin_point: pinPoint(p.service_zip, p.user_id),
  };

  const tab = (on: boolean) =>
    `rounded-full px-4 py-2 text-sm border transition ${on ? 'bg-ink text-cream border-ink' : 'bg-white border-ink/15 hover:bg-mist'}`;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <Link href="/cna/profile" className="text-xs text-ink/60 hover:text-coral inline-block mb-4">
        ← Back to editing your profile
      </Link>
      <div className="mb-6 rounded-2xl border border-teal/30 bg-mist/50 p-5">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Preview</div>
        <h1 className="font-display text-3xl font-medium mb-2">This is how families see you in Browse.</h1>
        <p className="text-sm text-ink/70 max-w-2xl mb-4">
          Families who haven&rsquo;t joined see your first initial, with names, emails and phone numbers hidden in your
          headline and story. Member families see your full profile. Tap your card to open it.
          {!standard.allMet && (
            <>
              {' '}
              <strong>You&rsquo;re not showing in Browse yet:</strong> that starts once your Kindred Standard is complete.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/cna/profile/preview" className={tab(!asMember)}>
            A family browsing
          </Link>
          <Link href="/cna/profile/preview?as=member" className={tab(asMember)}>
            A member family
          </Link>
        </div>
      </div>
      <BrowseClient caregivers={[me]} viewer={asMember ? 'family_member' : 'family'} />
    </main>
  );
}
