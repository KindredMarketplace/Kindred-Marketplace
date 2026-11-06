/**
 * /browse — public caregiver search. Ported 1:1 from Front-End/Homepage/find-care.html.
 *
 * Anyone can browse without an account (the Care.com wall is the thing we're
 * deliberately NOT doing). You only need to log in to message or book — that
 * gate lives in the profile modal (BrowseClient).
 *
 * Real data: only approved caregivers appear, via the public RLS select policy.
 * Honest empty state when there are none. No fabricated ratings/distances.
 */

import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BrowseClient, type Caregiver } from './BrowseClient';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cna_profiles')
    .select(
      'user_id, display_name, last_name, headline, bio, hourly_rate_cents, years_experience, service_zip, languages, gender, availability_status',
    )
    .eq('application_status', 'approved');

  const caregivers = (data ?? []) as Caregiver[];

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
            Browse caregivers
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            <span className="italic font-medium text-gradient">
              {caregivers.length} {caregivers.length === 1 ? 'caregiver' : 'caregivers'}
            </span>{' '}
            near Gainesville, FL
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            Every caregiver here passed a real human interview and full verification — Level 2
            background check, current CPR, and an active FL CNA license. Browse, compare, message —
            book direct, no agency in between.
          </p>
        </section>

        <BrowseClient caregivers={caregivers} />
      </main>
      <SiteFooter />
    </div>
  );
}
