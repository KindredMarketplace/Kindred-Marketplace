/**
 * Every option the filters, the caregiver profile and the post-a-job form
 * offer. One list, so a filter can never offer something nobody can set.
 *
 * SERVICES mirrors public.service_taxonomy (40 services in 7 groups); keep
 * the two in step if a service is added.
 */

export type Option = { value: string; label: string };

export const SERVICE_GROUPS: { key: string; label: string; options: Option[] }[] = [
  {
    key: 'specialty',
    label: 'Conditions & specialty care',
    options: [
      { value: 'dementia_care', label: "Dementia & Alzheimer's" },
      { value: 'parkinson_care', label: "Parkinson's" },
      { value: 'stroke_recovery', label: 'Stroke recovery' },
      { value: 'hospice_support', label: 'Hospice & end of life' },
      { value: 'post_surgical', label: 'After surgery' },
      { value: 'cardiac_care', label: 'Heart (cardiac) care' },
      { value: 'respiratory_care', label: 'Breathing (respiratory) care' },
      { value: 'bariatric_care', label: 'Bariatric care' },
      { value: 'pediatric_care', label: 'Children (pediatric)' },
    ],
  },
  {
    key: 'personal_care',
    label: 'Personal care',
    options: [
      { value: 'bathing', label: 'Bathing & hygiene' },
      { value: 'dressing', label: 'Dressing' },
      { value: 'toileting', label: 'Toileting & incontinence' },
      { value: 'grooming', label: 'Grooming' },
      { value: 'skin_care', label: 'Skin care' },
    ],
  },
  {
    key: 'mobility',
    label: 'Mobility',
    options: [
      { value: 'transfers', label: 'Transfers' },
      { value: 'ambulating', label: 'Walking help' },
      { value: 'range_of_motion', label: 'Range-of-motion exercises' },
      { value: 'fall_prevention', label: 'Fall prevention' },
    ],
  },
  {
    key: 'medical_support',
    label: 'Health support',
    options: [
      { value: 'meds_reminder', label: 'Medication reminders' },
      { value: 'vitals', label: 'Vitals checks' },
      { value: 'blood_glucose', label: 'Blood sugar checks' },
      { value: 'wound_care_basic', label: 'Basic wound care' },
      { value: 'catheter_care', label: 'Catheter care' },
      { value: 'ostomy_care', label: 'Ostomy care' },
      { value: 'oxygen_support', label: 'Oxygen support' },
    ],
  },
  {
    key: 'household',
    label: 'Around the home',
    options: [
      { value: 'meal_prep', label: 'Meal prep' },
      { value: 'feeding', label: 'Help eating' },
      { value: 'light_housekeeping', label: 'Light housekeeping' },
      { value: 'laundry', label: 'Laundry' },
      { value: 'errands', label: 'Errands' },
      { value: 'pet_care', label: 'Light pet care' },
    ],
  },
  {
    key: 'companionship',
    label: 'Companionship & getting out',
    options: [
      { value: 'companionship', label: 'Companionship' },
      { value: 'transportation', label: 'Transportation' },
      { value: 'social_outings', label: 'Outings' },
      { value: 'religious_support', label: 'Faith & spiritual support' },
    ],
  },
  {
    key: 'overnight',
    label: 'Overnight & coverage',
    options: [
      { value: 'overnight', label: 'Overnight care' },
      { value: 'live_in', label: 'Live-in care' },
      { value: 'on_call', label: 'On-call coverage' },
      { value: 'respite', label: 'Respite (give family a break)' },
    ],
  },
];

export const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICE_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label]))
);

export const JOB_TYPES: Option[] = [
  { value: 'recurring', label: 'Recurring weekly' },
  { value: 'one_time', label: 'One-time' },
  { value: 'live_in', label: 'Live-in' },
  { value: 'on_call', label: 'On-call / as needed' },
];
export const JOB_TYPE_LABEL: Record<string, string> = Object.fromEntries(JOB_TYPES.map((o) => [o.value, o.label]));

export const LANGUAGES: Option[] = [
  'English',
  'Spanish',
  'Haitian Creole',
  'Portuguese',
  'French',
  'Tagalog',
  'Vietnamese',
  'Mandarin',
  'Cantonese',
  'Korean',
  'Russian',
  'Ukrainian',
  'Polish',
  'Arabic',
  'Hindi',
  'Italian',
  'German',
  'American Sign Language',
].map((l) => ({ value: l, label: l }));

