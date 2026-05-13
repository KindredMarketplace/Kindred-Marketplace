/**
 * Money helpers — everything in the database is stored in cents to avoid
 * floating-point drift. These helpers convert for display.
 */

/**
 * Format cents as a USD string. 1234 → "$12.34"
 */
export function formatCents(cents: number, options?: { showFraction?: boolean }): string {
  const dollars = cents / 100;
  const showFraction = options?.showFraction ?? cents % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parse a dollars-and-cents string into cents. "$12.34" → 1234
 * Returns null if the input is invalid.
 */
export function parseDollars(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return null;
  return Math.round(dollars * 100);
}

/**
 * Format an hourly rate range. Used on job cards and CNA profiles.
 * formatRateRange(2500, 3500) → "$25 – $35/hr"
 */
export function formatRateRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) return `${formatCents(minCents)}/hr`;
  return `${formatCents(minCents, { showFraction: false })} – ${formatCents(maxCents, { showFraction: false })}/hr`;
}
