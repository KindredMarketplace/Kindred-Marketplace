'use client';

/**
 * /apply — the public CNA application. Stage 1 front door.
 *
 * Deliberately small: a resume, a few contact fields, and one short video or
 * audio answer to a single prompt. Low friction to apply; the bar lives in the
 * review, not the form.
 *
 * Files upload straight from the browser to private storage via signed URLs
 * (see ./actions.ts), so big videos never pass through the server.
 */

import { useState } from 'react';
import Link from 'next/link';
import { KindredMark } from '@/components/KindredMark';
import { createClient } from '@/lib/supabase/client';
import { MediaAnswer } from './MediaAnswer';
import {
  createApplicationAction,
  finalizeApplicationAction,
  type CreateApplicationResult,
} from './actions';

const BUCKET = 'kindred-documents';
const MEDIA_MAX_MB = 300;
const RESUME_MAX_MB = 15;
const HOURS_MAX_MB = 15;

const PROMPT =
  'Tell us about a client who stuck with you — something they said or did, good or hard, that you still carry. (Please don\u2019t use their real name.)';

type FieldErrors = Record<string, string>;

function extOf(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() ?? '' : '';
  if (fromName) return fromName.toLowerCase();
  const sub = file.type.split('/')[1] ?? '';
  return sub.toLowerCase();
}