/** Older free-text entries ("Español") mapped onto the list above. */
const LANGUAGE_ALIASES: Record<string, string> = {
  espanol: 'Spanish',
  español: 'Spanish',
  kreyol: 'Haitian Creole',
  kreyòl: 'Haitian Creole',
  creole: 'Haitian Creole',
  'haitian kreyol': 'Haitian Creole',
  portugues: 'Portuguese',
  português: 'Portuguese',
  francais: 'French',
  français: 'French',
  filipino: 'Tagalog',
  chinese: 'Mandarin',
  asl: 'American Sign Language',
  'sign language': 'American Sign Language',
};
export function normalizeLanguage(raw: string): string {
  const t = raw.trim();
  const k = t.toLowerCase();
  if (LANGUAGE_ALIASES[k]) return LANGUAGE_ALIASES[k];
  const hit = LANGUAGES.find((l) => l.value.toLowerCase() === k);
  return hit ? hit.value : t.replace(/^./, (c) => c.toUpperCase());
}

export const GENDERS: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-binary' },
];

export const CAREGIVER_AGES: Option[] = [
  { value: '20s', label: '18–29' },
  { value: '30s', label: '30s' },
  { value: '40s', label: '40s' },
  { value: '50s', label: '50s' },
  { value: '60s+', label: '60+' },
];

export const RECIPIENT_AGES: Option[] = [
  { value: 'under_60', label: 'Under 60' },
  { value: '60s', label: '60s' },
  { value: '70s', label: '70s' },
  { value: '80s', label: '80s' },
  { value: '90s+', label: '90+' },
];

export const CREDENTIALS: Option[] = [
  { value: 'cna', label: 'CNA' },
  { value: 'hha', label: 'HHA' },
  { value: 'lpn', label: 'LPN' },
  { value: 'rn', label: 'RN' },
  { value: 'other', label: 'Other caregiver' },
];

export const DAYS: Option[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

/** Parts of the day. Overnight runs from 10 PM into the next morning. */
export const SLOTS = [
  { value: 'morning', label: 'Morning', hint: '6 AM – noon', start: '06:00', end: '12:00' },
  { value: 'afternoon', label: 'Afternoon', hint: 'noon – 5 PM', start: '12:00', end: '17:00' },
  { value: 'evening', label: 'Evening', hint: '5 – 10 PM', start: '17:00', end: '22:00' },
  { value: 'overnight', label: 'Overnight', hint: '10 PM – 6 AM', start: '22:00', end: '23:59:59' },
] as const;
export type SlotKey = (typeof SLOTS)[number]['value'];

const DOW_TO_DAY: Record<string, string> = {
  sunday: 'sun',
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
};
export const DAY_TO_DOW: Record<string, string> = Object.fromEntries(Object.entries(DOW_TO_DAY).map(([a, b]) => [b, a]));

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Which parts of the day a start–end time touches (end before start = runs overnight). */
export function slotsForTimes(start: string | null, end: string | null): SlotKey[] {
  if (!start || !end) return [];
  let s = mins(start);
  let e = mins(end);
  if (e <= s) e += 24 * 60;
  const out = new Set<SlotKey>();
  // Walk the shift in 30-minute steps; anything from 10 PM to 6 AM is overnight.
  for (let t = s; t < e; t += 30) {
    const m = t % (24 * 60);
    if (m >= 360 && m < 720) out.add('morning');
    else if (m >= 720 && m < 1020) out.add('afternoon');
    else if (m >= 1020 && m < 1320) out.add('evening');
    else out.add('overnight');
  }
  return SLOTS.map((x) => x.value).filter((v) => out.has(v));
}

/** "mon:morning" style tags for the When filter. */
export function whenTags(days: string[], slots: string[]): string[] {
  const out: string[] = [];
  for (const d of days) for (const s of slots) out.push(`${d}:${s}`);
  return out;
}

/** cna_availability rows → When tags. */
export function availabilityTags(rows: { d: string; s: string; e: string }[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const r of rows ?? []) {
    const day = DOW_TO_DAY[r.d] ?? r.d;
    for (const s of slotsForTimes(r.s, r.e === '23:59:59' ? '06:00' : r.e)) out.add(`${day}:${s}`);
  }
  return [...out];
}

/** "9:00 AM" from "09:00" or "09:00:00". */
export function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ampm}` : `${hh} ${ampm}`;
}

/** "Mon, Wed, Fri" or "Weekdays" / "Every day". */
export function formatDays(days: string[] | null | undefined): string {
  const set = new Set(days ?? []);
  if (set.size === 0) return '';
  if (set.size === 7) return 'Every day';
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  if (set.size === 5 && weekdays.every((d) => set.has(d))) return 'Weekdays';
  if (set.size === 2 && set.has('sat') && set.has('sun')) return 'Weekends';
  return DAYS.filter((d) => set.has(d.value)).map((d) => d.label).join(', ');
}
