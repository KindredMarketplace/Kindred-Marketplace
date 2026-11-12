/**
 * Kindred loading visuals (approved Nov 10; reference file:
 * Kindred/Brand/Kindred Loading Animation.html).
 *
 *   <LaunchIntro />            once each time the app is opened: the k from the
 *                              word logo turns, glides left as "indred" unrolls,
 *                              a circle loads around it, then it fades away
 *                              (about 3 s, tap anywhere to skip). Rendered in
 *                              the root layout but hidden by CSS unless the
 *                              tiny head script (LAUNCH_INTRO_SCRIPT) switched
 *                              it on for this visit, so it never flashes on
 *                              later page loads and costs nothing for crawlers.
 *   <BrandLoader variant="full">   while a page is still on its way: the word
 *                              logo with the circle turning around it.
 *   <BrandLoader variant="inline"> switching tabs inside a section: a small
 *                              breathing k under the header (only if slow).
 *
 * Pure CSS (globals.css: .kl-*). Calmer for people who ask for less motion.
 */

import Image from 'next/image';

/** Runs in <head> before first paint. Once per browser/app session. */
export const LAUNCH_INTRO_SCRIPT = `try{var d=document.documentElement;if(!sessionStorage.getItem('kl-intro')&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){d.classList.add('kl-intro-on');sessionStorage.setItem('kl-intro','1');document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('.kl-intro');if(t)t.classList.add('kl-skip');},true);}}catch(e){}`;

function WordmarkRing({ sequence }: { sequence: boolean }) {
  return (
    <div className={`kl-mark ${sequence ? 'kl-seq' : ''}`}>
      <svg className="kl-ring" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={sequence ? 'klg-intro' : 'klg-load'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fc9b5" />
            <stop offset=".5" stopColor="#5ba9b8" />
            <stop offset="1" stopColor="#2e6e73" />
          </linearGradient>
        </defs>
        <circle className="kl-track" cx="50" cy="50" r="48" fill="none" strokeWidth="1.2" />
        <circle
          className="kl-arc"
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={`url(#${sequence ? 'klg-intro' : 'klg-load'})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="40 262"
        />
      </svg>
      <Image src="/brand/kindred-wordmark.png" width={717} height={166} alt="Kindred" className="kl-wm" priority />
    </div>
  );
}

export function LaunchIntro() {
  return (
    <div className="kl-intro fixed inset-0 z-[100] bg-cream items-center justify-center" aria-hidden="true">
      <WordmarkRing sequence />
    </div>
  );
}

export function BrandLoader({ variant = 'full' }: { variant?: 'full' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <div className="kl-inline min-h-[calc(100dvh-14rem)] lg:min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
        <Image src="/brand/kindred-k.png" width={56} height={56} alt="" aria-hidden="true" className="kl-breathe" priority />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-cream flex items-center justify-center" role="status" aria-live="polite">
      <WordmarkRing sequence={false} />
      <span className="sr-only">Loading Kindred</span>
    </div>
  );
}
