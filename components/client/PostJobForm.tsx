'use client';

/**
 * PostJobForm — the family's "post a job" form, ported from
 * Client-Portal/post-job.html. Client component because it manages form state
 * and submits to the postJobAction server action.
 *
 * Service tags come from real service_taxonomy (grouped by category), passed in
 * from the server page. The care recipient + ZIP are pre-filled from the
 * client's real profile when available.
 */

import { useState } from 'react';
import Link from 'next/link';
import { postJobAction, type PostJobResult } from '@/app/client/post-job/actions';
import { DAYS } from '@/lib/careOptions';

type Service = { key: string; label: string; category: string };

const CATEGORY_LABEL: Record<string, string> = {
  personal_care: 'Personal care',
  mobility: 'Mobility',
  medical: 'Medical support',
  household: 'Around the house',
  specialty: 'Specialty experience',
  companionship: 'Companionship & time',
};

const CATEGORY_ORDER = ['personal_care', 'mobility', 'medical', 'household', 'specialty', 'companionship'];

export function PostJobForm({
  services,
  defaultZip,
  recipientId,
  recipientName,
}: {
  services: Service[];
  defaultZip: string;
  recipientId: string | null;
  recipientName: string | null;
}) {
  const [result, setResult] = useState<PostJobResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Group services by category for the pill sections.
  const grouped = new Map<string, Service[]>();
  for (const s of services) {
    const arr = grouped.get(s.category) ?? [];
    arr.push(s);
    grouped.set(s.category, arr);
  }
  const categories = CATEGORY_ORDER.filter((c) => grouped.has(c)).concat(
    Array.from(grouped.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  );

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    const res = await postJobAction(formData);
    // On success the action redirects, so we only get here on error.
    setResult(res);
    setSubmitting(false);
  }

  const fieldErr = (k: string) => (result && !result.ok ? result.fieldErrors?.[k] : undefined);

  return (
    <form action={onSubmit} className="space-y-6 fade-up" style={{ animationDelay: '.2s' }}>
      {recipientId && <input type="hidden" name="care_recipient_id" value={recipientId} />}

      {result && !result.ok && (
        <div className="bg-coral/10 border border-coral/30 rounded-2xl p-4 text-sm text-coral">
          {result.error}
        </div>
      )}

      {/* JOB TITLE */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">Job title</label>
        <input
          type="text"
          name="title"
          placeholder={`e.g. 'Morning care${recipientName ? ' for ' + recipientName.split(' ')[0] : ''}, 4 hours, Mon/Wed/Fri'`}
          className="w-full px-4 py-3 border border-ink/15 rounded-xl text-base focus:outline-none focus:border-teal"
        />
        {fieldErr('title') && <p className="text-xs text-coral mt-1.5">{fieldErr('title')}</p>}
        <p className="text-xs text-ink/60 mt-2">Short, descriptive. Caregivers see this first in their feed.</p>
      </div>

      {/* ABOUT THE CARE */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">
          Tell caregivers about the care needed
        </label>
        <textarea
          name="description"
          rows={6}
          placeholder="What's a typical day like? Anything important about the person you'll be caring for?"
          className="w-full px-4 py-3 border border-ink/15 rounded-xl text-base focus:outline-none focus:border-teal leading-relaxed"
        />
        {fieldErr('description') && <p className="text-xs text-coral mt-1.5">{fieldErr('description')}</p>}
        <p className="text-xs text-ink/60 mt-2">You can always edit this later or add more details after a caregiver applies.</p>
      </div>

      {/* SERVICES (real taxonomy) */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">What kind of help do you need?</label>
        <p className="text-sm text-ink/60 mb-4">Pick all that apply. Caregivers with these skills will see your post first.</p>

        {services.length === 0 ? (
          <p className="text-sm text-ink/50">Service list is loading. You can still post and add services later.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="mb-5">
              <div className="text-xs font-medium text-ink/70 mb-2">{CATEGORY_LABEL[cat] ?? cat}</div>
              <div className="flex flex-wrap gap-2">
                {(grouped.get(cat) ?? []).map((s) => (
                  <span className="tag-pill" key={s.key}>
                    <input type="checkbox" id={`svc-${s.key}`} name="services_needed" value={s.key} />
                    <label htmlFor={`svc-${s.key}`}>{s.label}</label>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SCHEDULE */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">When do you need help?</label>

        <div className="grid sm:grid-cols-4 gap-2 mb-5">
          <span className="day-chip">
            <input type="radio" name="schedule_type" id="st-recurring" value="recurring" defaultChecked />
            <label htmlFor="st-recurring">📅 Recurring weekly</label>
          </span>
          <span className="day-chip">
            <input type="radio" name="schedule_type" id="st-onetime" value="one_time" />
            <label htmlFor="st-onetime">✓ One-time</label>
          </span>
          <span className="day-chip">
            <input type="radio" name="schedule_type" id="st-livein" value="live_in" />
            <label htmlFor="st-livein">🏠 Live-in</label>
          </span>
          <span className="day-chip">
            <input type="radio" name="schedule_type" id="st-oncall" value="on_call" />
            <label htmlFor="st-oncall">📞 On-call</label>
          </span>
        </div>

        <label className="block text-xs font-medium text-ink/70 mb-2">Which days? (pick all that apply)</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {DAYS.map((d) => (
            <span key={d.value} className="day-chip">
              <input type="checkbox" name="days" id={`day-${d.value}`} value={d.value} />
              <label htmlFor={`day-${d.value}`}>{d.label}</label>
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-xs font-medium text-ink/70 mb-1.5">Start time</label>
            <input id="start_time" name="start_time" type="time" className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white" />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-xs font-medium text-ink/70 mb-1.5">End time</label>
            <input id="end_time" name="end_time" type="time" className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Hours per week</label>
            <input type="number" name="hours_per_week" min={1} max={168} placeholder="12" className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink/55">Overnight? Put an end time earlier than the start (e.g. 10 PM to 6 AM). Caregivers filter by days and time of day.</p>
      </div>

      {/* BUDGET */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">Your hourly budget</label>
        <p className="text-sm text-ink/60 mb-4">Most caregivers in your area charge $22–$32/hr. Top-rated tier averages $30+.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Minimum</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
              <input type="number" name="budget_min" placeholder="22" className="w-full pl-8 pr-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Maximum</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
              <input type="number" name="budget_max" placeholder="32" className="w-full pl-8 pr-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
            </div>
          </div>
        </div>
        <div className="mt-4 bg-mist/40 border border-teal/20 rounded-xl p-3 text-xs text-ink/70 leading-relaxed">
          💡 <strong>Heads up:</strong> You pay your caregiver directly, at the rate you agree on together. Kindred doesn&rsquo;t add a fee or take a cut.
        </div>
      </div>

      {/* LOCATION */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-ink/50 font-mono mb-2">Where is the care?</label>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">📍</span>
          <input
            type="text"
            name="zip"
            defaultValue={defaultZip}
            placeholder="ZIP code"
            className="w-full pl-9 pr-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal"
          />
        </div>
        {fieldErr('zip') && <p className="text-xs text-coral mt-1.5">{fieldErr('zip')}</p>}
        <p className="text-xs text-ink/60 mt-2">Only caregivers whose service area covers this ZIP will be notified.</p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
        <Link href="/client/dashboard" className="px-5 py-2.5 text-sm border border-ink/15 rounded-full hover:bg-mist transition">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="bg-ink text-cream px-8 py-3 rounded-full text-sm font-medium hover:bg-coral transition flex items-center gap-2 disabled:opacity-60"
        >
          {submitting ? 'Posting…' : 'Post job →'}
        </button>
      </div>
    </form>
  );
}
