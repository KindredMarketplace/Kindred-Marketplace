-- =============================================================================
-- 00011_row_level_security.sql
-- Row Level Security (RLS) — enforces who can see/edit what AT THE DATABASE
-- LEVEL. This is our defense in depth: even if app code has bugs, the database
-- itself refuses to leak data.
--
-- Conventions:
--   - Every public table gets RLS enabled.
--   - We grant least-privilege access by default.
--   - `auth.uid()` returns the currently-authenticated user's ID.
--   - Service role bypasses RLS (used only on the server for admin tasks).
--
-- NOTE: These are MVP-grade policies. Before launch, have a security engineer
-- audit them, especially around message access (PHI) and document downloads.
-- =============================================================================

-- =============================================================================
-- Helper: is_admin()
-- =============================================================================
create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = user_uuid and role = 'admin'
  );
$$;

-- Helper: user role lookup (avoids self-referencing policy infinite loop)
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- =============================================================================
-- USERS — readable by self, admins, and anyone the user has a thread/booking
-- with (so we can show names/avatars on shared resources).
-- =============================================================================
alter table public.users enable row level security;

create policy users_select_self
  on public.users for select
  using (id = auth.uid());

create policy users_select_admin
  on public.users for select
  using (public.is_admin(auth.uid()));

-- Public profile fields readable by anyone (display_name, avatar) is enforced
-- via a separate view `public_user_summaries` rather than relaxing this policy.

create policy users_update_self
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- =============================================================================
-- CLIENT_PROFILES
-- =============================================================================
alter table public.client_profiles enable row level security;

create policy client_profiles_select_self
  on public.client_profiles for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy client_profiles_insert_self
  on public.client_profiles for insert
  with check (user_id = auth.uid());

create policy client_profiles_update_self
  on public.client_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- CARE_RECIPIENTS — PHI. Strictest access.
-- =============================================================================
alter table public.care_recipients enable row level security;

create policy care_recipients_select_owner
  on public.care_recipients for select
  using (client_id = auth.uid() or public.is_admin(auth.uid()));

-- CNAs see care recipient details ONLY for bookings they're assigned to.
create policy care_recipients_select_assigned_cna
  on public.care_recipients for select
  using (
    exists (
      select 1 from public.bookings b
      where b.care_recipient_id = care_recipients.id
        and b.cna_id = auth.uid()
        and b.status in ('scheduled', 'active', 'completed')
    )
  );

create policy care_recipients_insert_owner
  on public.care_recipients for insert
  with check (client_id = auth.uid());

create policy care_recipients_update_owner
  on public.care_recipients for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy care_recipients_delete_owner
  on public.care_recipients for delete
  using (client_id = auth.uid());

-- =============================================================================
-- CNA_PROFILES — public read (Browse), self-write
-- =============================================================================
alter table public.cna_profiles enable row level security;

-- Anyone can browse CNA profiles. Logged-out users see limited view enforced
-- in application layer (last name, exact location masked).
create policy cna_profiles_select_public
  on public.cna_profiles for select
  using (true);

create policy cna_profiles_insert_self
  on public.cna_profiles for insert
  with check (user_id = auth.uid());

create policy cna_profiles_update_self
  on public.cna_profiles for update
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- =============================================================================
-- CNA_SERVICES, CNA_VERIFICATIONS, CNA_SERVICE_AREAS, CNA_AVAILABILITY
-- =============================================================================
alter table public.cna_services enable row level security;
alter table public.cna_verifications enable row level security;
alter table public.cna_service_areas enable row level security;
alter table public.cna_availability enable row level security;
alter table public.cna_availability_overrides enable row level security;

-- Services + service areas + availability: public read (drives Browse + matching)
create policy cna_services_select_public on public.cna_services for select using (true);
create policy cna_service_areas_select_public on public.cna_service_areas for select using (true);
create policy cna_availability_select_public on public.cna_availability for select using (true);
create policy cna_availability_overrides_select_public on public.cna_availability_overrides for select using (true);

-- Verifications: status visible to anyone; CNAs manage their own rows
create policy cna_verifications_select_public on public.cna_verifications for select using (true);

-- All four: writes only by the owning CNA (or admin)
create policy cna_services_write_self on public.cna_services
  for all using (cna_id = auth.uid() or public.is_admin(auth.uid()))
  with check (cna_id = auth.uid() or public.is_admin(auth.uid()));

create policy cna_verifications_write_self on public.cna_verifications
  for all using (cna_id = auth.uid() or public.is_admin(auth.uid()))
  with check (cna_id = auth.uid() or public.is_admin(auth.uid()));

create policy cna_service_areas_write_self on public.cna_service_areas
  for all using (cna_id = auth.uid() or public.is_admin(auth.uid()))
  with check (cna_id = auth.uid() or public.is_admin(auth.uid()));

