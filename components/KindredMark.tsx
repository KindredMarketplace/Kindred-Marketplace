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
