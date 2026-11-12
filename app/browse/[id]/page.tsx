/**
 * /browse/[id] — a caregiver's full profile, for anyone browsing.
 * Same redaction as Browse (browse_caregiver): non-member families and
 * visitors see a first initial and no photo. Signed-in families are sent to
 * the same page inside their portal.
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CaregiverProfile } from '@/components/CaregiverProfile';
import type { CaregiverRow } from '@/lib/listConfigs';
import { getMyAccess } from '@/lib/membership';
import { zipPoint, milesBetween } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export default async function PublicCaregiverPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ near?: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const near = ((await searchParams).near ?? '').trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const access = await getMyAccess(supabase);
    role = access?.role ?? null;
    if (role === 'client') redirect(`/client/caregivers/${id}`);
  }

  const { data } = await supabase.rpc('browse_caregiver', { target: id });
  const row = (data ?? [])[0] as CaregiverRow | undefined;
  if (!row) notFound();

  const home = zipPoint(/^\d{5}$/.test(near) ? near : null);
  const c: CaregiverRow = { ...row, distance_mi: milesBetween(home, zipPoint(row.service_zip)) };
  const back = near ? `/browse?near=${near}` : '/browse';

  const btn = 'px-5 py-2.5 rounded-full text-sm transition';
  const actions =
    role === 'cna' ? (
      <span className="text-xs text-ink/50">You&apos;re signed in as a caregiver.</span>
    ) : role === 'admin' ? (
      <span className="text-xs text-ink/50">Admin view</span>
    ) : (
      <>
        <Link href={`/login?next=/client/caregivers/${id}`} className={`${btn} border border-ink/20 hover:bg-ink hover:text-cream`}>
          Log in
        </Link>
        <Link href="/signup?role=client" className={`${btn} bg-deepteal text-cream font-medium hover:bg-inkdark`}>
          Join to message
        </Link>
      </>
    );

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="px-4 sm:px-6 py-6 lg:py-10">
        <CaregiverProfile
          c={c}
          actions={actions}
          backHref={back}
          lockedCta={
            <>
              🔒 To protect caregivers, full names, photos and messaging open once you&apos;re a member family. Everything
              else on this page is real.{' '}
              <Link href="/pricing" className="text-deepteal underline underline-offset-4">See membership</Link>
            </>
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