export default function ApplyPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [hours, setHours] = useState<File | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [phase, setPhase] = useState<'idle' | 'working' | 'done'>('idle');
  const [signedIn, setSignedIn] = useState(false);
  const [progress, setProgress] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setTopError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Client-side guards for the files (not in FormData as fields).
    const localErrors: FieldErrors = {};
    if (!resume) localErrors.resume = 'Please attach your resume.';
    else if (resume.size > RESUME_MAX_MB * 1024 * 1024)
      localErrors.resume = `Resume must be under ${RESUME_MAX_MB} MB.`;

    if (!hours) localErrors.hours = 'Please add proof of your hours.';
    else if (hours.size > HOURS_MAX_MB * 1024 * 1024)
      localErrors.hours = `That file must be under ${HOURS_MAX_MB} MB. A PDF or a photo works.`;

    if (!media) localErrors.media = 'Please add your video or audio answer.';
    else if (media.size > MEDIA_MAX_MB * 1024 * 1024)
      localErrors.media = `That file is over ${MEDIA_MAX_MB} MB. Try a shorter take or lower resolution.`;
    else if (!media.type.startsWith('video/') && !media.type.startsWith('audio/'))
      localErrors.media = 'That needs to be a video or audio file.';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const mediaKind: 'video' | 'audio' = media!.type.startsWith('audio/') ? 'audio' : 'video';

    setPhase('working');
    setProgress('Creating your application…');

    const payload = {
      first_name: fd.get('first_name')?.toString() ?? '',
      last_name: fd.get('last_name')?.toString() ?? '',
      pronouns: fd.get('pronouns')?.toString() ?? '',
      email: fd.get('email')?.toString() ?? '',
      password: fd.get('password')?.toString() ?? '',
      phone: fd.get('phone')?.toString() ?? '',
      zip: fd.get('zip')?.toString() ?? '',
      credential: fd.get('credential')?.toString() ?? '',
      license_number: fd.get('license_number')?.toString() ?? '',
      experience_hours: fd.get('experience_hours')?.toString() ?? '',
      resume_ext: extOf(resume!),
      hours_ext: extOf(hours!),
      media_ext: extOf(media!),
      media_kind: mediaKind,
    };

    let created: CreateApplicationResult;
    try {
      created = await createApplicationAction(payload);
    } catch {
      setPhase('idle');
      setTopError('Something went wrong. Please try again.');
      return;
    }

    if (!created.ok) {
      setPhase('idle');
      setTopError(created.error);
      if (created.fieldErrors) setErrors(created.fieldErrors);
      return;
    }

    const supabase = createClient();

    setProgress('Uploading your resume…');
    const up1 = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(created.resume.path, created.resume.token, resume!);
    if (up1.error) {
      setPhase('idle');
      setTopError('Your resume failed to upload. Please try again.');
      return;
    }

    setProgress('Uploading your proof of hours…');
    const upH = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(created.hours.path, created.hours.token, hours!);
    if (upH.error) {
      setPhase('idle');
      setTopError('Your proof of hours failed to upload. Please try again.');
      return;
    }

    setProgress(mediaKind === 'audio' ? 'Uploading your audio…' : 'Uploading your video…');
    const up2 = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(created.media.path, created.media.token, media!);
    if (up2.error) {
      setPhase('idle');
      setTopError('Your recording failed to upload. Please try again.');
      return;
    }

    setProgress('Submitting…');
    const fin = await finalizeApplicationAction({
      userId: created.userId,
      resumePath: created.resume.path,
      mediaPath: created.media.path,
      hoursPath: created.hours.path,
      mediaKind,
    });

    if (!fin.ok) {
      setPhase('idle');
      setTopError(fin.error);
      return;
    }

    // Sign them in so "Upload my documents" opens straight to their
    // Credentials page. If this fails they can still log in normally.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });
    setSignedIn(!signInErr);
    setPhase('done');
  }

  if (phase === 'done') {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage/25">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight mb-3">
            Your application is in.
          </h1>
          <p className="text-ink/70 max-w-md mx-auto leading-relaxed">
            Thank you for trusting us with your story. A real person reviews every application,
            and if it feels like a fit, we&apos;ll reach out to set up a short conversation.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 text-left">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-4">What happens next</div>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="w-7 h-7 shrink-0 rounded-full bg-sage/30 text-deepteal text-sm font-medium flex items-center justify-center">1</span>
              <div>
                <div className="font-medium">We read your application</div>
                <p className="text-sm text-ink/65 leading-relaxed">Your resume, your hours and your answer. Usually within a few days.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-7 h-7 shrink-0 rounded-full bg-mist text-ink/70 text-sm font-medium flex items-center justify-center">2</span>
              <div>
                <div className="font-medium">A short conversation</div>
                <p className="text-sm text-ink/65 leading-relaxed">If it feels like a fit, we&apos;ll invite you to pick an interview time.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-7 h-7 shrink-0 rounded-full bg-mist text-ink/70 text-sm font-medium flex items-center justify-center">3</span>
              <div>
                <div className="font-medium">You&apos;re in, then the paperwork</div>
                <p className="text-sm text-ink/65 leading-relaxed">
                  Only after we accept you do we ask for your Level 2 background check, ID and liability
                  insurance. We&apos;ll walk you through each one.
                </p>
              </div>
            </li>
          </ol>
          <p className="text-xs text-ink/55 mt-5">
            Log in any time with your email and the password you just made to check where things stand.
          </p>
          <Link
            href={signedIn ? '/cna/dashboard' : '/login'}
            className="mt-4 inline-block text-center rounded-xl bg-deepteal px-6 py-2.5 font-medium text-cream hover:bg-deepteal/90"
          >
            {signedIn ? 'Go to my dashboard' : 'Log in'}
          </Link>
        </div>
      </Shell>
    );
  }

  const working = phase === 'working';

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-medium tracking-tight mb-3">
          Apply to care with Kindred
        </h1>
        <p className="text-ink/70 leading-relaxed">
          We keep this short on purpose. Send us your resume, proof of your hours and a few details,
          then answer one question on camera, or just with your voice if you&apos;d rather. We read
          every one. Nothing else is needed until we&apos;ve met you.
        </p>
      </div>

      {topError && (
        <div role="alert" className="mb-6 rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
          {topError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" name="first_name" error={errors.first_name} required disabled={working} />
          <Field label="Last name" name="last_name" error={errors.last_name} required disabled={working} />
        </div>

        <Field
          label="Pronouns"
          name="pronouns"
          optional
          placeholder="she/her, he/him, they/them…"
          error={errors.pronouns}
          disabled={working}
        />

        {/* Contact */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email" name="email" type="email" error={errors.email} required disabled={working} />
          <Field label="Phone" name="phone" type="tel" error={errors.phone} required disabled={working} />
        </div>

        <div>
          <Field
            label="Create a password"
            name="password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            required
            disabled={working}
          />
          <p className="mt-1 text-xs text-ink/55">
            At least 8 characters. You&apos;ll use it to log back in and see where your application stands.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ZIP code" name="zip" inputMode="numeric" placeholder="32601" error={errors.zip} required disabled={working} />
          <div>
            <label htmlFor="credential" className="block text-sm font-medium mb-1.5">
              Your credential <span className="text-coral">*</span>
            </label>
            <select
              id="credential"
              name="credential"
              required
              disabled={working}
              defaultValue=""
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:border-teal ${errors.credential ? 'border-coral' : 'border-ink/15'}`}
            >
              <option value="" disabled>Choose one</option>
              <option value="cna">CNA (Certified Nursing Assistant)</option>
              <option value="hha">HHA (Home Health Aide)</option>
              <option value="lpn">LPN</option>
              <option value="rn">RN</option>
              <option value="other">Other caregiving experience</option>
            </select>
            {errors.credential && <p className="text-xs text-coral mt-1">{errors.credential}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="License or certificate # (if you have one)"
            name="license_number"
            placeholder="Optional"
            error={errors.license_number}
            disabled={working}
          />
          <Field
            label="Hours of hands-on care experience"
            name="experience_hours"
            inputMode="numeric"
            placeholder="e.g. 3000"
            error={errors.experience_hours}
            required
            disabled={working}
          />
        </div>
        <p className="text-xs text-ink/55 -mt-2">
          Kindred is for experienced caregivers: we ask for at least 1,500 hours of hands-on care. A
          full-time year is about 2,000 hours. Add proof below and we&apos;ll go over it with you in your interview.
        </p>

        {/* Resume */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={working}
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-lg file:border-0 file:bg-ink/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-ink/10"
          />
          {resume && <p className="mt-1 text-xs text-ink/50">{resume.name}</p>}
          {errors.resume && <p className="mt-1 text-xs text-coral">{errors.resume}</p>}
        </div>

        {/* Proof of hours */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Proof of your hours</label>
          <p className="text-xs text-ink/55 mb-2 leading-relaxed">
            Anything that shows your hands-on hours: a letter from a past employer or agency, pay stubs,
            timesheets, or a work history printout. One PDF or photo is fine; you can add more later.
          </p>
          <input
            type="file"
            accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            disabled={working}
            onChange={(e) => setHours(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-lg file:border-0 file:bg-ink/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-ink/10"
          />
          {hours && <p className="mt-1 text-xs text-ink/50">{hours.name}</p>}
          {errors.hours && <p className="mt-1 text-xs text-coral">{errors.hours}</p>}
        </div>

        {/* The one prompt + recording */}
        <div className="rounded-2xl border border-teal/30 bg-sage/10 p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-deepteal mb-2">
            Your one question
          </div>
          <p className="font-display text-xl text-ink leading-snug mb-3">{PROMPT}</p>
          <p className="text-sm text-ink/60 leading-relaxed mb-4">
            Keep it to 2–3 minutes, one take. Don&apos;t script it or worry about lighting or how
            polished you sound — we only care about you. Record on your phone or upload a file.
            Prefer not to be on camera? Audio is just as welcome.
          </p>

          <label className="block text-sm font-medium mb-1.5">Your video or audio answer</label>
          <MediaAnswer value={media} onChange={setMedia} disabled={working} />
          {media && (
            <p className="mt-2 text-xs text-ink/50">
              {media.name} · {(media.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
          {errors.media && <p className="mt-1 text-xs text-coral">{errors.media}</p>}
        </div>

        <button
          type="submit"
          disabled={working}
          className="w-full rounded-xl bg-deepteal px-4 py-3 font-medium text-cream shadow-sm transition hover:bg-deepteal/90 focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {working ? progress || 'Submitting…' : 'Submit application'}
        </button>
        <p className="text-center text-xs text-ink/45">
          We delete your video and resume if your application isn&apos;t moved forward. Your story
          stays yours.
        </p>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 py-5 border-b border-ink/10">
        <Link href="/" className="flex items-center gap-2.5">
          <KindredMark size={36} />
          <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
        </Link>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>
      <footer className="px-6 py-5 text-center text-xs text-ink/40">
        <Link href="/terms" className="hover:text-ink/70 underline">Terms</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-ink/70 underline">Privacy</Link>
        {' · '}
        <span>© 2026 Kindred Marketplace LLC</span>
      </footer>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required,
  optional,
  disabled,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">
        {label}
        {optional && <span className="ml-1 text-ink/40 font-normal">(optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        minLength={type === 'password' ? 8 : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoCapitalize={name === 'email' ? 'none' : undefined}
        className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-60"
      />
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
