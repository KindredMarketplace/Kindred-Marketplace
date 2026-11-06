'use client';

/**
 * PostShiftsForm — the facility's bulk shift builder, ported from
 * Business-Portal/post-shifts.html. Client component because it manages form
 * state (selected template, days of week, caregivers-per-shift) and computes
 * the live posting summary, then submits to the postShiftsAction server action.
 *
 * Templates come from the real shift_templates table (passed from the server
 * page). Selecting one pre-fills the editable fields. The summary card on the
 * right recomputes shift count + estimated cost as inputs change.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { postShiftsAction, type PostShiftsResult } from '@/app/business/post-shifts/actions';

export type ShiftTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  pay_rate_cents: number;
  bill_rate_cents: number;
  services_required: string[];
};

const DAYS = [
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
  { idx: 0, label: 'Sun' },
];

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // overnight
  return mins / 60;
}

function toTimeInput(t: string): string {
  // "19:00:00" → "19:00"
  return t.slice(0, 5);
}

export function PostShiftsForm({
  templates,
  defaultStartDate,
  defaultEndDate,
}: {
  templates: ShiftTemplate[];
  defaultStartDate: string;
  defaultEndDate: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const [startTime, setStartTime] = useState(selected ? toTimeInput(selected.start_time) : '19:00');
  const [endTime, setEndTime] = useState(selected ? toTimeInput(selected.end_time) : '07:00');
  const [billDollars, setBillDollars] = useState(selected ? String(selected.bill_rate_cents / 100) : '42');
  const [payDollars, setPayDollars] = useState(selected ? String(selected.pay_rate_cents / 100) : '30');
  const [name, setName] = useState(selected?.name ?? 'Custom shift');
  const [dementia, setDementia] = useState(false);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 0]));
  const [perShift, setPerShift] = useState(2);

  const [result, setResult] = useState<PostShiftsResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function applyTemplate(t: ShiftTemplate) {
    setSelectedId(t.id);
    setName(t.name);
    setStartTime(toTimeInput(t.start_time));
    setEndTime(toTimeInput(t.end_time));
    setBillDollars(String(t.bill_rate_cents / 100));
    setPayDollars(String(t.pay_rate_cents / 100));
    setDementia((t.services_required ?? []).includes('dementia_care'));
  }

  function toggleDay(idx: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // Live summary: count matching days in range × caregivers-per-shift.
  const { matchingDates, totalShifts, hoursPerShift, totalHours, estCostCents } = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let matching = 0;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
      const cursor = new Date(start);
      let guard = 0;
      while (cursor <= end && guard < 400) {
        if (days.has(cursor.getDay())) matching++;
        cursor.setDate(cursor.getDate() + 1);
        guard++;
      }
    }
    const hps = hoursBetween(startTime, endTime);
    const total = matching * perShift;
    const billCents = Math.round((parseFloat(billDollars) || 0) * 100);
    return {
      matchingDates: matching,
      totalShifts: total,
      hoursPerShift: hps,
      totalHours: total * hps,
      estCostCents: Math.round(total * hps * billCents),
    };
  }, [startDate, endDate, days, perShift, startTime, endTime, billDollars]);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    // Inject controlled values the native inputs don't carry as form fields.
    Array.from(days).forEach((d) => formData.append('days', String(d)));
    formData.set('caregivers_per_shift', String(perShift));
    const res = await postShiftsAction(formData);
    setResult(res); // only reached on error (success redirects)
    setSubmitting(false);
  }

  const fieldErr = (k: string) => (result && !result.ok ? result.fieldErrors?.[k] : undefined);
  const fmtUSD = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <form action={onSubmit} className="grid lg:grid-cols-12 gap-6 fade-up" style={{ animationDelay: '.1s' }}>
      {/* Hidden controlled fields */}
      <input type="hidden" name="start_time" value={startTime} />
      <input type="hidden" name="end_time" value={endTime} />
      <input type="hidden" name="bill_rate" value={billDollars} />
      <input type="hidden" name="pay_rate" value={payDollars} />
      <input type="hidden" name="name" value={name} />
      {dementia && <input type="hidden" name="requires_dementia_cert" value="on" />}

      {/* LEFT: builder */}
      <div className="lg:col-span-8 space-y-6">
        {result && !result.ok && (
          <div className="bg-coral/10 border border-coral/30 rounded-2xl p-4 text-sm text-coral">{result.error}</div>
        )}

        {/* Step 1 — template */}
        <div className="bg-white border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Step 1</div>
          <h3 className="font-display text-xl font-medium mb-1">Start from a shift template</h3>
          <p className="text-sm text-ink/60 mb-4">
            {templates.length > 0
              ? 'Pick one to pre-fill the details below. Edit anything after selecting.'
              : 'No saved templates yet — fill in the details below and post. You can save templates later.'}
          </p>

          {templates.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((t) => {
                const active = t.id === selectedId;
                const hrs = hoursBetween(toTimeInput(t.start_time), toTimeInput(t.end_time));
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`template-pill text-left border rounded-2xl p-4 relative ${active ? 'active border-deepteal bg-deepteal/5' : 'bg-white border-ink/10'}`}
                  >
                    {active && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-deepteal text-cream text-[10px] flex items-center justify-center font-bold">
                        ✓
                      </div>
                    )}
                    <div className="font-display text-base font-medium">{t.name}</div>
                    <div className="text-xs text-ink/60 mt-1 font-mono">
                      {toTimeInput(t.start_time)} – {toTimeInput(t.end_time)} · {hrs} hrs
                    </div>
                    <div className="text-xs text-ink/60 mt-2 leading-relaxed">
                      Bill {fmtUSD(t.bill_rate_cents)}/hr · Pay {fmtUSD(t.pay_rate_cents)}/hr
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2 — details */}
        <div className="bg-white border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Step 2</div>
          <h3 className="font-display text-xl font-medium mb-4">Tweak the details</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Shift name (internal)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Caregiver role</label>
              <select className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white">
                <option>CNA</option>
                <option>CNA + Med Aide cert</option>
                <option>LPN</option>
                <option>Companion / Aide</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              {fieldErr('start_time') && <p className="text-xs text-coral mt-1">{fieldErr('start_time')}</p>}
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">End time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              {fieldErr('end_time') && <p className="text-xs text-coral mt-1">{fieldErr('end_time')}</p>}
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Bill rate to facility</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                <input type="number" value={billDollars} onChange={(e) => setBillDollars(e.target.value)} className="w-full pl-8 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
              </div>
              {fieldErr('bill_rate_cents') && <p className="text-xs text-coral mt-1">{fieldErr('bill_rate_cents')}</p>}
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Caregiver pay rate</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                <input type="number" value={payDollars} onChange={(e) => setPayDollars(e.target.value)} className="w-full pl-8 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 text-xs">/hr</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-2 block">Required credentials</label>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs bg-deepteal/10 text-deepteal border border-deepteal/20 px-3 py-1.5 rounded-full font-medium">✓ Active CNA license</span>
              <span className="text-xs bg-deepteal/10 text-deepteal border border-deepteal/20 px-3 py-1.5 rounded-full font-medium">✓ L2 BG check</span>
              <span className="text-xs bg-deepteal/10 text-deepteal border border-deepteal/20 px-3 py-1.5 rounded-full font-medium">✓ TB test current</span>
              <label className="text-xs flex items-center gap-1.5 cursor-pointer border border-ink/15 px-3 py-1.5 rounded-full hover:bg-mist">
                <input type="checkbox" checked={dementia} onChange={(e) => setDementia(e.target.checked)} className="rounded text-deepteal" />
                Dementia cert required
              </label>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Notes for the caregiver (optional)</label>
            <textarea name="notes" rows={3} placeholder="e.g. 'Park in lot B. Check in with the charge RN.'" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal leading-relaxed" />
          </div>
        </div>

        {/* Step 3 — when */}
        <div className="bg-white border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Step 3</div>
          <h3 className="font-display text-xl font-medium mb-4">When?</h3>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Start date</label>
              <input type="date" name="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              {fieldErr('start_date') && <p className="text-xs text-coral mt-1">{fieldErr('start_date')}</p>}
            </div>
            <div>
              <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">End date</label>
              <input type="date" name="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              {fieldErr('end_date') && <p className="text-xs text-coral mt-1">{fieldErr('end_date')}</p>}
            </div>
          </div>

          <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-2 block">Days of week</label>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {DAYS.map((d) => (
              <button
                type="button"
                key={d.idx}
                onClick={() => toggleDay(d.idx)}
                className={`py-2.5 text-center text-xs font-medium rounded-xl border transition ${
                  days.has(d.idx)
                    ? 'bg-gradient-to-br from-sage to-teal text-cream border-transparent'
                    : 'bg-white border-ink/15 hover:border-teal'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {fieldErr('days') && <p className="text-xs text-coral -mt-3 mb-3">{fieldErr('days')}</p>}

          <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-2 block">Caregivers needed per shift</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPerShift((n) => Math.max(1, n - 1))} className="w-9 h-9 border border-ink/15 rounded-full hover:bg-mist">−</button>
            <input value={perShift} onChange={(e) => setPerShift(Math.max(1, Number(e.target.value) || 1))} className="w-20 text-center px-3 py-2 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
            <button type="button" onClick={() => setPerShift((n) => Math.min(20, n + 1))} className="w-9 h-9 border border-ink/15 rounded-full hover:bg-mist">+</button>
            <span className="text-xs text-ink/50">
              → {perShift} × {matchingDates} {matchingDates === 1 ? 'day' : 'days'} = {totalShifts} shifts
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: summary */}
      <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-4">
        <div className="bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-6 shadow-xl">
          <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">Posting summary</div>
          <div className="font-display text-4xl font-light leading-none">
            <span className="font-medium">{totalShifts}</span> <span className="text-2xl font-light">shifts</span>
          </div>
          <div className="text-cream/85 text-sm mt-2">
            {perShift} × {matchingDates} {matchingDates === 1 ? 'day' : 'days'} · {startDate} – {endDate}
          </div>

          <div className="mt-6 pt-6 border-t border-cream/15 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-cream/80">Shift</span><span>{name}</span></div>
            <div className="flex justify-between"><span className="text-cream/80">Hours per shift</span><span className="font-mono">{hoursPerShift} hrs</span></div>
            <div className="flex justify-between"><span className="text-cream/80">Total hours</span><span className="font-mono">{totalHours} hrs</span></div>
            <div className="flex justify-between"><span className="text-cream/80">Bill rate</span><span className="font-mono">{fmtUSD(Math.round((parseFloat(billDollars) || 0) * 100))} /hr</span></div>
            <div className="flex justify-between font-medium border-t border-cream/15 pt-3"><span>Est. total cost</span><span className="font-display text-lg">{fmtUSD(estCostCents)}</span></div>
          </div>

          <button
            type="submit"
            disabled={submitting || totalShifts === 0}
            className="w-full mt-6 bg-cream text-deepteal py-3 rounded-full text-sm font-medium hover:bg-cream/90 transition disabled:opacity-60"
          >
            {submitting ? 'Posting…' : `Post ${totalShifts} ${totalShifts === 1 ? 'shift' : 'shifts'} →`}
          </button>
          <Link href="/business/dashboard" className="block w-full mt-2 border border-cream/30 text-cream py-3 rounded-full text-sm hover:bg-cream/10 transition text-center">
            Cancel
          </Link>
          <div className="text-[10px] text-cream/60 mt-3 text-center font-mono">Roster CNAs notified first · everyone else shortly after</div>
        </div>

        <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-4 text-xs text-ink/70 leading-relaxed">
          <div className="font-medium text-ink mb-1">💡 Pro tip</div>
          Post next week's shifts a few days early. Your roster gets first claim — facilities see much
          better fill rates with that lead time.
        </div>
      </aside>
    </form>
  );
}
