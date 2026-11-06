'use client';

/**
 * ClientProfileEditor — the client's CARE PROFILE (not account settings).
 *
 * Redesigned to be dynamic + blocky + widescreen: a hero band with a big
 * avatar top-left, then an asymmetric grid of cards. Everything saves through
 * saveCareProfileAction (client_profiles + care_recipients).
 *
 * Sections:
 *   - Hero: avatar + recipient name + relationship + quick facts
 *   - Who needs care: name, DOB, ZIP, mobility, living situation
 *   - What care is needed: taxonomy chips + "Other" free-text
 *   - Schedule: frequency; if "regular," a schedule-detail textarea
 *   - Budget: dual-handle range slider
 *   - Insurance / how it's paid: payer_type + detail
 *   - Priorities: chips
 *   - Preferences & notes
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveCareProfileAction } from '@/app/client/setup/actions';
import { BudgetRangeSlider } from '@/components/client/BudgetRangeSlider';
import { TagInput } from '@/components/client/TagInput';
import { initials, avatarClass } from '@/lib/utils/avatar';

type ServiceOption = { key: string; label: string; category: string };

const PRIORITIES = [
  { key: 'experience', label: 'Years of experience', icon: '🎓' },
  { key: 'dementia_trained', label: 'Dementia / memory-care training', icon: '🧠' },
  { key: 'bilingual', label: 'Speaks more than one language', icon: '💬' },
  { key: 'same_caregiver', label: 'Same caregiver every visit', icon: '🤝' },
  { key: 'background_checked', label: 'Background-checked', icon: '🛡️' },
  { key: 'highly_rated', label: 'Highly rated by families', icon: '⭐' },
  { key: 'non_smoker', label: 'Non-smoker', icon: '🚭' },
  { key: 'has_car', label: 'Has own transportation', icon: '🚗' },
  { key: 'comfortable_pets', label: 'Comfortable with pets', icon: '🐾' },
];

const FREQUENCIES = [
  { key: 'recurring', label: 'Regular schedule', sub: 'Same days each week' },
  { key: 'one_time', label: 'One-time / occasional', sub: 'A single visit or now & then' },
  { key: 'live_in', label: 'Live-in care', sub: 'Around-the-clock' },
  { key: 'on_call', label: 'On-call / as needed', sub: 'Backup coverage' },
];

const RELATIONSHIPS = [
  'Adult child (parent needs care)',
  'Spouse / partner',
  'Sibling',
  'Myself',
  'Other family member',
  'Friend / neighbor',
];

const MOBILITY = [
  { key: 'independent', label: 'Fully independent' },
  { key: 'cane_walker', label: 'Uses a cane / walker' },
  { key: 'wheelchair', label: 'Uses a wheelchair' },
  { key: 'bedbound', label: 'Mostly bedbound' },
];

const LIVING = [
  { key: 'lives_alone', label: 'Lives alone' },
  { key: 'with_family', label: 'Lives with family' },
  { key: 'assisted_living', label: 'Assisted living' },
  { key: 'with_recipient', label: 'I live with them' },
];

const PAYERS = [
  { key: 'self_pay', label: 'Self-pay (out of pocket)' },
  { key: 'ltc_insurance', label: 'Long-term care insurance' },
  { key: 'medicaid', label: 'Florida Medicaid' },
  { key: 'medicare_advantage', label: 'Medicare Advantage' },
  { key: 'va', label: 'VA benefits' },
  { key: 'workers_comp', label: "Workers' comp / auto" },
];

const CATEGORY_LABELS: Record<string, string> = {
  personal_care: 'Personal care',
  mobility: 'Mobility',
  medical_support: 'Medical support',
  household: 'Household help',
  specialty: 'Specialty care',
  companionship: 'Companionship',
  overnight: 'Overnight & live-in',
};

export function ClientProfileEditor({
  services,
  initial,
}: {
  services: ServiceOption[];
  initial: {
    relationship: string;
    zip: string;
    recipientName: string;
    recipientDob: string;
    careTypes: string[];
    careTypesOther: string;
    careFrequency: string;
    scheduleDetail: string;
    hoursPerWeek: string;
    budgetMin: number;
    budgetMax: number;
    priorities: string[];
    payerType: string;
    insuranceDetail: string;
    mobilityLevel: string;
    livingSituation: string;
    bio: string;
    favFoods: string[];
    favMovies: string[];
    favShows: string[];
    favMusic: string[];
    hobbies: string[];
    preferences: string;
    notes: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relationship, setRelationship] = useState(initial.relationship);
  const [zip, setZip] = useState(initial.zip);
  const [recipientName, setRecipientName] = useState(initial.recipientName);
  const [recipientDob, setRecipientDob] = useState(initial.recipientDob);
  const [careTypes, setCareTypes] = useState<string[]>(initial.careTypes);
  const [careTypesOther, setCareTypesOther] = useState(initial.careTypesOther);
  const [careFrequency, setCareFrequency] = useState(initial.careFrequency);
  const [scheduleDetail, setScheduleDetail] = useState(initial.scheduleDetail);
  const [hoursPerWeek, setHoursPerWeek] = useState(initial.hoursPerWeek);
  const [budgetMin, setBudgetMin] = useState(initial.budgetMin || 22);
  const [budgetMax, setBudgetMax] = useState(initial.budgetMax || 35);
  const [priorities, setPriorities] = useState<string[]>(initial.priorities);
  const [payerType, setPayerType] = useState(initial.payerType);
  const [insuranceDetail, setInsuranceDetail] = useState(initial.insuranceDetail);
  const [mobilityLevel, setMobilityLevel] = useState(initial.mobilityLevel);
  const [livingSituation, setLivingSituation] = useState(initial.livingSituation);
  const [bio, setBio] = useState(initial.bio);
  const [favFoods, setFavFoods] = useState<string[]>(initial.favFoods);
  const [favMovies, setFavMovies] = useState<string[]>(initial.favMovies);
  const [favShows, setFavShows] = useState<string[]>(initial.favShows);
  const [favMusic, setFavMusic] = useState<string[]>(initial.favMusic);
  const [hobbies, setHobbies] = useState<string[]>(initial.hobbies);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [notes, setNotes] = useState(initial.notes);

  const grouped = services.reduce<Record<string, ServiceOption[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const displayName = recipientName || 'Care recipient';
  const recipientInitials = initials(displayName);
  const recipientAv = avatarClass(displayName);
  const showSchedule = careFrequency === 'recurring' || careFrequency === 'on_call';

  function save() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    if (relationship) fd.set('relationship', relationship);
    if (zip) fd.set('client_zip', zip);
    if (recipientName) fd.set('recipient_name', recipientName);
    if (recipientDob) fd.set('recipient_dob', recipientDob);
    careTypes.forEach((c) => fd.append('care_types', c));
    if (careTypesOther) fd.set('care_types_other', careTypesOther);
    if (careFrequency) fd.set('care_frequency', careFrequency);
    if (scheduleDetail) fd.set('schedule_detail', scheduleDetail);
    if (hoursPerWeek) fd.set('hours_per_week', hoursPerWeek);
    fd.set('budget_min', String(budgetMin));
    fd.set('budget_max', String(budgetMax));
    priorities.forEach((p) => fd.append('priorities', p));
    if (payerType) fd.set('payer_type', payerType);
    if (insuranceDetail) fd.set('insurance_detail', insuranceDetail);
    if (mobilityLevel) fd.set('mobility_level', mobilityLevel);
    if (livingSituation) fd.set('living_situation', livingSituation);
    if (bio) fd.set('bio', bio);
    favFoods.forEach((v) => fd.append('fav_foods', v));
    favMovies.forEach((v) => fd.append('fav_movies', v));
    favShows.forEach((v) => fd.append('fav_shows', v));
    favMusic.forEach((v) => fd.append('fav_music', v));
    hobbies.forEach((v) => fd.append('hobbies', v));
    if (preferences) fd.set('preferences', preferences);
    if (notes) fd.set('notes', notes);

    startTransition(async () => {
      const res = await saveCareProfileAction(fd);
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.error);
      }
    });
  }

  const inputCls =
    'w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20';
  const cardCls = 'bg-white border border-ink/10 rounded-3xl p-6 lg:p-7';
  const pillBtn = (active: boolean) =>
    `px-4 py-2 rounded-full border text-sm transition ${
      active ? 'border-teal bg-mist/60 font-medium' : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
    }`;

  return (
    <div className="space-y-5">
      {/* HERO BAND */}
      <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-white">
        <div className="h-28 bg-gradient-to-br from-deepteal via-teal to-sky" />
        <div className="px-6 lg:px-8 pb-7 -mt-14">
          <div className="flex items-end gap-5 flex-wrap">
            <div className={`w-28 h-28 rounded-[26px] ${recipientAv} ring-4 ring-white flex items-center justify-center text-cream font-display text-4xl font-medium shadow-xl flex-shrink-0`}>
              {recipientInitials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Care profile</div>
              <h2 className="font-display text-3xl lg:text-4xl font-medium leading-tight">{displayName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-ink/60">
                {relationship && <span>{relationship}</span>}
                {relationship && zip && <span className="opacity-40">·</span>}
                {zip && <span className="font-mono text-coral">📍 {zip}</span>}
              </div>
            </div>
            {/* quick completion hint */}
            <div className="pb-1 flex flex-wrap gap-2">
              {careTypes.length > 0 && (
                <span className="text-xs font-mono bg-mist px-3 py-1.5 rounded-full text-deepteal">
                  {careTypes.length} care types
                </span>
              )}
              {careFrequency && (
                <span className="text-xs font-mono bg-mist px-3 py-1.5 rounded-full text-deepteal">
                  {FREQUENCIES.find((f) => f.key === careFrequency)?.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ASYMMETRIC GRID */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* WHO NEEDS CARE — spans 2 cols */}
        <div className={`${cardCls} lg:col-span-2`}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">The basics</div>
          <h3 className="font-display text-2xl font-medium mb-5">Who needs care</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Their name</label>
              <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Eleanor" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Your relationship to them</label>
              <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Date of birth</label>
              <input type="date" value={recipientDob} onChange={(e) => setRecipientDob(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">ZIP code (where care happens)</label>
              <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="32601" inputMode="numeric" className={inputCls} />
            </div>
          </div>

          {/* Bio / about them */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              A short intro <span className="text-ink/40">— tell caregivers who they are</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="This is my mother, Eleanor. She raised three kids in Ocala, taught piano for 40 years, and still hums show tunes. Warm, sharp, and a little stubborn in the best way."
              className={inputCls}
            />
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-2">Mobility</label>
              <div className="flex flex-wrap gap-2">
                {MOBILITY.map((m) => (
                  <button key={m.key} type="button" onClick={() => setMobilityLevel(mobilityLevel === m.key ? '' : m.key)} className={pillBtn(mobilityLevel === m.key)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-2">Living situation</label>
              <div className="flex flex-wrap gap-2">
                {LIVING.map((l) => (
                  <button key={l.key} type="button" onClick={() => setLivingSituation(livingSituation === l.key ? '' : l.key)} className={pillBtn(livingSituation === l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BUDGET — 1 col, tall */}
        <div className={cardCls}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Budget</div>
          <h3 className="font-display text-2xl font-medium mb-1">Hourly range</h3>
          <p className="text-xs text-ink/55 mb-5">Drag to set your range. FL CNAs typically run $22–$35/hr.</p>
          <BudgetRangeSlider
            min={budgetMin}
            max={budgetMax}
            onChange={(lo, hi) => { setBudgetMin(lo); setBudgetMax(hi); }}
          />
        </div>

        {/* CARE TYPES — spans full width */}
        <div className={`${cardCls} lg:col-span-3`}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Care needs</div>
          <h3 className="font-display text-2xl font-medium mb-1">What kind of care is needed</h3>
          <p className="text-sm text-ink/60 mb-5">Tap everything that applies — this drives who we match you with.</p>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-2">
                  {CATEGORY_LABELS[cat] ?? cat}
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggle(careTypes, setCareTypes, s.key)}
                      className={`px-3.5 py-2 rounded-full border text-sm transition ${
                        careTypes.includes(s.key)
                          ? 'border-teal bg-teal text-cream font-medium'
                          : 'border-ink/15 hover:border-teal/40 hover:bg-mist/40'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* OTHER free-text */}
          <div className="mt-6 pt-5 border-t border-ink/10">
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Something else? <span className="text-ink/40">Tell us in your own words</span>
            </label>
            <input
              value={careTypesOther}
              onChange={(e) => setCareTypesOther(e.target.value)}
              placeholder="e.g. help managing a feeding tube, sign language, specific therapy support…"
              className={inputCls}
            />
          </div>
        </div>

        {/* GETTING TO KNOW THEM — full width, the personal heart of the profile */}
        <div className={`${cardCls} lg:col-span-3 bg-gradient-to-br from-butter/20 to-coral/5`}>
          <div className="text-xs font-mono uppercase tracking-widest text-coral mb-1">Beyond care</div>
          <h3 className="font-display text-2xl font-medium mb-1">Getting to know them</h3>
          <p className="text-sm text-ink/60 mb-6">
            The little things make care personal. Start typing — we&rsquo;ll suggest as you go, and you can
            always add your own.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">🍽️ Favorite foods &amp; snacks</label>
              <TagInput category="food" values={favFoods} onChange={setFavFoods} accent="coral" placeholder="Apple pie, sweet tea…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">🎬 Favorite movies</label>
              <TagInput category="movie" values={favMovies} onChange={setFavMovies} accent="teal" placeholder="Casablanca…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">📺 Favorite shows</label>
              <TagInput category="show" values={favShows} onChange={setFavShows} accent="teal" placeholder="Jeopardy!, I Love Lucy…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">🎵 Music they love</label>
              <TagInput category="music" values={favMusic} onChange={setFavMusic} accent="sky" placeholder="Frank Sinatra, gospel…" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink/70 mb-1.5">🌿 Hobbies &amp; things they love to do</label>
              <TagInput category="hobby" values={hobbies} onChange={setHobbies} accent="teal" placeholder="Gardening, birdwatching, card games…" />
            </div>
          </div>
        </div>

        {/* SCHEDULE — 2 cols */}
        <div className={`${cardCls} lg:col-span-2`}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Schedule</div>
          <h3 className="font-display text-2xl font-medium mb-4">How often is care needed</h3>

          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {FREQUENCIES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCareFrequency(f.key)}
                className={`text-left px-4 py-3 rounded-2xl border transition ${
                  careFrequency === f.key ? 'border-teal bg-mist/60' : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                }`}
              >
                <div className="font-medium text-sm">{f.label}</div>
                <div className="text-xs text-ink/55">{f.sub}</div>
              </button>
            ))}
          </div>

          {/* Conditional schedule detail */}
          {showSchedule && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink/70 mb-1.5">
                Describe the regular schedule
              </label>
              <textarea
                value={scheduleDetail}
                onChange={(e) => setScheduleDetail(e.target.value)}
                rows={2}
                placeholder="e.g. Mon / Wed / Fri mornings, 8am–12pm. Occasional weekend evenings."
                className={inputCls}
              />
            </div>
          )}

          <div className="w-1/2">
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Approx. hours / week</label>
            <input type="number" min={1} max={168} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} placeholder="20" className={inputCls} />
          </div>
        </div>

        {/* INSURANCE — 1 col */}
        <div className={cardCls}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Payment</div>
          <h3 className="font-display text-2xl font-medium mb-1">How is care paid for?</h3>
          <p className="text-xs text-ink/55 mb-4">This also shows up in billing.</p>
          <div className="flex flex-col gap-2 mb-4">
            {PAYERS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPayerType(payerType === p.key ? '' : p.key)}
                className={`text-left px-4 py-2.5 rounded-xl border text-sm transition ${
                  payerType === p.key ? 'border-teal bg-mist/60 font-medium' : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {payerType && payerType !== 'self_pay' && (
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Insurance / carrier details</label>
              <input
                value={insuranceDetail}
                onChange={(e) => setInsuranceDetail(e.target.value)}
                placeholder="e.g. Genworth policy #…"
                className={inputCls}
              />
            </div>
          )}
        </div>

        {/* PRIORITIES — 2 cols */}
        <div className={`${cardCls} lg:col-span-2`}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">Matching</div>
          <h3 className="font-display text-2xl font-medium mb-1">What matters most</h3>
          <p className="text-sm text-ink/60 mb-4">We surface caregivers who match these first.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => toggle(priorities, setPriorities, p.key)}
                className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-sm transition ${
                  priorities.includes(p.key) ? 'border-teal bg-mist/60 font-medium' : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                }`}
              >
                <span className="text-lg">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PREFERENCES + NOTES — 1 col */}
        <div className={cardCls}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/45 mb-1">For caregivers</div>
          <h3 className="font-display text-2xl font-medium mb-4">Preferences &amp; notes</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Likes & routines</label>
              <textarea value={preferences} onChange={(e) => setPreferences(e.target.value)} rows={3} placeholder="Enjoys morning walks, prefers tea, watches the news at 6pm…" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1.5">Anything else to know</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Hard of hearing on the left, uses a walker…" className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SAVE BAR */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white/95 backdrop-blur border border-ink/15 rounded-2xl shadow-lg shadow-ink/5 px-5 py-3 flex items-center justify-between gap-4">
          <div className="text-sm">
            {error && <span className="text-coral">{error}</span>}
            {saved && !error && <span className="text-deepteal font-medium">✓ Saved</span>}
            {!error && !saved && <span className="text-ink/50">Changes save when you hit the button.</span>}
          </div>
          <button
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-deepteal px-6 py-2.5 font-medium text-cream text-sm transition hover:bg-inkdark disabled:opacity-60 flex-shrink-0"
          >
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
