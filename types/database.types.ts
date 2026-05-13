/**
 * STUB FILE — replace with auto-generated types.
 *
 * To generate proper types after `npm install`:
 *
 *   npm run db:types
 *
 * This runs:
 *   supabase gen types typescript --project-id fibrhkrdyadnuebwovac --schema public
 *
 * The Supabase CLI must be authenticated:
 *   npx supabase login
 *
 * Until then, this minimal stub keeps TypeScript happy so the project compiles.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, { Row: any }>;
    Functions: Record<string, { Args: any; Returns: any }>;
    Enums: {
      cna_tier: 'new' | 'verified' | 'top_rated';
      user_role: 'client' | 'cna' | 'business' | 'admin';
      booking_status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'disputed';
      payer_type:
        | 'self_pay'
        | 'ltc_insurance'
        | 'medicaid'
        | 'medicare_advantage'
        | 'va'
        | 'workers_comp';
      [key: string]: any;
    };
  };
}
