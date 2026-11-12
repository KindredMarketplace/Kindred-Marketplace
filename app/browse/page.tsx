/**
 * /browse — public caregiver search. Ported 1:1 from Front-End/Homepage/find-care.html.
 *
 * LOCKED PREVIEW. Anyone can browse without an account (no Care.com email
 * wall). Rows come from public.browse_caregivers(), which:
 *   - only returns caregivers who are LISTED (meet the Kindred Standard + member)
 *   - withholds full name / last name / photo unless the viewer is a member family
 * Honest empty state when there are none. No fabricated ratings/distances.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BrowseClient, type Caregiver, type Viewer } from './BrowseClient';
import { getMyAccess } from '@/lib/membership';
import { zipPoint, milesBetween, pinPoint } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ near?: string }> }) {
  const nearParam = ((await searchParams).near ?? '').trim();
  const supabase = await createClient();
  const [{ data }, {
    data: { user },
  }] = await Promise.all([supabase.rpc('browse_caregivers'), supabase.auth.getUser()]);

  let viewer: Viewer = 'anon';
  if (user) {
    const access = await getMyAccess(supabase);
    if (access?.role === 'admin') viewer = 'admin';
    else if (access?.role === 'cna') viewer = 'caregiver';
    else viewer = access?.is_member ? 'family_member' : 'family';
  }

  // Distance and the map are measured from a ZIP: the one typed here, or a
  // signed-in family's own. ZIP areas only, never an address.
  let nearZip = /^\d{5}$/.test(nearParam) ? nearParam : null;
  if (!nearZip && (viewer === 'family' || viewer === 'family_member') && user) {
    const { data: cp } = await supabase.from('client_profiles').select('zip').eq('user_id', user.id).maybeSingle();
    nearZip = cp?.zip && zipPoint(cp.zip) ? cp.zip : null;
  }
  const home = zipPoint(nearZip);
  const caregivers: Caregiver[] = ((data ?? []) as Caregiver[]).map((c) => ({
    ...c,
    distance_mi: milesBetween(home, zipPoint(c.service_zip)),
    pin_point: pinPoint(c.service_zip, c.user_id),
  }));

  const distanceHint = (
    <form action="/browse" method="get" className="flex items-center gap-2 mt-1">
      <label htmlFor="near" className="shrink-0">From ZIP</label>
      <input
        id="near"
        name="near"
        inputMode="numeric"
        maxLength={5}
        pattern="\d{5}"
        defaultValue={nearZip ?? ''}
        placeholder="32601"
        className="w-24 rounded-full border border-ink/15 bg-white px-3 py-1.5 font-mono text-sm text-ink focus:outline-none focus:border-teal"
      />
      <button type="submit" className="rounded-full bg-deepteal px-3 py-1.5 text-cream">Set</button>
      {nearParam && !home && <span className="text-coral">We don&apos;t know that ZIP.</span>}
    </form>
  );

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 lg:py-12">
        <section className="mb-5 lg:mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
            Browse caregivers
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-light leading-tight">
            <span className="italic font-medium text-gradient">
              {caregivers.length} {caregivers.length === 1 ? 'caregiver' : 'caregivers'}
            </span>{' '}
            {nearZip ? `near ${nearZip}` : 'near Gainesville, FL'}
          </h1>
          <p className="hidden md:block text-ink/70 mt-2 max-w-2xl">
            Every caregiver here meets the{' '}
            <Link href="/kindred-standard" className="underline decoration-sage underline-offset-4">Kindred Standard</Link>: a
            personal interview, 1,500+ hours of hands-on experience, a Level 2 background check, a
            verified ID and their own liability insurance. Compare freely. Talk to them before you
            choose, then hire them directly.
          </p>
        </section>

        <BrowseClient
          caregivers={caregivers}
          viewer={viewer}
          home={home}
          distanceHint={distanceHint}
          profileBase="/browse/"
          profileSuffix={nearZip && nearParam ? `?near=${nearZip}` : ''}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
