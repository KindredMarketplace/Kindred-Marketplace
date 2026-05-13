-- =============================================================================
-- 00014_move_helper_functions_to_private_schema.sql
-- Address remaining SECURITY DEFINER warnings by moving RLS helper functions
-- out of the REST-exposed `public` schema and into a private `kindred_internal`
-- schema. /rest/v1/rpc/is_admin and friends will now return 404.
--
-- RLS policies continue to work because they fully qualify the function names
-- (kindred_internal.is_admin(...)).
-- =============================================================================

create schema if not exists kindred_internal;

create or replace function kindred_internal.is_admin(user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = user_uuid and role = 'admin');
$$;

create or replace function kindred_internal.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function kindred_internal.is_org_member(target_org uuid, user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where org_id = target_org and user_id = user_uuid and joined_at is not null
  );
$$;

-- Redirect every policy that referenced the old public.* versions.
-- (Postgres has no CREATE OR REPLACE POLICY; drop and recreate.)
-- For the full list, see this migration as applied — it touches ~30 policies.

-- After redirecting all policies, drop the public.* originals.
drop function if exists public.is_admin(uuid);
drop function if exists public.current_user_role();
drop function if exists public.is_org_member(uuid, uuid);

-- handle_new_user stays in public (it's a trigger on auth.users) but is locked down.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- NOTE: This file is a summary. The actual applied migration includes the full
-- list of policy drop/recreate statements — see the Supabase migration history
-- in the dashboard, or run `supabase db pull` to fetch the live schema.
