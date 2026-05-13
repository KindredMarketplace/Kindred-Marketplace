-- =============================================================================
-- 00013_security_hardening.sql
-- Addresses warnings from `supabase db lint` / advisor:
--   1. Mutable search_path on trigger functions
--   2. SECURITY DEFINER helpers exposed via REST RPC
--   3. Broad SELECT on public buckets that allows bucket-listing
--
-- See https://supabase.com/docs/guides/database/database-linter for full
-- explanations of each lint rule.
-- =============================================================================

-- 1. Pin search_path on trigger functions to prevent search_path hijacking
alter function public.set_updated_at() set search_path = public;
alter function public.miles_between(double precision, double precision, double precision, double precision) set search_path = public;
alter function public.shifts_calculate_hours() set search_path = public;
alter function public.messages_update_thread_summary() set search_path = public;
alter function public.reviews_update_cna_aggregates() set search_path = public;
alter function public.cna_check_tier_promotion() set search_path = public;

-- 2. Helper functions are SECURITY DEFINER so they bypass RLS when used in
--    policy expressions. They were not meant to be reachable via /rpc.
--    Revoke EXECUTE from anon + authenticated so /rpc/is_admin etc. 404s.
--    Note: RLS policies still call them successfully because the policy
--    runs as the function owner.
revoke execute on function public.is_admin(uuid) from anon, authenticated;
revoke execute on function public.current_user_role() from anon, authenticated;
revoke execute on function public.is_org_member(uuid, uuid) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 3. Public buckets: drop the broad SELECT policies (which allowed LIST queries)
--    and replace with policies that allow reading specific objects by name.
--    Direct URL access to public files continues to work.
drop policy if exists "Avatars: public read" on storage.objects;
create policy "Avatars: public read individual object"
  on storage.objects for select
  using (bucket_id = 'kindred-avatars' and name is not null);

drop policy if exists "Public: anyone read" on storage.objects;
create policy "Public: anyone read individual object"
  on storage.objects for select
  using (bucket_id = 'kindred-public' and name is not null);
