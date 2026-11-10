'use client';

/**
 * App-wide error screen. Without this, a page that fails on the server
 * during navigation can leave someone looking at the previous page with no
 * idea anything went wrong.
 */

import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-cream">
      <div className="max-w-md text-center">
        <div className="text-4xl mb-4" aria-hidden="true">🌤️</div>
        <h1 className="font-display text-3xl font-medium mb-2">Something didn&rsquo;t load</h1>
        <p className="text-ink/70 leading-relaxed mb-6">
          That&rsquo;s on us, not you. Try again, and if it keeps happening, let us know through Help.
          {error.digest && <span className="block mt-2 text-xs font-mono text-ink/40">Ref: {error.digest}</span>}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-deepteal text-cream px-6 py-2.5 font-medium hover:bg-inkdark transition"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-ink/15 px-6 py-2.5 font-medium hover:bg-mist transition">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
