/**
 * Shared stage vocabulary for the CNA application pipeline.
 *
 * The order reflects the decided process:
 *   submitted -> interviewing -> verifying -> approved
 * with rejected / waitlisted reachable from any human gate.
 *
 * The lightweight application comes first, then a human conversation, and ONLY
 * THEN, once accepted (verifying = "Accepted · onboarding"), the costly part:
 * Level 2 background check, ID and liability insurance. Cheap filters first.
 */

export type AppStage =
  | 'incomplete'
  | 'submitted'
  | 'interviewing'
  | 'verifying'
  | 'approved'
  | 'rejected'
  | 'waitlisted';

export const STAGE_LABEL: Record<AppStage, string> = {
  incomplete: 'Draft (not submitted)',
  submitted: 'New — needs screen',
  interviewing: 'Interview',
  verifying: 'Accepted · onboarding',
  approved: 'Approved',
  rejected: 'Declined',
  waitlisted: 'Waitlisted',
};

export const STAGE_BLURB: Record<AppStage, string> = {
  incomplete: 'Started the application but has not submitted it yet.',
  submitted: 'Read the application. Decide whether they earn a conversation.',
  interviewing: 'Send the booking link, hold the conversation. The character read.',
  verifying: 'Accepted. They now upload their Level 2 background check, ID and liability insurance; verify each, then publish.',
  approved: 'Vetted and live in Browse. Families can find them.',
  rejected: 'Declined at a human gate.',
  waitlisted: 'Strong, but not onboarding right now.',
};

/** The three active human-review stages, in pipeline order. */
export const PIPELINE_STAGES: AppStage[] = ['submitted', 'interviewing', 'verifying'];

/** Tailwind dot color per stage (palette is configured in globals/tailwind). */
export const STAGE_DOT: Record<AppStage, string> = {
  incomplete: 'bg-stone-300',
  submitted: 'bg-sky',
  interviewing: 'bg-butter',
  verifying: 'bg-teal',
  approved: 'bg-sage',
  rejected: 'bg-coral',
  waitlisted: 'bg-stone-400',
};

export function isActiveStage(s: string | null | undefined): boolean {
  return s === 'submitted' || s === 'interviewing' || s === 'verifying';
}

/** "3d ago" style relative time. */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const day = 86_400_000;
  const days = Math.floor(Math.abs(diffMs) / day);
  const future = diffMs < 0;
  if (days === 0) return 'today';
  if (days === 1) return future ? 'tomorrow' : 'yesterday';
  return future ? `in ${days}d` : `${days}d ago`;
}
