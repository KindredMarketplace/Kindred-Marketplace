'use server';

/**
 * Server actions for the public CNA application (Stage 1 front door).
 *
 * Two-phase so that large video uploads go BROWSER -> STORAGE directly and
 * never pass through the server:
 *
 *   1. createApplicationAction  — creates the account + a cna_profiles row at
 *      status 'incomplete', then hands back short-lived signed upload URLs for
 *      the resume and the video/audio answer.
 *   2. (browser uploads the two files straight to storage using those tokens)
 *   3. finalizeApplicationAction — records the file paths and flips the row to
 *      'submitted', which is when it appears in the admin review queue.
 *
 * An application that never finishes uploading stays 'incomplete' and never
 * clutters the review board.
 *
 * No password is collected: the account is created with a random one, and
 * staff use admin "View as" to look at a CNA. No SSN, no driver's license,
 * no demographic data is ever collected here.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BUCKET = 'kindred-documents';

const ApplicationSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required.').max(80),
  last_name: z.string().trim().min(1, 'Last name is required.').max(80),
  pronouns: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(30),
  zip: z.string().trim().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.'),
  credential: z.enum(['cna', 'hha', 'lpn', 'rn', 'other'], {
    errorMap: () => ({ message: 'Choose the credential that fits you best.' }),
  }),
  license_number: z.string().trim().max(40).optional().or(z.literal('')),
  experience_hours: z.coerce
    .number({ invalid_type_error: 'Enter your hours as a number.' })
    .int('Enter a whole number of hours.')
    .min(1500, 'Kindred currently accepts caregivers with at least 1,500 hours of hands-on experience.')
    .max(200000, 'That number looks too high. Please double-check it.'),
  resume_ext: z.string().trim().max(10),
  media_ext: z.string().trim().max(10),
  media_kind: z.enum(['video', 'audio']),
});

export type CreateApplicationResult =
  | {
      ok: true;
      userId: string;
      resume: { path: string; token: string };
      media: { path: string; token: string };
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createApplicationAction(
  input: unknown,
): Promise<CreateApplicationResult> {
  const parsed = ApplicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const data = parsed.data;
  const svc = createServiceClient();

  // 1. Create the auth account (random password; never shown).
  const fullName = `${data.first_name} ${data.last_name}`.trim();
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email: data.email,
    password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'cna' },
  });

  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return {
        ok: false,
        error: 'An application or account already exists for that email.',
        fieldErrors: { email: 'Already in use.' },
      };
    }
    return { ok: false, error: 'Something went wrong creating your application. Please try again.' };
  }

  const userId = created.user.id;

  // 2. Store contact phone on the user row.
  await svc.from('users').update({ phone: data.phone }).eq('id', userId);

  // 3. Create / fill the CNA profile at 'incomplete' until uploads finish.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileErr } = await (svc.from('cna_profiles') as any).upsert(
    {
      user_id: userId,
      display_name: data.first_name,
      last_name: data.last_name,
      pronouns: data.pronouns || null,
      service_zip: data.zip,
      license_number: data.license_number || null,
      credential: data.credential,
      experience_hours_reported: data.experience_hours,
      availability_status: 'inactive',
      application_status: 'incomplete',
    },
    { onConflict: 'user_id' },
  );

  if (profileErr) {
    // Roll back the just-created auth user so we don't leave an orphan.
    await svc.auth.admin.deleteUser(userId);
    return { ok: false, error: 'Something went wrong saving your application. Please try again.' };
  }

  // 4. Signed upload URLs — browser uploads straight to storage with these.
  const safeResumeExt = data.resume_ext.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'pdf';
  const safeMediaExt = data.media_ext.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'mp4';
  const resumePath = `${userId}/application-resume.${safeResumeExt}`;
  const mediaPath = `${userId}/application-media.${safeMediaExt}`;

  const resumeSigned = await svc.storage.from(BUCKET).createSignedUploadUrl(resumePath);
  const mediaSigned = await svc.storage.from(BUCKET).createSignedUploadUrl(mediaPath);

  if (resumeSigned.error || mediaSigned.error || !resumeSigned.data || !mediaSigned.data) {
    await svc.auth.admin.deleteUser(userId);
    return { ok: false, error: 'Could not prepare the file upload. Please try again.' };
  }

  return {
    ok: true,
    userId,
    resume: { path: resumePath, token: resumeSigned.data.token },
    media: { path: mediaPath, token: mediaSigned.data.token },
  };
}

export type FinalizeResult = { ok: true } | { ok: false; error: string };

export async function finalizeApplicationAction(args: {
  userId: string;
  resumePath: string;
  mediaPath: string;
  mediaKind: 'video' | 'audio';
}): Promise<FinalizeResult> {
  // This runs before the applicant has a session, so nothing here is trusted:
  // the ids must be well-formed, the file paths must be this applicant's own
  // two application files, and both files must actually exist.
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!args.userId || !uuid.test(args.userId)) return { ok: false, error: 'Missing application.' };
  if (args.mediaKind !== 'video' && args.mediaKind !== 'audio') return { ok: false, error: 'Missing application.' };
  const ownFile = (p: string, stem: string) =>
    typeof p === 'string' && new RegExp(`^${args.userId}/${stem}\\.[a-z0-9]{1,8}$`, 'i').test(p);
  if (!ownFile(args.resumePath, 'application-resume') || !ownFile(args.mediaPath, 'application-media')) {
    return { ok: false, error: 'Missing application.' };
  }

  const svc = createServiceClient();

  const { data: files } = await svc.storage.from(BUCKET).list(args.userId);
  const names = new Set((files ?? []).map((f) => `${args.userId}/${f.name}`));
  if (!names.has(args.resumePath) || !names.has(args.mediaPath)) {
    return { ok: false, error: 'Your files did not finish uploading. Please try again.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc.from('cna_profiles') as any)
    .update({
      resume_path: args.resumePath,
      application_media_path: args.mediaPath,
      application_media_kind: args.mediaKind,
      application_status: 'submitted',
      application_submitted_at: new Date().toISOString(),
    })
    .eq('user_id', args.userId)
    .eq('application_status', 'incomplete');

  if (error) {
    return { ok: false, error: 'Your files uploaded but we could not submit. Please contact us.' };
  }
  return { ok: true };
}