create policy cna_availability_write_self on public.cna_availability
  for all using (cna_id = auth.uid() or public.is_admin(auth.uid()))
  with check (cna_id = auth.uid() or public.is_admin(auth.uid()));

create policy cna_availability_overrides_write_self on public.cna_availability_overrides
  for all using (cna_id = auth.uid() or public.is_admin(auth.uid()))
  with check (cna_id = auth.uid() or public.is_admin(auth.uid()));

-- =============================================================================
-- SERVICE_TAXONOMY — public read, admin write
-- =============================================================================
alter table public.service_taxonomy enable row level security;

create policy service_taxonomy_select_public on public.service_taxonomy
  for select using (true);

create policy service_taxonomy_write_admin on public.service_taxonomy
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- =============================================================================
-- JOBS — visible to job poster, applicable CNAs, and admins
-- =============================================================================
alter table public.jobs enable row level security;

create policy jobs_select_owner on public.jobs for select
  using (client_id = auth.uid() or public.is_admin(auth.uid()));

-- Any CNA can see jobs that are open — drives the job feed
create policy jobs_select_open_for_cnas on public.jobs for select
  using (
    status in ('open', 'in_review')
    and public.current_user_role() = 'cna'
  );

create policy jobs_insert_self on public.jobs for insert
  with check (client_id = auth.uid());

create policy jobs_update_owner on public.jobs for update
  using (client_id = auth.uid() or public.is_admin(auth.uid()))
  with check (client_id = auth.uid() or public.is_admin(auth.uid()));

create policy jobs_delete_owner on public.jobs for delete
  using (client_id = auth.uid() or public.is_admin(auth.uid()));

-- =============================================================================
-- JOB_APPLICATIONS — job poster + applicant only
-- =============================================================================
alter table public.job_applications enable row level security;

