'use client';

/**
 * The editable parts of a caregiver's public profile, with a real Save.
 */

import { useActionState, useState } from 'react';
import { saveProfileAction, type ProfileSaveState } from '@/app/cna/profile/actions';
import { SERVICE_GROUPS, LANGUAGES, GENDERS, CAREGIVER_AGES } from '@/lib/careOptions';

type Initial = {
  headline: string;
  bio: string;
  rate: string;
  languages: string[];
  services: string[];
  gender: string;
  age_bracket: string;
  service_zip: string;
  service_radius_miles: string;
};

const LISTED = new Set(LANGUAGES.map((l) => l.value));

export function ProfileEditor({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<ProfileSaveState, FormData>(saveProfileAction, null);
  const [bioLen, setBioLen] = useState(initial.bio.length);
  const [svc, setSvc] = useState<Set<string>>(() => new Set(initial.services));
  const otherLangs = initial.languages.filter((l) => !LISTED.has(l)).join(', ');
  const err = (k: string) => state?.errors?.[k];

  const card = 'bg-white border border-ink/10 rounded-2xl p-6';
  const input = 'w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white';
  const eyebrow = 'text-xs font-mono uppercase tracking-widest text-ink/50 mb-1';

  return (
    <form id="profile-form" action={action} className="space-y-6">
      <div className={card}>
        <div className={eyebrow}>One-line headline</div>
        <h3 className="font-display text-xl font-medium mb-3">How you describe yourself</h3>
        <input
          name="headline"
          type="text"
          maxLength={120}
          defaultValue={initial.headline}
          placeholder="e.g. Bilingual dementia and post-surgical care"
          className={input}
        />
        {err('headline') && <p className="mt-1 text-xs text-coral">{err('headline')}</p>}
      </div>

      <div className={card}>
        <div className={eyebrow}>Tell families about yourself</div>
        <h3 className="font-display text-xl font-medium mb-3">Your story</h3>
        <textarea
          name="bio"
          rows={6}
          maxLength={800}
          defaultValue={initial.bio}
          onChange={(e) => setBioLen(e.target.value.length)}
          placeholder="Tell families why you do this work…"
          className={`${input} text-base leading-relaxed py-3`}
        />
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-ink/50">Tip: families respond strongly to why you do this work.</span>
          <span className="font-mono text-ink/40 shrink-0 whitespace-nowrap pl-3">{bioLen} / 800</span>
        </div>
        {err('bio') && <p className="mt-1 text-xs text-coral">{err('bio')}</p>}
      </div>

      <div className={card}>
        <div className={eyebrow}>Your pay</div>
        <h3 className="font-display text-xl font-medium mb-3">Hourly rate</h3>
        <div className="relative max-w-[200px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
          <input name="rate" inputMode="decimal" defaultValue={initial.rate} placeholder="25" className={`${input} pl-8 pr-12 font-mono`} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
        </div>
        <p className="mt-2 text-xs text-ink/55">You set it. Families pay you directly; Kindred never takes a cut.</p>
        {err('rate') && <p className="mt-1 text-xs text-coral">{err('rate')}</p>}
      </div>

      <div className={card}>
        <div className={eyebrow}>Where you work</div>
        <h3 className="font-display text-xl font-medium mb-1">Your area</h3>
        <p className="text-xs text-ink/55 mb-3">Families see roughly how far away you are (ZIP to ZIP), never your address.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-medium text-ink/70">
            Home ZIP code
            <input name="service_zip" inputMode="numeric" maxLength={5} defaultValue={initial.service_zip} className={`${input} mt-1.5 font-mono`} />
            {err('service_zip') && <span className="block mt-1 text-coral">{err('service_zip')}</span>}
          </label>
          <label className="block text-xs font-medium text-ink/70">
            How far you&apos;ll travel (miles)
            <input name="service_radius_miles" inputMode="numeric" maxLength={3} defaultValue={initial.service_radius_miles} placeholder="15" className={`${input} mt-1.5 font-mono`} />
            {err('service_radius_miles') && <span className="block mt-1 text-coral">{err('service_radius_miles')}</span>}
          </label>
        </div>
      </div>

      <div className={card}>
        <div className={eyebrow}>What you do</div>
        <h3 className="font-display text-xl font-medium mb-1">Care you offer</h3>
        <p className="text-xs text-ink/55 mb-4">
          Families filter by these. Tick everything you&apos;re comfortable doing. {svc.size > 0 && <strong className="text-deepteal">{svc.size} chosen.</strong>}
        </p>
        <div className="space-y-4">
          {SERVICE_GROUPS.map((g) => (
            <fieldset key={g.key}>
              <legend className="text-xs font-medium text-ink/70 mb-2">{g.label}</legend>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = svc.has(o.value);
                  return (
                    <label
                      key={o.value}
                      className={`cursor-pointer select-none rounded-full border px-3.5 py-2 text-sm transition ${
                        on ? 'bg-deepteal text-cream border-deepteal' : 'bg-white border-ink/15 hover:bg-mist'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="services"
                        value={o.value}
                        checked={on}
                        onChange={() =>
                          setSvc((prev) => {
                            const next = new Set(prev);
                            next.has(o.value) ? next.delete(o.value) : next.add(o.value);
                            return next;
                          })
                        }
                        className="sr-only"
                      />
                      {on ? '✓ ' : ''}
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className={eyebrow}>About you</div>
        <h3 className="font-display text-xl font-medium mb-1">Languages, gender and age</h3>
        <p className="text-xs text-ink/55 mb-4">Some families look for these. Gender and age are optional; leave them blank if you&apos;d rather not say.</p>
        <div className="text-xs font-medium text-ink/70 mb-2">Languages you speak</div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <label key={l.value} className="cursor-pointer select-none">
              <input type="checkbox" name="languages" value={l.value} defaultChecked={initial.languages.includes(l.value)} className="peer sr-only" />
              <span className="inline-block rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm transition hover:bg-mist peer-checked:border-deepteal peer-checked:bg-deepteal peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-teal">
                {l.label}
              </span>
            </label>
          ))}
        </div>
        <label className="block text-xs font-medium text-ink/70 mt-3">
          Another language? (separate with commas)
          <input name="languages_other" defaultValue={otherLangs} placeholder="e.g. Greek" className={`${input} mt-1.5`} />
        </label>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="block text-xs font-medium text-ink/70">
            Gender
            <select name="gender" defaultValue={initial.gender} className={`${input} mt-1.5`}>
              <option value="">Prefer not to say</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink/70">
            Age range
            <select name="age_bracket" defaultValue={initial.age_bracket} className={`${input} mt-1.5`}>
              <option value="">Prefer not to say</option>
              {CAREGIVER_AGES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur border border-ink/10 p-3 shadow-lg">
        <p role="status" className={`text-sm px-2 ${state ? (state.ok ? 'text-deepteal' : 'text-coral') : 'text-ink/50'}`}>
          {state?.message ?? 'Changes show to families once you save.'}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition disabled:opacity-60"
        >
          {pending ? 'Saving…' : '✓ Save changes'}
        </button>
      </div>
    </form>
  );
}
