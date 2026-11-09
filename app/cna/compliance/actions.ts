'use server';

/**
 * Caregiver document uploads for the Kindred Standard.
 *
 * The caregiver uploads proof for one of: Level 2 background check, photo ID,
 * liability insurance. The file goes to the PRIVATE kindred-documents bucket
 * under the caregiver's own folder (storage RLS: owner-only), a `documents` row
 * records it, and the matching cna_verifications row is (re)set to `pending`.
 *
 * Only Kindred can mark it verified: the guard trigger from migration 00024
 * forces status = 'pending' for anything a caregiver writes. Uploading a new
 * file always sends that item back to review.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'kindred-documents';
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};
const DOC_TYPE = {
  hours: 'work_history',
  l2bg: 'bg_check',
  identity: 'id_verification',
  insurance: 'liability_insurance',
} as const;
type StandardDoc = keyof typeof DOC_TYPE;

/** Statuses where Kindred has accepted the caregiver ("Accepted, onboarding" or live). */
const ACCEPTED = new Set(['verifying', 'approved']);

export type UploadResult = { ok: true; message: string } | { ok: false; error: string };

export async function uploadVerificationDocAction(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please log in again.' };

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'cna') return { ok: false, error: 'Only caregivers can upload these documents.' };

  const type = formData.get('type')?.toString() as StandardDoc | undefined;
  if (!type || !(type in DOC_TYPE)) return { ok: false, error: 'Unknown document type.' };

  // Background check, ID and insurance come after Kindred accepts you, so
  // nobody spends money on them before knowing they're in.
  if (type !== 'hours') {
    const { data: prof } = await supabase
      .from('cna_profiles')
      .select('application_status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!ACCEPTED.has(prof?.application_status ?? '')) {
      return { ok: false, error: 'This opens once Kindred accepts you. We’ll let you know.' };
    }
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose a file to upload.' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'That file is over 10 MB. Try a smaller photo or PDF.' };
  const ext = MIME_EXT[file.type];
  if (!ext) return { ok: false, error: 'Please upload a PDF or a photo (JPG, PNG, WebP or HEIC).' };

  const expiresRaw = formData.get('expires_at')?.toString().trim() ?? '';
  let expiresAt: string | null = null;
  if (expiresRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresRaw)) return { ok: false, error: 'Enter the expiration date as a date.' };
    if (expiresRaw < new Date().toISOString().slice(0, 10)) {
      return { ok: false, error: 'That document has already expired. Please upload a current one.' };
    }
    expiresAt = expiresRaw;
  }
  if (type === 'hours') expiresAt = null;
  if (type === 'insurance' && !expiresAt) {
    return { ok: false, error: 'Add your policy’s expiration date so we know when to ask for a renewal.' };
  }

  // Never trust the client's file name for the storage path.
  const path = `${user.id}/verification/${type}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { ok: false, error: 'The upload didn’t go through. Please try again.' };

  const safeName = file.name.replace(/[^\w.\- ]+/g, '').slice(0, 120) || `${type}.${ext}`;
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      type: DOC_TYPE[type],
      storage_path: path,
      original_filename: safeName,
      mime_type: file.type,
      size_bytes: file.size,
      expires_at: expiresAt,
    })
    .select('id')
    .single();
  if (docErr || !doc) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: 'We couldn’t save that document. Please try again.' };
  }

  if (type === 'hours') {
    revalidatePath('/cna/compliance');
    return { ok: true, message: 'Added. We’ll look at it when we review your hours.' };
  }

  const { data: existing } = await supabase
    .from('cna_verifications')
    .select('id')
    .eq('cna_id', user.id)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = { status: 'pending' as const, document_id: doc.id, expires_at: expiresAt, verified_at: null };
  const { error: vErr } = existing
    ? await supabase.from('cna_verifications').update(row).eq('id', existing.id)
    : await supabase.from('cna_verifications').insert({ cna_id: user.id, type, ...row });
  if (vErr) return { ok: false, error: 'Your file uploaded, but we couldn’t send it for review. Please try again.' };

  revalidatePath('/cna/compliance');
  revalidatePath('/cna/membership');
  return { ok: true, message: 'Uploaded. We’ll review it and update your status.' };
}
