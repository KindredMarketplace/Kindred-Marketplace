/**
 * What the Find care and Find jobs filters are made of. Shared by the
 * family Browse, the public Browse, the caregiver's "preview as a family",
 * and Find jobs, so all of them offer exactly the same, complete set.
 *
 * Client-safe: distance and map points are worked out on the server
 * (lib/geo.ts) and arrive here already attached to each row.
 */

import type { ReactNode } from 'react';
import type { ListFilter, ListItem, ListSort } from '@/components/FilterableList';
import {
  SERVICE_GROUPS,
  SERVICE_LABEL,
  JOB_TYPES,
  LANGUAGES,
  GENDERS,
  CAREGIVER_AGES,
  RECIPIENT_AGES,
  CREDENTIALS,
  availabilityTags,
  whenTags,
  slotsForTimes,
  normalizeLanguage,
} from '@/lib/careOptions';

const DISTANCES = [5, 10, 15, 25, 50].map((m) => ({ value: m, label: `Within ${m} mi` }));

// ------------------------------------------------------------------ caregivers

export type CaregiverRow = {
  user_id: string;
  display_name: string | null;
  last_name: string | null;
  photo_url?: string | null;
  headline: string | null;
  bio: string | null;
  hourly_rate_cents: number | null;
  years_experience: number | null;
  experience_hours: number | null;
  service_zip: string | null;
  service_radius_miles?: number | null;
  languages: string[] | null;
  gender: string | null;
  availability_status: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | null;
  services: string[];
  identity_unlocked: boolean;
  service_keys?: string[] | null;
  credential?: string | null;
  age_bracket?: string | null;
  availability?: { d: string; s: string; e: string }[] | null;
  /** Added on the server. */
  distance_mi?: number | null;
  pin_point?: [number, number] | null;
};

