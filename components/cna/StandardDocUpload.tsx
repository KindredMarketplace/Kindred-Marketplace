'use client';

/**
 * StandardDocUpload — one upload card for a Kindred Standard document
 * (Level 2 background check, photo ID or liability insurance).
 */

import { useRef, useState, useTransition } from 'react';
import { uploadVerificationDocAction } from '@/app/cna/compliance/actions';

type Status = 'none' | 'pending' | 'verified' | 'rejected' | 'expired';

const BADGE: Record<Status, { label: string; cls: string }> = {
  none: { label: 'Not uploaded', cls: 'bg-ink/5 text-ink/60' },
  pending: { label: 'In review', cls: 'bg-butter text-deepteal' },
  verified: { label: '✓ Verified', cls: 'bg-sage/30 text-deepteal' },
  rejected: { label: 'Needs a new upload', cls: 'bg-coral/15 text-coral' },
  expired: { label: 'Expired', cls: 'bg-coral/15 text-coral' },
};

export function StandardDocUpload({
  type,
  title,
  help,
  icon,
  status,
  expiresAt,
  askExpiry,
  expiryRequired,
  locked,
  badgeOverride,
  footnote,
}: {
  type: 'hours' | 'l2bg' | 'identity' | 'insurance';
  title: string;
  help: string;
  icon: string;
  status: Status;
  expiresAt: string | null;
  askExpiry: boolean;
  expiryRequired?: boolean;
  /** Not available yet (opens after Kindred accepts the caregiver). */
  locked?: boolean;
  badgeOverride?: { label: string; cls: string };
  footnote?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const badge = locked ? { label: 'After you’re accepted', cls: 'bg-ink/5 text-ink/50' } : badgeOverride ?? BADGE[status];

  function submit(fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await uploadVerificationDocAction(fd);
      if (res.ok) {
        setMsg({ ok: true, text: res.message });
        formRef.current?.reset();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className={`bg-white border border-ink/10 rounded-2xl p-5 flex flex-col ${locked ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-display text-lg font-medium">{title}</h3>
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-ink/60 mt-1 leading-relaxed">{help}</p>
          {expiresAt && (
            <p className="text-xs text-ink/50 mt-1 font-mono">
              Expires {new Date(expiresAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {footnote && <div className="mt-3 text-xs text-ink/60">{footnote}</div>}

      {locked ? (
        <p className="mt-4 text-xs text-ink/55 leading-relaxed">
          🔒 Opens once Kindred accepts you, so you never pay for this before you know you&apos;re in.
        </p>
      ) : (
      <form ref={formRef} action={submit} className="mt-4 space-y-3">
          <input type="hidden" name="type" value={type} />
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            disabled={pending}
            aria-label={`Upload ${title}`}
            className="block w-full text-xs file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-mist file:text-ink file:text-xs hover:file:bg-creamdark"
          />
          {askExpiry && (
            <label className="block text-xs text-ink/60">
              Expiration date{expiryRequired ? '' : ' (if it has one)'}
              <input
                type="date"
                name="expires_at"
                required={expiryRequired}
                disabled={pending}
                className="mt-1 block w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-inkdark transition disabled:opacity-60"
          >
            {pending ? 'Uploading…' : status === 'none' ? 'Upload' : 'Upload a new copy'}
          </button>
          {msg && (
            <p role="status" className={`text-xs ${msg.ok ? 'text-deepteal' : 'text-coral'}`}>
              {msg.text}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
