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

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  const supabase = await createClient();
  const [{ data }, {
    data: { user },
  }] = await Promise.all([supabase.rpc('browse_caregivers'), supabase.auth.getUser()]);

  const caregivers = (data ?? []) as Caregiver[];

  let viewer: Viewer = 'anon';
  if (user) {
    const access = await getMyAccess(supabase);
    if (access?.role === 'admin') viewer = 'admin';
    else if (access?.role === 'cna') viewer = 'caregiver';
    else viewer = access?.is_member ? 'family_member' : 'family';
  }

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
            near Gainesville, FL
          </h1>
          <p className="hidden md:block text-ink/70 mt-2 max-w-2xl">
            Every caregiver here meets the{' '}
            <Link href="/kindred-standard" className="underline decoration-sage underline-offset-4">Kindred Standard</Link>: a
            personal interview, 1,500+ hours of hands-on experience, a Level 2 background check, a
            verified ID and their own liability insurance. Compare freely. Talk to them before you
            choose, then hire them directly.
          </p>
        </section>

        <BrowseClient caregivers={caregivers} viewer={viewer} />
      </main>
      <SiteFooter />
    </div>
  );
}
