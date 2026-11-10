/**
 * BrandLoader — what people see while a page is on its way.
 *
 *   full    the first screen when the app opens: the K turns in, then the
 *           word "Kindred" draws out beside it, then a soft pulse and a
 *           moving line underneath while the page finishes loading.
 *   inline  switching tabs inside the caregiver / family app: just the K,
 *           breathing, under the header (the header + tab bar stay put).
 *           Waits a beat before appearing so fast pages don't flash it.
 *
 * Pure CSS (globals.css: .kl-*), no JavaScript, so it shows the instant the
 * server starts streaming. Calmer for people who ask for reduced motion.
 */

import Image from 'next/image';

export function BrandLoader({ variant = 'full' }: { variant?: 'full' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <div className="kl-inline min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Image src="/brand/kindred-k.png" width={56} height={56} alt="" aria-hidden="true" className="kl-breathe" priority />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-cream flex flex-col items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center">
        <Image src="/brand/kindred-k.png" width={72} height={72} alt="" aria-hidden="true" className="kl-k" priority />
        <span className="kl-word font-display text-5xl font-medium tracking-tight text-ink" aria-hidden="true">
          <span className="pl-3">Kindred</span>
        </span>
      </div>
      <div className="kl-line absolute left-1/2 top-[calc(50%+64px)] -translate-x-1/2 h-[3px] w-40 rounded-full bg-ink/10 overflow-hidden" aria-hidden="true">
        <span />
      </div>
      <span className="sr-only">Loading Kindred</span>
    </div>
  );
}
