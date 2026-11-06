'use client';

/**
 * StartMessageModal — family-side first-message modal.
 *
 * Used in two places:
 *   1. /client/browse caregiver cards (started_via='browse')
 *   2. /client/jobs/[id] applicant cards — Phase B (started_via='application_review')
 *
 * The action is idempotent at the thread level: if a thread between this
 * family + CNA already exists, no duplicate is created. The first message
 * is still inserted though, which is what the family wants (a follow-up
 * note doesn't get swallowed).
 *
 * IMPORTANT: rendered into document.body via createPortal. Same reason as
 * JobApplyModal — the browse + applicant cards use `transform: translateY()`
 * on hover, which traps `position: fixed` descendants. Portaling escapes.
 */

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { startThreadAndOpenAction } from '@/app/messages/actions';

export function StartMessageModal({
  cnaId,
  cnaName,
  cnaSubtitle,
  startedVia,
  jobId,
  buttonClassName,
  buttonLabel = 'Message',
  helperText,
}: {
  cnaId: string;
  cnaName: string;
  cnaSubtitle?: string;
  startedVia: 'browse' | 'application_review';
  jobId?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  /** Extra context shown in the modal (e.g., the job title for applicant outreach). */
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit() {
    if (!body.trim()) {
      setError('Write at least a sentence.');
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set('cna_id', cnaId);
    fd.set('body', body.trim());
    fd.set('started_via', startedVia);
    if (jobId) fd.set('job_id', jobId);
    startTransition(async () => {
      const res = await startThreadAndOpenAction(fd);
      // Success redirects via the action; only land here on error.
      if (res && !res.ok) setError(res.error);
    });
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
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Message</div>
          <div className="font-display text-xl font-medium leading-tight">{cnaName}</div>
          {cnaSubtitle && <div className="text-xs text-ink/60 font-mono mt-1">{cnaSubtitle}</div>}
          {helperText && <div className="text-xs text-ink/60 mt-2">{helperText}</div>}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Your first message
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Say hi, share what kind of care you're looking for, and what days/times you'd want."
              className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal leading-relaxed"
              maxLength={2000}
              autoFocus
            />
            <div className="text-[10px] text-ink/40 font-mono mt-1 text-right">{body.length} / 2000</div>
          </div>

          {error && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 text-xs text-coral">{error}</div>
          )}

          <div className="bg-mist/40 border border-ink/10 rounded-xl p-3 text-[11px] text-ink/70 leading-relaxed">
            <strong>How this works.</strong> Your message lands in {cnaName.split(' ')[0]}&rsquo;s
            Requests folder. The moment they reply, your conversation moves into both your main
            inboxes &mdash; no extra approval step.
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
            {pending ? 'Sending…' : 'Send message'}
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
          'text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition'
        }
      >
        {buttonLabel}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
