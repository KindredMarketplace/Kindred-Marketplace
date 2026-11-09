/**
 * Interview booking (Calendly or similar).
 *
 * The admin saves their booking link once (platform_settings key
 * 'interview_booking_url'). Invites and the applicant's dashboard use it with
 * the applicant's name + email pre-filled, so they only pick a time.
 * Calendly reads ?name= and ?email= to pre-fill its form.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { CONTACT_EMAIL } from './site';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBookingUrl(supabase: SupabaseClient<any>): Promise<string | null> {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'interview_booking_url')
    .maybeSingle();
  const v = data?.value;
  return typeof v === 'string' && v.startsWith('https://') ? v : null;
}

export function bookingLink(base: string, name?: string | null, email?: string | null): string {
  const u = new URL(base);
  if (name) u.searchParams.set('name', name);
  if (email) u.searchParams.set('email', email);
  return u.toString();
}

/** Subject + body for the "come talk with us" email. */
export function inviteMessage(firstName: string, link: string) {
  const subject = 'Your Kindred interview: pick a time';
  const body = [
    `Hi ${firstName},`,
    '',
    'Thank you for applying to Kindred. We enjoyed reading your application and would love to talk with you.',
    '',
    'Pick whichever time works best for you here:',
    link,
    '',
    'It is a relaxed conversation, about 20 to 30 minutes. Nothing to prepare beyond being yourself.',
    '',
    'Warmly,',
    'The Kindred team',
  ].join('\n');
  return { subject, body };
}

/** Opens a pre-filled draft in the Kindred Gmail account. */
export function gmailComposeUrl(to: string, subject: string, body: string): string {
  const u = new URL('https://mail.google.com/mail/');
  u.searchParams.set('authuser', CONTACT_EMAIL);
  u.searchParams.set('view', 'cm');
  u.searchParams.set('fs', '1');
  u.searchParams.set('to', to);
  u.searchParams.set('su', subject);
  u.searchParams.set('body', body);
  return u.toString();
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/*
 * Interview times are entered and shown in Eastern time (Kindred is in
 * Florida). A <input type="datetime-local"> value has no time zone, and the
 * server runs in UTC, so convert explicitly instead of letting `new Date()`
 * guess.
 */
const TZ = 'America/New_York';

function tzOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-11-12T14:00" (Eastern wall time) -> ISO instant. */
export function easternLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const off = tzOffsetMinutes(new Date(wall - tzOffsetMinutes(new Date(wall)) * 60000));
  return new Date(wall - off * 60000).toISOString();
}

/** ISO instant -> "2026-11-12T14:00" Eastern wall time, for datetime-local inputs. */
export function isoToEasternLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + tzOffsetMinutes(d) * 60000).toISOString().slice(0, 16);
}