create policy job_applications_select_parties on public.job_applications for select
  using (
    cna_id = auth.uid()
    or exists (
      select 1 from public.jobs j
      where j.id = job_applications.job_id and j.client_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

create policy job_applications_insert_cna on public.job_applications for insert
  with check (cna_id = auth.uid());

create policy job_applications_update_parties on public.job_applications for update
  using (
    cna_id = auth.uid()
    or exists (
      select 1 from public.jobs j
      where j.id = job_applications.job_id and j.client_id = auth.uid()
    )
  );

-- =============================================================================
-- BOOKINGS — only the two parties + admin
-- =============================================================================
alter table public.bookings enable row level security;

create policy bookings_select_parties on public.bookings for select
  using (
    client_id = auth.uid()
    or cna_id = auth.uid()
    or public.is_admin(auth.uid())
  );

create policy bookings_insert_party on public.bookings for insert
  with check (client_id = auth.uid() or cna_id = auth.uid());

create policy bookings_update_parties on public.bookings for update
  using (client_id = auth.uid() or cna_id = auth.uid() or public.is_admin(auth.uid()));

-- =============================================================================
-- SHIFTS — same as bookings
-- =============================================================================
alter table public.shifts enable row level security;

create policy shifts_select_parties on public.shifts for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = shifts.booking_id
        and (b.client_id = auth.uid() or b.cna_id = auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy shifts_write_parties on public.shifts for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = shifts.booking_id
        and (b.client_id = auth.uid() or b.cna_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = shifts.booking_id
        and (b.client_id = auth.uid() or b.cna_id = auth.uid())
    )
  );

-- =============================================================================
-- MESSAGES + THREADS — strict party-only
-- =============================================================================
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

create policy message_threads_select_party on public.message_threads for select
  using (participant_a = auth.uid() or participant_b = auth.uid() or public.is_admin(auth.uid()));

create policy message_threads_insert_party on public.message_threads for insert
  with check (participant_a = auth.uid() or participant_b = auth.uid());

create policy messages_select_party on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin(auth.uid()));

create policy messages_insert_sender on public.messages for insert
  with check (sender_id = auth.uid());

create policy messages_update_recipient_for_read on public.messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- =============================================================================
-- REVIEWS, FAVORITES, SAVED_SEARCHES
-- =============================================================================
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;

create policy reviews_select_public_visible on public.reviews for select
  using (is_visible = true);

create policy reviews_select_own on public.reviews for select
  using (reviewer_id = auth.uid() or reviewee_id = auth.uid());

create policy reviews_insert_self on public.reviews for insert
  with check (reviewer_id = auth.uid());

create policy reviews_update_self on public.reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

create policy favorites_all_self on public.favorites for all
  using (client_id = auth.uid()) with check (client_id = auth.uid());

create policy saved_searches_all_self on public.saved_searches for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- PAYMENTS, PAYMENT_METHODS, REFUNDS — party access only
-- =============================================================================
alter table public.payments enable row level security;
alter table public.payment_methods enable row level security;
alter table public.refunds enable row level security;
alter table public.platform_fee_config enable row level security;

create policy payments_select_parties on public.payments for select
  using (client_id = auth.uid() or cna_id = auth.uid() or public.is_admin(auth.uid()));

-- Inserts/updates to payments only via service role (server-side Stripe webhooks)
-- — no policy granted, default-deny applies.

create policy payment_methods_all_self on public.payment_methods for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy refunds_select_parties on public.refunds for select
  using (
    exists (
      select 1 from public.payments p
      where p.id = refunds.payment_id
        and (p.client_id = auth.uid() or p.cna_id = auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy platform_fee_config_select_public on public.platform_fee_config for select using (true);
create policy platform_fee_config_admin_only on public.platform_fee_config for update
  using (public.is_admin(auth.uid()));

-- =============================================================================
-- TRAINING_PARTNERS — public read (marketing), admin write
-- =============================================================================
alter table public.training_partners enable row level security;
alter table public.training_partner_cohorts enable row level security;
alter table public.training_referrals enable row level security;

create policy training_partners_select_public on public.training_partners for select using (true);
create policy training_partners_write_admin on public.training_partners for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy training_cohorts_select_public on public.training_partner_cohorts for select using (true);
create policy training_cohorts_write_admin on public.training_partner_cohorts for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy training_referrals_select_self on public.training_referrals for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy training_referrals_insert_anyone on public.training_referrals for insert
  with check (user_id = auth.uid() or user_id is null); -- allow lead capture without account

-- =============================================================================
-- DOCUMENTS — strict self-only
-- =============================================================================
alter table public.documents enable row level security;

create policy documents_all_self on public.documents for all
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- =============================================================================
-- NOTIFICATIONS — recipient only
-- =============================================================================
alter table public.notifications enable row level security;

create policy notifications_select_self on public.notifications for select
  using (user_id = auth.uid());

create policy notifications_update_self_read on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Inserts via service role.

-- =============================================================================
-- AUDIT_LOG — admin only for reads; inserts via service role
-- =============================================================================
alter table public.audit_log enable row level security;

create policy audit_log_select_admin on public.audit_log for select
  using (public.is_admin(auth.uid()));

-- =============================================================================
-- USER_DEVICES — self only
-- =============================================================================
alter table public.user_devices enable row level security;

create policy user_devices_all_self on public.user_devices for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- B2B TABLES — limited self-serve in v1. Service role for ops.
-- =============================================================================
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_compliance_docs enable row level security;
alter table public.shift_templates enable row level security;
alter table public.business_shifts enable row level security;
alter table public.business_shift_applications enable row level security;
alter table public.approved_roster enable row level security;
alter table public.timesheets enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;

-- Helper: is user a member of an org?
create or replace function public.is_org_member(target_org uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = target_org and user_id = user_uuid and joined_at is not null
  );
$$;

-- Org members can read their org
create policy organizations_select_members on public.organizations for select
  using (public.is_org_member(id, auth.uid()) or public.is_admin(auth.uid()));

-- Members read membership of orgs they belong to
create policy org_members_select_co_members on public.organization_members for select
  using (public.is_org_member(org_id, auth.uid()) or public.is_admin(auth.uid()));

-- Catch-all: org members can read their org's resources
create policy compliance_docs_select_members on public.organization_compliance_docs for select
  using (public.is_org_member(org_id, auth.uid()) or public.is_admin(auth.uid()));

create policy shift_templates_select_members on public.shift_templates for select
  using (public.is_org_member(org_id, auth.uid()) or public.is_admin(auth.uid()));

create policy business_shifts_select_members on public.business_shifts for select
  using (public.is_org_member(org_id, auth.uid()) or public.is_admin(auth.uid()));

-- Open business shifts are visible to all CNAs (drives shift board)
create policy business_shifts_select_open_for_cnas on public.business_shifts for select
  using (
    status = 'open'
    and public.current_user_role() = 'cna'
  );

create policy business_shift_apps_select_parties on public.business_shift_applications for select
  using (
    cna_id = auth.uid()
    or exists (
      select 1 from public.business_shifts s
      where s.id = business_shift_applications.shift_id
        and public.is_org_member(s.org_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy approved_roster_select_members on public.approved_roster for select
  using (public.is_org_member(org_id, auth.uid()) or cna_id = auth.uid() or public.is_admin(auth.uid()));

create policy timesheets_select_parties on public.timesheets for select
  using (
    cna_id = auth.uid()
    or exists (
      select 1 from public.business_shifts s
      where s.id = timesheets.shift_id
        and public.is_org_member(s.org_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy invoices_select_members on public.invoices for select
  using (public.is_org_member(org_id, auth.uid()) or public.is_admin(auth.uid()));

create policy invoice_line_items_select_via_invoice on public.invoice_line_items for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_line_items.invoice_id
        and public.is_org_member(i.org_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

-- B2B writes default to admin-only in v1; expand in v2 when portal launches.
