'use client';

/**
 * WelcomeCelebration — the one-time "You're in!" moment, shown the first time
 * a caregiver opens the app after Kindred accepts them (application_status
 * 'verifying' or 'approved' and welcome_seen_at is null).
 *
 * Confetti is a small hand-rolled canvas animation in the brand palette (no
 * library, nothing loaded from outside, CSP-safe). Skipped entirely for people
 * who ask their device for reduced motion. Dismissing records welcome_seen_at
 * so it never shows again, on any device.
 */

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { dismissWelcomeAction } from '@/app/cna/welcome-actions';
import { KindredMark } from '@/components/KindredMark';

const COLORS = ['#E89B85', '#8FC9B5', '#F4D8A8', '#5BA9B8', '#7BB3D6', '#2E6E73'];

type Piece = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; w: number; h: number; c: string };

function runConfetti(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const W = () => window.innerWidth;
  const pieces: Piece[] = [];
  const burst = (n: number, fromX: number) => {
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: fromX,
        y: window.innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: -8 - Math.random() * 10,
        r: 0,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }
  };
  burst(90, W() * 0.3);
  burst(90, W() * 0.7);
  const second = window.setTimeout(() => burst(70, W() * 0.5), 450);

  let raf = 0;
  const start = performance.now();
  const tick = (t: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const age = (t - start) / 1000;
    for (const p of pieces) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 3) / 1.2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
      ctx.restore();
    }
    if (age < 4.4) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(second);
    window.removeEventListener('resize', resize);
  };
}

export function WelcomeCelebration({ firstName, listed }: { firstName: string; listed: boolean }) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    return runConfetti(canvasRef.current);
  }, [open]);

  function close(goTo?: string) {
    startTransition(async () => {
      await dismissWelcomeAction();
      setOpen(false);
      if (goTo) router.push(goTo);
      else router.refresh();
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="absolute inset-0 bg-inkdark/50 backdrop-blur-sm" />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 w-full h-full" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-3xl bg-cream border border-ink/10 shadow-2xl p-7 text-center fade-up">
        <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center">
          <KindredMark size={52} />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Welcome to Kindred</div>
        <h2 id="welcome-title" className="font-display text-4xl font-medium leading-tight mb-3">
          You&rsquo;re in, {firstName}!
        </h2>
        <p className="text-ink/70 leading-relaxed mb-6">
          {listed
            ? 'Families can find you now. Set your rate and availability, and keep an eye on your messages.'
            : 'We loved meeting you. Three last things and families can find you: your Level 2 background check, a photo ID and your liability insurance.'}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => close(listed ? '/cna/profile' : '/cna/compliance')}
            className="w-full rounded-full bg-deepteal text-cream px-6 py-3 font-medium hover:bg-inkdark transition disabled:opacity-60"
          >
            {listed ? 'Finish my profile' : 'Start my onboarding'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => close()}
            className="w-full rounded-full px-6 py-2.5 text-sm text-ink/70 hover:bg-mist transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
