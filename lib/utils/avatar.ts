/**
 * Avatar helpers — derive initials and a stable gradient class from a name.
 *
 * The mocks use 7 avatar gradient classes (av-1 .. av-7). We hash the name
 * to pick one consistently, so the same person always gets the same color.
 */

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Pick one of the 7 avatar gradient classes based on the name.
 * Deterministic — same input always yields the same class.
 */
export function avatarClass(seed: string | null | undefined): string {
  const s = seed ?? '';
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  const n = (Math.abs(hash) % 7) + 1;
  return `av-${n}`;
}
