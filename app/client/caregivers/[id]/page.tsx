/**
 * /client/caregivers/[id] — a caregiver's full profile inside the family
 * portal: message (members), save ♡ (everyone), distance from the family's
 * ZIP. Same redaction as Browse (browse_caregiver).
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CaregiverProfile } from '@/components/CaregiverProfile';
import { StartMessageModal } from '@/components/client/StartMessageModal';
import { SaveCaregiverButton } from '@/components/client/SaveCaregiverButton';
import type { CaregiverRow } from '@/lib/listConfigs';
import { getMyAccess, getAccessFor } from '@/lib/membership';
import { getViewer } from '@/lib/viewer';
import { zipPoint, milesBetween } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export default async function FamilyCaregiverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect(`/login?next=/client/caregivers/${id}`);

  const [{ data }, access, { data: cp }, { data: saved }] = await Promise.all([
    supabase.rpc('browse_caregiver', { target: id }),
    viewingAs ? getAccessFor(supabase, user.id) : getMyAccess(supabase),
    supabase.from('client_profiles').select('zip').eq('user_id', user.id).maybeSingle(),
    supabase.rpc('my_saved_caregivers'),
  ]);
  const row = (data ?? [])[0] as CaregiverRow | undefined;
  if (!row) notFound();

  const home = zipPoint(cp?.zip ?? null);
  const c: CaregiverRow = { ...row, distance_mi: milesBetween(home, zipPoint(row.service_zip)) };
  const isMember = access?.is_member ?? false;
  const isSaved = ((saved ?? []) as string[]).includes(id);
  const fullName = c.identity_unlocked
    ? `${c.display_name ?? 'Caregiver'}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`
    : `${(c.display_name ?? 'K').charAt(0).toUpperCase()}.`;

  const actions = (
    <>
      <SaveCaregiverButton shownId={id} initiallySaved={isSaved} withLabel />
      {isMember || c.identity_unlocked ? (
        <StartMessageModal
          cnaId={c.user_id}
          cnaName={fullName}
          cnaSubtitle={c.hourly_rate_cents ? `$${Math.round(c.hourly_rate_cents / 100)}/hr` : undefined}
          startedVia="browse"
          buttonClassName="h-11 px-6 rounded-full bg-deepteal text-cream text-sm font-medium hover:bg-inkdark transition"
          buttonLabel="Message"
        />
      ) : (
        <Link href="/client/membership" className="h-11 px-6 inline-flex items-center rounded-full bg-deepteal text-cream text-sm font-medium hover:bg-inkdark transition">
          🔒 Unlock to message
        </Link>
      )}
    </>
  );

  return (
    <main className="px-4 sm:px-6 pt-5 lg:pt-10 pb-16">
      <CaregiverProfile
        c={c}
        actions={actions}
        backHref="/client/browse"
        backLabel="Back to Find care"
        lockedCta={
          <>
            🔒 Names, photos and messaging open with a membership. Everything else here is real.{' '}
            <Link href="/client/membership" className="text-deepteal underline underline-offset-4">Unlock</Link>
          </>
        }
      />
    </main>
  );
}
