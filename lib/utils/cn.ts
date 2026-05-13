/**
 * Tailwind-aware className merger.
 *
 * Combines `clsx` (conditional class lists) with `tailwind-merge` (resolves
 * conflicts like `px-2 px-4` → `px-4`). Use everywhere instead of raw strings:
 *
 *   <div className={cn('px-4 py-2', isActive && 'bg-sage', className)} />
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
