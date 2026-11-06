'use server';

/**
 * Contact form submission. Stores the message in contact_messages so real
 * inbound is captured (admins read it) — no fake phone tree, no dropped data.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Please add your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  role: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Tell us a little more.').max(5000),
});

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitContactAction(input: unknown): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse(input);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc.from('contact_messages') as any).insert({
    name: data.name,
    email: data.email,
    role: data.role || null,
    message: data.message,
  });

  if (error) {
    return { ok: false, error: 'Something went wrong sending your message. Please try again.' };
  }
  return { ok: true };
}
