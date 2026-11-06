/**
 * Business portal layout — shared shell for every /business/* page.
 *
 * Renders the utility bar (facility name + status + profile menu), main nav,
 * and footer from the mock, wired to the logged-in facility user's real data.
 * Each page provides its own <main> content as {children}.
 *
 * Data resolution: user → organization_members → organizations gives us the
 * facility and the member's role. Real-data-only (per the porting policy): the
 * facility name/status line only renders real org data; if the user isn't yet
 * linked to an org, we show a neutral "setup pending" line rather than the
 * mock's "Magnolia Springs" filler.
 *
 * Server component so it can read the session + DB. Active-route highlighting
 * lives in <BusinessNavLinks/>; the profile dropdown is <BusinessProfileMenu/>.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';
import { KindredMark } from '@/components/KindredMark';
import { SiteFooter } from '@/components/SiteFooter';
import { BusinessNavLinks } from '@/components/business/BusinessNavLinks';
import { BusinessProfileMenu } from '@/components/business/BusinessProfileMenu';
import { initials, avatarClass } from '@/lib/utils/avatar';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  scheduler: 'Scheduler',
  hr: 'HR',
  billing: 'Billing',
  supervisor: 'Supervisor',
};

const ORG_TYPE_LABEL: Record<string, string> = {
  alf: 'Assisted Living',
  memory_care: 'Memory Care',
  snf: 'Skilled Nursing',
  hha: 'Home Health Agency',
  hospital: 'Hospital',
  hospice: 'Hospice',
  independent_living: 'Independent Living',
  adult_day: 'Adult Day Program',
  other: 'Facility',
};

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('users').select('full_name, email').eq('id', user.id).single();

  // Resolve the user's organization + their role within it.
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role, org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let org:
    | { name: string; type: string; city: string | null; state: string | null; capacity: number | null; status: string; specialty: string | null }
    | null = null;
  if (membership?.org_id) {
    const { data } = await supabase
      .from('organizations')
      .select('name, type, city, state, capacity, status, specialty')
      .eq('id', membership.org_id)
      .maybeSingle();
    org = data;
  }

  const fullName = me?.full_name || 'there';
  const firstName = fullName.split(' ')[0];
  const email = me?.email ?? '';
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);
  const roleLabel = membership?.role ? ROLE_LABEL[membership.role] ?? membership.role : '';

  // Facility status line — real org data only.
  const orgTypeLabel = org ? ORG_TYPE_LABEL[org.type] ?? 'Facility' : null;
  const orgLocation = org && (org.city || org.state) ? [org.city, org.state].filter(Boolean).join(', ') : null;
  const orgIsActive = org?.status === 'active';

  return (
    <div className="min-h-screen flex flex-col">
      {/* UTILITY BAR */}
      <div className="bg-inkdark text-cream text-xs">
        <div className="max-w-[1500px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {org ? (
              <>
                <span className="font-mono">🏢 {org.name}</span>
                {(orgLocation || org.capacity || orgTypeLabel) && (
                  <>
                    <span className="opacity-50 hidden md:inline">·</span>
                    <span className="hidden md:inline opacity-80">
                      {[orgLocation, org.capacity ? `${org.capacity} beds` : null, orgTypeLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </>
                )}
                <span className="opacity-50 hidden md:inline">·</span>
                <span className={`hidden md:inline ${orgIsActive ? 'text-sage' : 'text-butter'}`}>
                  Vendor: {orgIsActive ? 'Active' : 'Onboarding'}
                </span>
              </>
            ) : (
              <span className="font-mono opacity-80">🏢 Facility setup pending</span>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href="/business/help" className="hover:text-sage transition">
              Help
            </Link>
            <BusinessProfileMenu
              name={firstName}
              roleLabel={roleLabel}
              email={email}
              initials={userInitials}
              avatarClass={avClass}
              logoutAction={logoutAction}
            />
          </div>
        </div>
      </div>

      {/* MAIN NAV */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/business/dashboard" className="flex items-center gap-2.5">
            <KindredMark size={40} />
            <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
            <span className="hidden md:inline text-xs font-mono text-ink/50 ml-1 mt-2">for business</span>
          </Link>

          <BusinessNavLinks />

          <div className="flex items-center gap-2">
            <Link
              href="/business/post-shifts"
              className="inline-flex items-center bg-coral text-cream px-4 py-2 rounded-full text-sm hover:bg-inkdark transition"
            >
              + Post shift
            </Link>
            <Link
              href="/business/post-shifts?bulk=1"
              className="hidden sm:inline-flex items-center bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-coral transition"
            >
              Post bulk
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="flex-1">{children}</div>

      {/* FOOTER */}
      <SiteFooter
        contactHref="/business/help"
        contactLabel="Account manager"
        hipaaLabel="HIPAA · BAA"
        suffix="· Business Edition"
        maxWidth="max-w-[1500px]"
      />
    </div>
  );
}
