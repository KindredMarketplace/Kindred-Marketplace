'use client';

/**
 * ApplicantDecisionButtons — Accept / Decline a single applicant on the
 * client's job-detail page. Accept fires acceptApplicantAction (which also
 * rejects other applicants, creates the booking, AND creates/promotes the
 * message thread). Decline fires declineApplicantAction.
 *
 * When accept succeeds we capture the thread id from the action's response
 * and show a "Message [first name] →" deep-link next to the Hired chip so
 * the family can immediately send a "welcome aboard" note.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { acceptApplicantAction, declineApplicantAction } from '@/app/client/jobs/actions';

export function ApplicantDecisionButtons({
  applicationId,
  applicantFirstName,
  status,
  /**
   * Optional pre-resolved thread id (when the client already started a thread
   * with this CNA before hiring). Used to render the deep-link even on first
   * page load — not just after the user clicks Accept.
   */
  existingThreadId,
}: {
  applicationId: string;
  applicantFirstName: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'withdrawn' | 'accepted';
  existingThreadId?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [finalStatus, setFinalStatus] = useState<typeof status>(status);
  const [threadId, setThreadId] = useState<string | null>(existingThreadId ?? null);

  function fire(kind: 'accept' | 'decline') {
    setError(null);
    const fd = new FormData();
    fd.set('application_id', applicationId);
    startTransition(async () => {
      const res =
        kind === 'accept' ? await acceptApplicantAction(fd) : await declineApplicantAction(fd);
      if (!res.ok) {
        setError(String(res.error));
      } else {
        setFinalStatus(kind === 'accept' ? 'accepted' : 'rejected');
        if (kind === 'accept' && 'thread_id' in res) {
          setThreadId(String(res.thread_id));
        }
      }
    });
  }

  if (finalStatus === 'accepted') {
    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono bg-sage/20 text-deepteal border border-sage/40">
          ✓ Hired
        </span>
        {threadId && (
          <Link
            href={`/client/messages/${threadId}`}
            className="text-xs px-3.5 py-1.5 bg-deepteal text-cream rounded-full hover:bg-inkdark transition"
          >
            Message {applicantFirstName} →
          </Link>
        )}
      </div>
    );
  }
  if (finalStatus === 'rejected') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono bg-creamdark text-ink/60 border border-ink/15">
        Declined
      </span>
    );
  }
  if (finalStatus === 'withdrawn') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono bg-creamdark text-ink/60 border border-ink/15">
        Withdrew
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fire('decline')}
          disabled={pending}
          className="text-xs px-3.5 py-1.5 border border-ink/15 rounded-full hover:bg-mist transition disabled:opacity-60"
        >
          {pending ? '…' : 'Decline'}
        </button>
        <button
          type="button"
          onClick={() => fire('accept')}
          disabled={pending}
          className="text-xs px-4 py-1.5 bg-deepteal text-cream rounded-full hover:bg-inkdark transition disabled:opacity-60"
        >
          {pending ? 'Working…' : 'Accept & hire'}
        </button>
      </div>
      {error && <div className="text-[10px] text-coral max-w-xs text-right">{error}</div>}
    </div>
  );
}
