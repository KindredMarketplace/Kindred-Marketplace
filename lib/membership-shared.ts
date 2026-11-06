/**
 * Membership helpers safe for both server and client components.
 *
 * Kindred charges for ACCESS (startup fee + monthly), never for care.
 * The authoritative "is this person a member" check lives in Postgres
 * (kindred_internal.is_member); these helpers mirror it for display only.
 */

export type MembershipStatus = 'none' | 'active' | 'comped' | 'past_due' | 'canceled';

export type AccessSnapshot = {
  role: 'client' | 'cna' | 'business' | 'admin';
  is_member: boolean;
  membership_status: MembershipStatus;
  founding: boolean;
  current_period_end: string | null;
  meets_standard: boolean | null;
  is_listed: boolean | null;
  founding_slots_left: number;
};

export type AccessPlan = {
  key: string;
  role: string;
  label: string;
  startup_fee_cents: number;
  monthly_cents: number;
};

/** Mirrors kindred_internal.is_member(). Display only; the DB decides. */
export function isActiveMembership(
  status: MembershipStatus | null | undefined,
  periodEnd: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (status !== 'active' && status !== 'comped') return false;
  if (!periodEnd) return true;
  return new Date(periodEnd).getTime() > now.getTime();
}

/** Whole dollars when even, cents otherwise. 2000 → "$20", 1999 → "$19.99". */
export function dollars(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function statusLabel(snapshot: Pick<AccessSnapshot, 'membership_status' | 'founding' | 'is_member'>): string {
  if (snapshot.founding && snapshot.is_member) return 'Founding member';
  switch (snapshot.membership_status) {
    case 'active':
      return 'Active member';
    case 'comped':
      return snapshot.is_member ? 'Member (complimentary)' : 'Membership ended';
    case 'past_due':
      return 'Payment past due';
    case 'canceled':
      return 'Membership canceled';
    default:
      return 'Not a member yet';
  }
}

/** Map a Stripe subscription status to ours. */
export function fromStripeStatus(stripeStatus: string): MembershipStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'none';
  }
}

export const KINDRED_STANDARD = [
  {
    key: 'interview',
    title: 'Personal interview',
    detail: 'Every caregiver talks with Kindred before they are approved.',
  },
  {
    key: 'hours',
    title: '1,500+ hours of hands-on care',
    detail: 'Real experience caring for people, not just a certificate.',
  },
  {
    key: 'l2bg',
    title: 'Level 2 background check',
    detail: 'Florida fingerprint-based screening, current and on file.',
  },
  {
    key: 'identity',
    title: 'ID verified',
    detail: 'Government photo ID checked against the person you meet.',
  },
  {
    key: 'insurance',
    title: 'Carries their own liability insurance',
    detail: 'Proof of an active policy uploaded and checked. Required, not optional.',
  },
] as const;
