'use client';

/**
 * The editable parts of a caregiver's public profile, with a real Save.
 */

import { useActionState, useState } from 'react';
import { saveProfileAction, type ProfileSaveState } from '@/app/cna/profile/actions';

type Initial = {
  headline: string;
  bio: string;
  rate: string;
  languages: string;
  service_zip: string;
  service_radius_miles: string;
};

export function ProfileEditor({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<ProfileSaveState, FormData>(saveProfileAction, null);
  const [bioLen, setBioLen] = useState(initial.bio.length);
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
        <div className={eyebrow}>Where and how</div>
        <h3 className="font-display text-xl font-medium mb-3">Area and languages</h3>
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
        <label className="block text-xs font-medium text-ink/70 mt-4">
          Languages you speak (separate with commas)
          <input name="languages" defaultValue={initial.languages} placeholder="English, Español" className={`${input} mt-1.5`} />
        </label>
      </div>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur border border-ink/10 p-3 shadow-lg">
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
