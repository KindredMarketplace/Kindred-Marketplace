'use client';

/**
 * JobApplyModal — replaces the old instant-apply button.
 *
 * Pattern is LinkedIn's connect-with-note: a small modal opens when the CNA
 * clicks "Express interest", they can leave a short intro message and an
 * optional proposed rate, then submit. The profile IS the application — this
 * note is just the introduction.
 *
 * Idempotent: if the CNA already applied, the action returns `already_applied`
 * and we still flip to the applied state. Parent decides the initial state via
 * the alreadyApplied prop.
 *
 * IMPORTANT: the modal is rendered into document.body via createPortal. This
 * is required because the job cards on /cna/jobs use `transform: translateY()`
 * on hover (via the .card-hover class). Any ancestor with `transform` makes
 * `position: fixed` children stick INSIDE the transformed box instead of the
 * viewport — the modal ends up clipped/flickery. Portaling to body escapes
 * every parent's transform/stacking context.
 */

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { applyToJobAction } from '@/app/cna/jobs/actions';

export function JobApplyModal({
  jobId,
  jobTitle,
  budgetHint,
  alreadyApplied = false,
  buttonClassName,
  buttonLabel = 'Express interest',
}: {
  jobId: string;
  jobTitle: string;
  budgetHint?: string;
  alreadyApplied?: boolean;
  buttonClassName?: string;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Only render the portal once we're in the browser. Avoids "document is not
  // defined" during SSR + the React 18 hydration mismatch warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock body scroll while the modal is open so the page doesn't scroll
  // behind it. Reset on close/unmount.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set('job_id', jobId);
    if (message.trim()) fd.set('message', message.trim());
    if (proposedRate) {
      const cents = Math.round(parseFloat(proposedRate) * 100);
      if (!isNaN(cents) && cents > 0) fd.set('proposed_rate_cents', String(cents));
    }
    startTransition(async () => {
      const res = await applyToJobAction(fd);
      if (res.ok) {
        setApplied(true);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  if (applied) {
    return (
      <button
        type="button"
        disabled
        className={
          buttonClassName ??
          'flex-1 text-xs py-2 bg-sage/20 text-deepteal border border-sage/40 rounded-full cursor-default'
        }
      >
        ✓ You applied
      </button>
    );
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={() => !pending && setOpen(false)}
    >
      <div
        className="bg-cream w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-ink/10">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Apply to</div>
          <div className="font-display text-xl font-medium leading-tight">{jobTitle}</div>
          {budgetHint && <div className="text-xs text-ink/60 font-mono mt-1">{budgetHint}</div>}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Add a quick note <span className="text-ink/40">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A sentence or two on why you'd be a good fit. The family already sees your profile, photo, and reviews — this is just your introduction."
              className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal leading-relaxed"
              maxLength={1500}
            />
            <div className="text-[10px] text-ink/40 font-mono mt-1 text-right">{message.length} / 1500</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Your hourly rate for this job <span className="text-ink/40">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                placeholder="Leave blank to use your default rate"
                className="w-full pl-8 pr-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {error && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 text-xs text-coral">{error}</div>
          )}

          <div className="bg-mist/40 border border-ink/10 rounded-xl p-3 text-[11px] text-ink/70 leading-relaxed">
            <strong>One per job.</strong> You can withdraw any time before they decide. You can't
            message the family until they accept — this avoids overwhelming them.
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="px-4 py-2 text-sm border border-ink/15 rounded-full hover:bg-mist transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="bg-deepteal text-cream px-5 py-2 rounded-full text-sm hover:bg-inkdark transition disabled:opacity-60"
          >
            {pending ? 'Sending…' : 'Send application'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          'flex-1 text-xs py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition'
        }
      >
        {buttonLabel}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
