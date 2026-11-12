/**
 * SERVER ONLY (the ZIP list is ~800 KB; never import this from a client
 * component).
 *
 * Distance without an API: the middle point of each ZIP code (US Census ZIP
 * Code Tabulation Areas, via the MIT-licensed `us-zips` list, rounded to
 * about 100 m) and straight-line miles between them.
 *
 * ZIP-to-ZIP distance is approximate on purpose: Kindred never shows or uses
 * anyone's street address for distance or the map.
 */

import centroids from './data/zip-centroids.json';

const ZIPS = centroids as unknown as Record<string, [number, number]>;

export type Point = [number, number];

export function zipPoint(zip: string | null | undefined): Point | null {
  if (!zip) return null;
  const z = zip.trim().slice(0, 5);
  return /^\d{5}$/.test(z) ? ZIPS[z] ?? null : null;
}

export function milesBetween(a: Point | null, b: Point | null): number | null {
  if (!a || !b) return null;
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/**
 * A map pin for something in this ZIP, nudged a little (same nudge every
 * time for the same id) so several pins in one ZIP don't sit on top of each
 * other. Still only ever "somewhere in this ZIP".
 */
export function pinPoint(zip: string | null | undefined, id: string): Point | null {
  const p = zipPoint(zip);
  if (!p) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const angle = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = 0.004 + (((h >>> 9) % 100) / 100) * 0.008; // ~0.3–0.8 miles
  return [Math.round((p[0] + r * Math.sin(angle)) * 1000) / 1000, Math.round((p[1] + r * Math.cos(angle)) * 1000) / 1000];
}
