'use client';

/**
 * Tap the profile picture to change it.
 *
 * The photo is shrunk in the browser to a 640px square-ish JPEG (phone photos
 * are often 3–8 MB), uploaded straight to the caregiver's own folder in
 * kindred-avatars (storage rules only allow their folder), then saved as the
 * profile photo by setProfilePhotoAction.
 */

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setProfilePhotoAction } from '@/app/cna/profile/actions';

const MAX_SIDE = 640;

async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    if (blob) return blob;
  } catch {
    // Fall through: upload the original if the browser can't decode it here.
  }
  return file;
}

export function AvatarUpload({
  userId,
  photoUrl,
  initials,
  avatarClass,
}: {
  userId: string;
  photoUrl: string | null;
  initials: string;
  avatarClass: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(photoUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMsg('Please choose a photo.');
    if (file.size > 25 * 1024 * 1024) return setMsg('That photo is too large. Try another.');

    setBusy(true);
    setMsg(null);
    try {
      const blob = await shrink(file);
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      if (blob.size > 5 * 1024 * 1024) throw new Error('too big');
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await createClient()
        .storage.from('kindred-avatars')
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (error) throw error;
      const res = await setProfilePhotoAction(path);
      if (!res.ok || !res.url) throw new Error(res.message);
      setUrl(res.url);
      setMsg('Photo updated.');
    } catch (err) {
      setMsg(err instanceof Error && err.message && err.message !== 'too big' ? err.message : 'That photo didn’t upload. Try a different one.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change your profile photo"
        className="group relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl ring-4 ring-cream shadow-xl overflow-hidden block"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Your profile photo" className="w-full h-full object-cover" />
        ) : (
          <span className={`w-full h-full ${avatarClass} flex items-center justify-center text-cream font-display text-4xl sm:text-5xl font-medium`}>
            {initials}
          </span>
        )}
        <span
          className={`absolute inset-x-0 bottom-0 bg-inkdark/60 text-cream text-[11px] py-1 text-center transition ${
            busy ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          {busy ? 'Uploading…' : url ? 'Change photo' : 'Add photo'}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {msg && (
        <p role="status" className="absolute left-0 top-full mt-2 w-48 text-xs text-ink/70">
          {msg}
        </p>
      )}
    </div>
  );
}
