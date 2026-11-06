'use server';

/**
 * Server actions for messaging — used by both client and CNA portals.
 *
 * Three actions:
 *   - startMessageThreadAction: family-initiated outreach (browse OR
 *     application-review). Idempotent. Creates the thread in pending_request,
 *     inserts the first message, returns the thread id.
 *   - sendMessageAction: send a message in an existing thread. The DB trigger
 *     handles the "first reply from recipient promotes to accepted" logic.
 *   - markThreadReadAction: mark all unread messages in a thread as read for
 *     the current user. Fires when the user opens a thread page.
 *
 * IMPORTANT: CNAs cannot initiate threads with families. Only families can
 * cold-outreach. This prevents inbox flooding from caregivers spamming
 * families about job posts. Enforced here AND by RLS.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getMyAccess } from '@/lib/membership';
import { getOrCreateThread } from '@/lib/messaging';

// ---------------------------------------------------------------------------
// startMessageThreadAction — family initiates a thread with a CNA.
// ---------------------------------------------------------------------------

const StartThreadSchema = z.object({
  cna_id: z.string().uuid('That caregiver link looks malformed.'),
  body: z.string().trim().min(1, 'Write at least a sentence.').max(2000),
  started_via: z.enum(['browse', 'application_review']),
  job_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type StartThreadResult =
  | { ok: true; threadId: string }
  | { ok: false; error: string };

export async function startMessageThreadAction(formData: FormData): Promise<StartThreadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = StartThreadSchema.safeParse({
    cna_id: formData.get('cna_id')?.toString() ?? '',
    body: formData.get('body')?.toString() ?? '',
    started_via: formData.get('started_via')?.toString() ?? '',
    job_id: formData.get('job_id')?.toString() || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not start message.' };
  }

  // Confirm the initiator is acting as a client (has a client_profiles row).
  // CNAs can't cold-outreach families — only the other way around.
  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!clientProfile) {
    return {
      ok: false,
      error: 'Only families can start a new conversation. Caregivers reply after a family reaches out.',
    };
  }

  // Membership gate (locked preview). The database enforces this too
  // (message_threads insert policy); this check just gives a clear message.
  // Families who are already connected to this caregiver (e.g. via a job
  // application) can always talk.
  const access = await getMyAccess(supabase);
  if (!access?.is_member) {
    const { data: visible } = await supabase
      .from('cna_profiles')
      .select('user_id')
      .eq('user_id', parsed.data.cna_id)
      .maybeSingle();
    if (!visible) {
      return {
        ok: false,
        error: 'Messaging caregivers opens with a Kindred membership. See Membership in your menu.',
      };
    }
  }

  // Confirm the recipient is actually a CNA.
  const { data: cnaProfile } = await supabase
    .from('cna_profiles')
    .select('user_id')
    .eq('user_id', parsed.data.cna_id)
    .maybeSingle();
  if (!cnaProfile) {
    return { ok: false, error: 'That caregiver isn\u2019t available to message.' };
  }

  // Get-or-create thread. Idempotent.
  const threadResult = await getOrCreateThread(supabase, {
    userA: user.id,
    userB: parsed.data.cna_id,
    startedBy: user.id,
    startedVia: parsed.data.started_via,
    initialStatus: 'pending_request',
    jobId: parsed.data.job_id,
  });
  if (!threadResult.ok) return { ok: false, error: threadResult.error };

  // Insert the first message. The trigger updates last_message_at + unread.
  const { error: msgError } = await supabase.from('messages').insert({
    thread_id: threadResult.threadId,
    sender_id: user.id,
    recipient_id: parsed.data.cna_id,
    body: parsed.data.body,
  });
  if (msgError) return { ok: false, error: msgError.message };

  revalidatePath('/client/messages');
  revalidatePath('/cna/messages');
  return { ok: true, threadId: threadResult.threadId };
}

// ---------------------------------------------------------------------------
// sendMessageAction — reply in an existing thread.
// ---------------------------------------------------------------------------

const SendMessageSchema = z.object({
  thread_id: z.string().uuid('That conversation link looks malformed.'),
  body: z.string().trim().min(1, 'Write something to send.').max(2000),
});

export type SendMessageResult = { ok: true } | { ok: false; error: string };

export async function sendMessageAction(formData: FormData): Promise<SendMessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const parsed = SendMessageSchema.safeParse({
    thread_id: formData.get('thread_id')?.toString() ?? '',
    body: formData.get('body')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not send message.' };
  }

  // Load the thread to determine the recipient + confirm participation.
  const { data: thread } = await supabase
    .from('message_threads')
    .select('id, participant_a, participant_b, status')
    .eq('id', parsed.data.thread_id)
    .maybeSingle();

  if (!thread) return { ok: false, error: 'Conversation not found.' };
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    return { ok: false, error: 'You\u2019re not a participant in this conversation.' };
  }
  if (thread.status === 'blocked' || thread.status === 'declined') {
    return { ok: false, error: 'This conversation is closed.' };
  }

  const recipientId =
    thread.participant_a === user.id ? thread.participant_b : thread.participant_a;

  const { error } = await supabase.from('messages').insert({
    thread_id: thread.id,
    sender_id: user.id,
    recipient_id: recipientId,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/client/messages');
  revalidatePath('/cna/messages');
  revalidatePath(`/client/messages/${thread.id}`);
  revalidatePath(`/cna/messages/${thread.id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// markThreadReadAction — mark all unread messages in a thread as read.
// ---------------------------------------------------------------------------

const MarkReadSchema = z.object({
  thread_id: z.string().uuid(),
});

export async function markThreadReadAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = MarkReadSchema.safeParse({
    thread_id: formData.get('thread_id')?.toString() ?? '',
  });
  if (!parsed.success) return;

  // Update only messages addressed to the current user that are still unread.
  // The DB trigger (messages_after_read) decrements the unread_count_* column.
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', parsed.data.thread_id)
    .eq('recipient_id', user.id)
    .is('read_at', null);

  revalidatePath('/client/messages');
  revalidatePath('/cna/messages');
}

// ---------------------------------------------------------------------------
// Wrapper used by the family's "Message" button on browse/application cards.
// Redirects on success so the family lands directly in their new thread.
// On error, returns the result; the caller renders the message inline.
// ---------------------------------------------------------------------------

export async function startThreadAndOpenAction(
  formData: FormData,
): Promise<StartThreadResult> {
  const result = await startMessageThreadAction(formData);
  if (result.ok) {
    redirect(`/client/messages/${result.threadId}`);
  }
  return result;
}
