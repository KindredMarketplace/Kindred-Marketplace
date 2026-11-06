/**
 * GET /api/tags?category=food&q=app[&limit=8]
 *
 * Autocomplete suggestions from the shared tag_bank, for the self-growing tag
 * system. Returns up to `limit` matching labels for a category, prioritizing:
 *   1. approved (curated/seed) tags over pending (community-submitted)
 *   2. prefix matches over substring matches
 *   3. more popular tags (usage_count)
 *
 * Public read (anyone can get suggestions). The actual recording of new tags
 * happens server-side when a profile saves — see saveCareProfileAction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = new Set(['food', 'movie', 'show', 'music', 'hobby', 'care_need']);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? '';
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10) || 8, 20);

  if (!ALLOWED.has(category)) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from('tag_bank')
    .select('label, status, usage_count, label_norm')
    .eq('category', category);

  if (q) {
    // Substring match on the normalized label.
    query = query.ilike('label_norm', `%${q}%`);
  }

  const { data, error } = await query.limit(40);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  // Rank: prefix matches first, then approved over pending, then popularity.
  const ranked = rows
    .map((r) => {
      const isPrefix = q ? r.label_norm.startsWith(q) : false;
      return { r, isPrefix };
    })
    .sort((a, b) => {
      if (a.isPrefix !== b.isPrefix) return a.isPrefix ? -1 : 1;
      const aApproved = a.r.status === 'approved' ? 1 : 0;
      const bApproved = b.r.status === 'approved' ? 1 : 0;
      if (aApproved !== bApproved) return bApproved - aApproved;
      return (b.r.usage_count ?? 0) - (a.r.usage_count ?? 0);
    })
    .slice(0, limit)
    .map((x) => x.r.label);

  return NextResponse.json({ suggestions: ranked });
}
