'use client';

/**
 * ClientSetupForm — the multi-step care-setup flow shown after a client signs
 * up (and re-runnable any time from the profile page).
 *
 * Steps:
 *   1. Who needs care      → relationship, recipient name, DOB, ZIP
 *   2. What care is needed → care_types (chips from service_taxonomy)
 *   3. How often           → care_frequency + hours_per_week
 *   4. Budget              → budget_min / budget_max (dollars/hr)
 *   5. Priorities          → what matters most when choosing a caregiver
 *
 * Every step can be skipped (advances without requiring input). The whole flow
 * can be skipped via "Skip for now" → lands on the dashboard, finish later from
 * the profile page. All data is collected client-side then submitted once via
 * saveCareProfileAction so a half-finished flow still saves what was entered.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KindredWordmark } from '@/components/KindredMark';
import { saveCareProfileAction, skipSetupAction } from '@/app/client/setup/actions';

type ServiceOption = { key: string; label: string; category: string };

type Priority = { key: string; label: string; icon: string };

const PRIORITIES: Priority[] = [
  { key: 'experience', label: 'Years of experience', icon: '🎓' },
  { key: 'dementia_trained', label: 'Dementia / memory-care training', icon: '🧠' },
  { key: 'bilingual', label: 'Speaks more than one language', icon: '💬' },
  { key: 'same_caregiver', label: 'Same caregiver every visit', icon: '🤝' },
  { key: 'background_checked', label: 'Background-checked', icon: '🛡️' },
  { key: 'highly_rated', label: 'Highly rated by other families', icon: '⭐' },
  { key: 'non_smoker', label: 'Non-smoker', icon: '🚭' },
  { key: 'has_car', label: 'Has own transportation', icon: '🚗' },
  { key: 'comfortable_pets', label: 'Comfortable with pets', icon: '🐾' },
];

const FREQUENCIES: { key: 'recurring' | 'one_time' | 'live_in' | 'on_call'; label: string; sub: string }[] = [
  { key: 'recurring', label: 'Regular schedule', sub: 'Same days each week' },
  { key: 'one_time', label: 'One-time or occasional', sub: 'A single visit or now and then' },
  { key: 'live_in', label: 'Live-in care', sub: 'Around-the-clock, lives in the home' },
  { key: 'on_call', label: 'On-call / as needed', sub: 'Backup for when things come up' },
];

const RELATIONSHIPS = [
  'Adult child (parent needs care)',
  'Spouse / partner',
  'Sibling',
  'Myself',
  'Other family member',
  'Friend / neighbor',
];

const TOTAL_STEPS = 5;

export function ClientSetupForm({
  services,
  initial,
}: {
  services: ServiceOption[];
  initial: {
    relationship?: string;
    recipientName?: string;
    recipientDob?: string;
    zip?: string;
    careTypes?: string[];
    careFrequency?: string;
    hoursPerWeek?: number;
    budgetMin?: number;
    budgetMax?: number;
    priorities?: string[];
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [relationship, setRelationship] = useState(initial.relationship ?? '');
  const [recipientName, setRecipientName] = useState(initial.recipientName ?? '');
  const [recipientDob, setRecipientDob] = useState(initial.recipientDob ?? '');
  const [zip, setZip] = useState(initial.zip ?? '');
  const [careTypes, setCareTypes] = useState<string[]>(initial.careTypes ?? []);
  const [careFrequency, setCareFrequency] = useState(initial.careFrequency ?? '');
  const [hoursPerWeek, setHoursPerWeek] = useState(initial.hoursPerWeek?.toString() ?? '');
  const [budgetMin, setBudgetMin] = useState(initial.budgetMin?.toString() ?? '');
  const [budgetMax, setBudgetMax] = useState(initial.budgetMax?.toString() ?? '');
  const [priorities, setPriorities] = useState<string[]>(initial.priorities ?? []);

  // Group services by category for the chip picker.
  const grouped = services.reduce<Record<string, ServiceOption[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
  const CATEGORY_LABELS: Record<string, string> = {
    personal_care: 'Personal care',
    mobility: 'Mobility',
    medical_support: 'Medical support',
    household: 'Household help',
    specialty: 'Specialty care',
    companionship: 'Companionship',
    overnight: 'Overnight & live-in',
  };

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function buildFormData(markComplete: boolean): FormData {
    const fd = new FormData();
    if (relationship) fd.set('relationship', relationship);
    if (zip) fd.set('client_zip', zip);
    if (recipientName) fd.set('recipient_name', recipientName);
    if (recipientDob) fd.set('recipient_dob', recipientDob);
    careTypes.forEach((c) => fd.append('care_types', c));
    if (careFrequency) fd.set('care_frequency', careFrequency);
    if (hoursPerWeek) fd.set('hours_per_week', hoursPerWeek);
    if (budgetMin) fd.set('budget_min', budgetMin);
    if (budgetMax) fd.set('budget_max', budgetMax);
    priorities.forEach((p) => fd.append('priorities', p));
    if (markComplete) fd.set('mark_complete', 'true');
    return fd;
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await saveCareProfileAction(buildFormData(true));
      if (res.ok) {
        router.push('/client/dashboard?welcome=1');
      } else {
        setError(res.error);
      }
    });
  }

  function skipEverything() {
    setError(null);
    startTransition(async () => {
      await skipSetupAction();
      router.push('/client/dashboard');
    });
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const pct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-ink/10">
        <div className="flex items-center gap-2.5">
          <KindredWordmark height={30} />
        </div>
        <button
          onClick={skipEverything}
          disabled={isPending}
          className="text-sm text-ink/50 hover:text-ink transition disabled:opacity-50"
        >
          Skip for now →
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-mist">
        <div
          className="h-full bg-gradient-to-r from-sage via-teal to-sky transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">
            Step {step} of {TOTAL_STEPS}
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
              {error}
            </div>
          )}

          {/* ─── STEP 1: Who needs care ─── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight mb-2">
                  Who needs care?
                </h1>
                <p className="text-ink/60">Let&rsquo;s start with the basics. You can change any of this later.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your relationship to them</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelationship(r)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
                        relationship === r
                          ? 'border-teal bg-mist/60 font-medium'
                          : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipientName" className="block text-sm font-medium mb-1.5">
                    Their name {relationship === 'Myself' && <span className="text-ink/40">(you)</span>}
                  </label>
                  <input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Eleanor"
                    className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium mb-1.5">
                    ZIP code <span className="text-ink/40">(where care happens)</span>
                  </label>
                  <input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="32601"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium mb-1.5">
                  Date of birth <span className="text-ink/40">(optional)</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={recipientDob}
                  onChange={(e) => setRecipientDob(e.target.value)}
                  className="w-full sm:w-1/2 rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 2: What care is needed ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight mb-2">
                  What kind of care is needed?
                </h1>
                <p className="text-ink/60">Pick everything that applies — this helps us match the right caregivers.</p>
              </div>

              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
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
              {careTypes.length > 0 && (
                <p className="text-sm text-deepteal font-medium">{careTypes.length} selected</p>
              )}
            </div>
          )}

          {/* ─── STEP 3: How often ─── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight mb-2">
                  How often is care needed?
                </h1>
                <p className="text-ink/60">A rough sense is fine — you can fine-tune when you post a job.</p>
              </div>

              <div className="space-y-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCareFrequency(f.key)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition ${
                      careFrequency === f.key
                        ? 'border-teal bg-mist/60'
                        : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                    }`}
                  >
                    <div className="font-medium">{f.label}</div>
                    <div className="text-sm text-ink/55">{f.sub}</div>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="hours" className="block text-sm font-medium mb-1.5">
                  Roughly how many hours per week? <span className="text-ink/40">(optional)</span>
                </label>
                <input
                  id="hours"
                  type="number"
                  min={1}
                  max={168}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full sm:w-1/2 rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 4: Budget ─── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight mb-2">
                  What&rsquo;s your hourly budget?
                </h1>
                <p className="text-ink/60">
                  Independent CNAs in Florida typically run $22&ndash;$35/hr. A range helps us show caregivers that fit.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="budgetMin" className="block text-sm font-medium mb-1.5">Minimum / hr</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">$</span>
                    <input
                      id="budgetMin"
                      type="number"
                      min={0}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="22"
                      className="w-full rounded-xl border border-ink/20 bg-white pl-8 pr-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                    />
                  </div>
                </div>
                <span className="text-ink/30 mt-6">to</span>
                <div className="flex-1">
                  <label htmlFor="budgetMax" className="block text-sm font-medium mb-1.5">Maximum / hr</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">$</span>
                    <input
                      id="budgetMax"
                      type="number"
                      min={0}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="35"
                      className="w-full rounded-xl border border-ink/20 bg-white pl-8 pr-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink/45">
                This is just a guide for matching — you&rsquo;ll always agree on the exact rate with each caregiver.
              </p>
            </div>
          )}

          {/* ─── STEP 5: Priorities ─── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight mb-2">
                  What matters most to you?
                </h1>
                <p className="text-ink/60">Pick your top priorities. We&rsquo;ll surface caregivers who match them first.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(priorities, setPriorities, p.key)}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-sm transition ${
                      priorities.includes(p.key)
                        ? 'border-teal bg-mist/60 font-medium'
                        : 'border-ink/15 hover:border-teal/40 hover:bg-mist/30'
                    }`}
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="mt-10 flex items-center justify-between gap-3">
            <div>
              {step > 1 && (
                <button
                  onClick={back}
                  disabled={isPending}
                  className="text-sm text-ink/60 hover:text-ink transition disabled:opacity-50"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < TOTAL_STEPS && (
                <button
                  onClick={next}
                  disabled={isPending}
                  className="text-sm text-ink/50 hover:text-ink transition disabled:opacity-50"
                >
                  Skip this step
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  onClick={next}
                  disabled={isPending}
                  className="rounded-full bg-deepteal px-6 py-2.5 font-medium text-cream shadow-sm transition hover:bg-inkdark disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={isPending}
                  className="rounded-full bg-deepteal px-6 py-2.5 font-medium text-cream shadow-sm transition hover:bg-inkdark disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : 'Finish setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
