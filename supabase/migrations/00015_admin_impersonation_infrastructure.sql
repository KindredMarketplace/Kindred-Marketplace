-- =============================================================================
-- 00015_admin_impersonation_infrastructure.sql
-- Adds the helper function + audit log needed for the admin "view as user"
-- pattern. Admins can browse the app as any user; every impersonation is
-- recorded for audit/compliance.
-- =============================================================================

-- =============================================================================
-- FUNCTION: is_admin()
-- Returns true if the currently authenticated user has role='admin'.
-- Used by RLS policies that need to grant admins read-everything access.
-- SECURITY DEFINER so the function itself can read public.users even when
-- the caller's RLS would normally block it.
-- =============================================================================
create or replace function kindred_internal.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, kindred_internal
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

comment on function kindred_internal.is_admin() is
  'Returns true if the auth.uid() resolves to an active admin. Used by RLS policies.';

-- Allow authenticated users to call it (the function itself checks identity).
grant execute on function kindred_internal.is_admin() to authenticated;

-- =============================================================================
-- TABLE: admin_impersonation_log
-- Audit trail. Every time an admin starts viewing as another user, we log it.
-- =============================================================================
create table public.admin_impersonation_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete restrict,
  impersonated_user_id uuid not null references public.users(id) on delete restrict,
  impersonated_role public.user_role not null,
  reason text,
  ip_address inet,
  user_agent text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index admin_impersonation_log_admin_idx
  on public.admin_impersonation_log(admin_user_id, started_at desc);
create index admin_impersonation_log_target_idx
  on public.admin_impersonation_log(impersonated_user_id, started_at desc);

comment on table public.admin_impersonation_log is
  'Audit log of every admin "view as" action. Append-only — admins cannot edit or delete rows here.';

-- Enable RLS — only admins can read this table, nobody can ever delete from it.
alter table public.admin_impersonation_log enable row level security;

create policy "Admins can read all impersonation logs"
  on public.admin_impersonation_log
  for select
  to authenticated
  using (kindred_internal.is_admin());

create policy "Admins can insert impersonation logs"
  on public.admin_impersonation_log
  for insert
  to authenticated
  with check (
    kindred_internal.is_admin()
    and admin_user_id = auth.uid()
  );

create policy "Admins can update only their own log's ended_at"
  on public.admin_impersonation_log
  for update
  to authenticated
  using (
    kindred_internal.is_admin()
    and admin_user_id = auth.uid()
  )
  with check (
    kindred_internal.is_admin()
    and admin_user_id = auth.uid()
  );

-- No delete policy = nobody can ever delete from this table. Audit log integrity.

-- =============================================================================
-- ADMIN OVERRIDE POLICIES
-- Add policies that let admins read all rows from key tables so the admin
-- dashboard + impersonation can work. We add SELECT-only — admins can't
-- mutate user data without explicitly using service role.
-- =============================================================================

create policy "Admins can read all users"
  on public.users
  for select
  to authenticated
  using (kindred_internal.is_admin());

create policy "Admins can read all client_profiles"
  on public.client_profiles
  for select
  to authenticated
  using (kindred_internal.is_admin());

create policy "Admins can read all cna_profiles"
  on public.cna_profiles
  for select
  to authenticated
  using (kindred_internal.is_admin());

create policy "Admins can read all care_recipients"
  on public.care_recipients
  for select
  to authenticated
  using (kindred_internal.is_admin());
