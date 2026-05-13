/**
 * Platform fee calculation. Mirrors the values in public.platform_fee_config.
 *
 * If you change these defaults, also update the platform_fee_config table
 * (or vice versa). The server-side functions read from the DB; this is a
 * client-friendly helper for showing estimates in the UI.
 */

import type { Database } from '@/types/database.types';

type CnaTier = Database['public']['Enums']['cna_tier'];

const FEE_PCT_BY_TIER: Record<CnaTier, number> = {
  new: 0.15,
  verified: 0.12,
  top_rated: 0.1,
};

export interface FeeBreakdown {
  /** Cents the client pays */
  grossCents: number;
  /** Cents kept by Kindred */
  platformFeeCents: number;
  /** Cents transferred to the CNA */
  cnaPayoutCents: number;
  /** Effective fee % (for display) */
  feePct: number;
}

export function calculateFee(
  grossCents: number,
  cnaTier: CnaTier
): FeeBreakdown {
  const feePct = FEE_PCT_BY_TIER[cnaTier];
  const platformFeeCents = Math.round(grossCents * feePct);
  const cnaPayoutCents = grossCents - platformFeeCents;
  return { grossCents, platformFeeCents, cnaPayoutCents, feePct };
}
