/**
 * KindredMark — the "K" Kindred mark (Nov 2026). Replaces the retired
 * circle + heart + plus mark everywhere.
 *
 * Source art: Kindred/Brand/Kindred Logo.png in the vault, trimmed to a
 * square transparent PNG at public/brand/kindred-k.png.
 */

import Image from 'next/image';

export function KindredMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/kindred-k.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      priority
    />
  );
}

/**
 * KindredWordmark — the "Kindred Word Logo" (the K-mark k + "indred"), used
 * top-left across the app. Source: Kindred/Brand/Kindred Word Logo.png,
 * trimmed to public/brand/kindred-wordmark.png (717 x 166).
 */
const WORDMARK_RATIO = 717 / 166;

export function KindredWordmark({ height = 34, className = '' }: { height?: number; className?: string }) {
  return (
    <Image
      src="/brand/kindred-wordmark.png"
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      alt="Kindred"
      className={className}
      priority
    />
  );
}