export function caregiverItem(c: CaregiverRow): ListItem {
  const rating = c.rating_avg != null && (c.rating_count ?? 0) > 0 ? Number(c.rating_avg) : null;
  const langs = (c.languages ?? []).map(normalizeLanguage);
  const extras: string[] = [];
  if (c.availability_status === 'available') extras.push('taking');
  if (c.distance_mi != null && c.service_radius_miles != null && c.distance_mi <= c.service_radius_miles) extras.push('travels');
  if ((c.rating_count ?? 0) > 0) extras.push('reviewed');
  if (c.photo_url) extras.push('photo');
  return {
    id: c.user_id,
    text: [
      c.display_name,
      c.headline,
      c.bio,
      ...(c.services ?? []),
      ...(c.service_keys ?? []).map((k) => SERVICE_LABEL[k] ?? k),
      ...langs,
      c.credential,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    nums: {
      rate: c.hourly_rate_cents != null ? c.hourly_rate_cents / 100 : null,
      hours: c.experience_hours ?? null,
      rating,
      distance: c.distance_mi ?? null,
    },
    tags: {
      services: c.service_keys ?? [],
      when: availabilityTags(c.availability),
      credential: c.credential ? [c.credential] : [],
      languages: langs,
      gender: c.gender ? [c.gender] : [],
      age: c.age_bracket ? [c.age_bracket] : [],
      extras,
    },
    point: c.pin_point ?? null,
    pin: c.hourly_rate_cents ? `$${Math.round(c.hourly_rate_cents / 100)}` : 'Kindred',
  };
}

export function caregiverFilters({ distanceHint }: { distanceHint?: ReactNode } = {}): ListFilter[] {
  return [
    { kind: 'atMost', key: 'distance', label: 'Distance', options: DISTANCES, hint: distanceHint },
    {
      kind: 'atMost',
      key: 'rate',
      label: 'Hourly rate',
      options: [20, 25, 30, 35, 40, 50].map((v) => ({ value: v, label: `Up to $${v}` })),
    },
    { kind: 'tags', key: 'services', label: 'Care they offer', groups: SERVICE_GROUPS.map((g) => ({ label: g.label, options: g.options })) },
    { kind: 'schedule', key: 'when', label: 'When they’re free', hint: 'Pick days, times, or both.' },
    {
      kind: 'tags',
      key: 'extras',
      label: 'Availability & more',
      options: [
        { value: 'taking', label: 'Taking new families' },
        { value: 'travels', label: 'Will travel to you' },
        { value: 'reviewed', label: 'Has reviews' },
        { value: 'photo', label: 'Has a photo' },
      ],
    },
    {
      kind: 'tags',
      key: 'credential',
      label: 'Credential',
      options: CREDENTIALS,
      hint: 'Everyone here already passed the Kindred Standard: interview, 1,500+ hours, Level 2 background check, ID and insurance.',
    },
    {
      kind: 'atLeast',
      key: 'hours',
      label: 'Hands-on experience',
      options: [
        { value: 3000, label: '3,000+ hrs' },
        { value: 5000, label: '5,000+ hrs' },
        { value: 10000, label: '10,000+ hrs' },
        { value: 20000, label: '20,000+ hrs' },
      ],
    },
    {
      kind: 'atLeast',
      key: 'rating',
      label: 'Rating',
      options: [
        { value: 4, label: '★ 4+' },
        { value: 4.5, label: '★ 4.5+' },
      ],
    },
    { kind: 'tags', key: 'languages', label: 'Languages spoken', options: LANGUAGES },
    { kind: 'tags', key: 'gender', label: 'Caregiver gender', options: GENDERS },
    { kind: 'tags', key: 'age', label: 'Caregiver age', options: CAREGIVER_AGES },
  ];
}

export function caregiverSorts(hasHome: boolean): ListSort[] {
  return [
    { key: 'best', label: 'Best match' },
    ...(hasHome ? [{ key: 'closest', label: 'Closest', by: 'distance', dir: 'asc' as const }] : []),
    { key: 'rate-low', label: 'Rate: low to high', by: 'rate', dir: 'asc' },
    { key: 'rate-high', label: 'Rate: high to low', by: 'rate', dir: 'desc' },
    { key: 'rating', label: 'Highest rated', by: 'rating', dir: 'desc' },
    { key: 'hours', label: 'Most experienced', by: 'hours', dir: 'desc' },
  ];
}

// ------------------------------------------------------------------------ jobs

export type JobRow = {
  id: string;
  title: string;
  description: string | null;
  schedule_type: string;
  hours_per_week: number | null;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  services_needed: string[] | null;
  city: string | null;
  zip: string | null;
  start_date: string | null;
  posted_at: string | null;
  days?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  recipient_age_bracket?: string | null;
};

function hoursBucket(h: number | null): string[] {
  if (h == null) return [];
  if (h < 10) return ['u10'];
  if (h < 20) return ['10'];
  if (h < 30) return ['20'];
  if (h < 40) return ['30'];
  return ['40'];
}

function startBucket(d: string | null): string[] {
  if (!d) return ['flexible'];
  const days = (new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000;
  if (days <= 7) return ['week'];
  if (days <= 31) return ['month'];
  return ['later'];
}

export function jobItem(job: JobRow, extra: { distance?: number | null; point?: [number, number] | null }): ListItem {
  const pay = job.budget_max_cents ?? job.budget_min_cents;
  const slots = slotsForTimes(job.start_time ?? null, job.end_time ?? null);
  const days = job.days ?? [];
  return {
    id: job.id,
    text: [job.title, job.description, ...(job.services_needed ?? []).map((k) => SERVICE_LABEL[k] ?? k), job.city, job.zip]
      .filter(Boolean)
      .join(' ')
      .replace(/_/g, ' ')
      .toLowerCase(),
    nums: {
      pay: pay != null ? pay / 100 : null,
      distance: extra.distance ?? null,
      weekly: job.hours_per_week ?? null,
    },
    tags: {
      type: [job.schedule_type],
      services: job.services_needed ?? [],
      when: whenTags(days, slots),
      weekly: hoursBucket(job.hours_per_week),
      age: job.recipient_age_bracket ? [job.recipient_age_bracket] : [],
      start: startBucket(job.start_date),
    },
    date: job.posted_at,
    point: extra.point ?? null,
    pin: pay != null ? `$${Math.round(pay / 100)}` : 'Open',
  };
}

export function jobFilters({ distanceHint }: { distanceHint?: ReactNode } = {}): ListFilter[] {
  return [
    { kind: 'atMost', key: 'distance', label: 'Distance', options: DISTANCES, hint: distanceHint },
    {
      kind: 'atLeast',
      key: 'pay',
      label: 'Pay',
      options: [18, 20, 22, 25, 30, 35].map((v) => ({ value: v, label: `$${v}+/hr` })),
    },
    { kind: 'tags', key: 'type', label: 'Type of job', options: JOB_TYPES },
    { kind: 'tags', key: 'services', label: 'Care needed', groups: SERVICE_GROUPS.map((g) => ({ label: g.label, options: g.options })) },
    { kind: 'schedule', key: 'when', label: 'When they need help', hint: 'Pick days, times, or both.' },
    {
      kind: 'tags',
      key: 'weekly',
      label: 'Hours per week',
      options: [
        { value: 'u10', label: 'Under 10' },
        { value: '10', label: '10–19' },
        { value: '20', label: '20–29' },
        { value: '30', label: '30–39' },
        { value: '40', label: '40+ (full time)' },
      ],
    },
    { kind: 'tags', key: 'age', label: 'Age of the person needing care', options: RECIPIENT_AGES },
    {
      kind: 'tags',
      key: 'start',
      label: 'Starts',
      options: [
        { value: 'week', label: 'Within a week' },
        { value: 'month', label: 'Within a month' },
        { value: 'later', label: 'Later' },
        { value: 'flexible', label: 'Flexible / not set' },
      ],
    },
    { kind: 'recent', label: 'Posted', options: [{ days: 1, label: 'Today' }, { days: 7, label: 'This week' }, { days: 30, label: 'This month' }] },
  ];
}

export function jobSorts(hasHome: boolean): ListSort[] {
  return [
    { key: 'newest', label: 'Newest', by: 'date', dir: 'desc' },
    ...(hasHome ? [{ key: 'closest', label: 'Closest', by: 'distance', dir: 'asc' as const }] : []),
    { key: 'pay', label: 'Pay: high to low', by: 'pay', dir: 'desc' },
    { key: 'pay-low', label: 'Pay: low to high', by: 'pay', dir: 'asc' },
    { key: 'weekly', label: 'Most hours', by: 'weekly', dir: 'desc' },
  ];
}
