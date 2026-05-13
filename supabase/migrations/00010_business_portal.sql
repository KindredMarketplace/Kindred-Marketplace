-- =============================================================================
-- 00010_business_portal.sql
-- B2B portal tables. SCHEMA ONLY — no UI in v1. Spreadsheet Open Q11 calls for
-- B2B 90 days after consumer launch, but adding these tables now is cheap and
-- prevents a painful schema migration later.
--
-- Targeting ALFs first (Open Q13). Same CNA pool serves both consumer + B2B
-- (Open Q14) — `cna_id` references the same `cna_profiles` table.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================
create type public.org_type as enum (
  'alf',         -- Assisted Living Facility
  'memory_care',
  'snf',         -- Skilled Nursing Facility / nursing home
  'hha',         -- Home Health Agency (uses us as overflow)
  'hospital',
  'hospice',
  'independent_living',
  'adult_day',
  'other'
);

create type public.org_status as enum (
  'prospect',
  'onboarding',
  'active',
  'paused',
  'churned'
);

create type public.org_member_role as enum (
  'admin',
  'scheduler',
  'hr',
  'billing',
  'supervisor'
);

create type public.compliance_doc_type as enum (
  'baa',
  'coi',                -- Certificate of Insurance
  'vendor_agreement',
  'w9',
  'license',
  'msa'                 -- Master Service Agreement
);

create type public.business_shift_status as enum (
  'open',
  'assigned',
  'in_progress',
  'completed',
  'no_show',
  'cancelled'
);

create type public.invoice_status as enum (
  'draft',
  'sent',
  'paid',
  'overdue',
  'void'
);

-- =============================================================================
-- TABLE: organizations
-- =============================================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type public.org_type not null,
  license_number text,
  ein text, -- Employer Identification Number
  -- Address
  street_address text,
  city text,
  state text default 'FL',
  zip text,
  lat double precision,
  lng double precision,
  -- Contact
  contact_email text,
  contact_phone text,
  primary_contact_name text,
  -- Operational
  capacity int,           -- bed count / resident count
  specialty text,         -- 'memory_care' | 'rehab' | etc.
  status public.org_status not null default 'prospect',
  -- Billing
  billing_email text,
  billing_terms text default 'net_30',
  stripe_customer_id text,
  -- Pricing model — Open Q12; default to A (markup)
  pricing_model text default 'markup',
  markup_pct numeric(5, 4) default 0.2800, -- 28% default markup
  -- Status flags
  baa_signed boolean not null default false,
  coi_on_file boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_status_idx on public.organizations(status);
create index organizations_type_idx on public.organizations(type);
create index organizations_geo_idx on public.organizations
  using gist (ll_to_earth(lat, lng))
  where lat is not null and lng is not null;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: organization_members
-- Multi-user access to a business account — required for B2B per spreadsheet.
-- =============================================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.org_member_role not null default 'scheduler',
  permissions text[] default array[]::text[], -- granular overrides
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index organization_members_org_idx on public.organization_members(org_id);
create index organization_members_user_idx on public.organization_members(user_id);

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: organization_compliance_docs
-- BAAs, COIs, vendor agreements, W-9s. Hospitals will demand all of these.
-- =============================================================================
create table public.organization_compliance_docs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type public.compliance_doc_type not null,
  document_id uuid references public.documents(id),
  effective_at date,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_compliance_docs_org_idx on public.organization_compliance_docs(org_id);
create index organization_compliance_docs_expiring_idx on public.organization_compliance_docs(expires_at)
  where expires_at is not null;

create trigger organization_compliance_docs_set_updated_at
  before update on public.organization_compliance_docs
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: shift_templates
-- "Our standard NOC shift" — facilities post variations of the same shift
-- repeatedly. Templates save them time.
-- =============================================================================
create table public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  day_of_week public.day_of_week,
  start_time time not null,
  end_time time not null,
  services_required text[] default array[]::text[],
  pay_rate_cents int not null,
  bill_rate_cents int not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shift_templates_org_idx on public.shift_templates(org_id);

create trigger shift_templates_set_updated_at
  before update on public.shift_templates
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: business_shifts
-- Shifts posted by businesses. Separate from consumer `jobs` because the flow
-- is fundamentally different (post → CNAs apply → assigned vs. post → applications).
-- =============================================================================
create table public.business_shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid references public.shift_templates(id) on delete set null,
  posted_by_user_id uuid references public.users(id),
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  services_required text[] default array[]::text[],
  pay_rate_cents int not null,
  bill_rate_cents int not null,
  status public.business_shift_status not null default 'open',
  assigned_cna_id uuid references public.cna_profiles(user_id) on delete set null,
  assigned_at timestamptz,
  notes text,
  -- Required-certs filters
  requires_cpr boolean default false,
  requires_dementia_cert boolean default false,
  requires_facility_orientation boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_shifts_org_idx on public.business_shifts(org_id);
create index business_shifts_open_idx on public.business_shifts(shift_date)
  where status = 'open';
create index business_shifts_assigned_cna_idx on public.business_shifts(assigned_cna_id);

create trigger business_shifts_set_updated_at
  before update on public.business_shifts
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: business_shift_applications
-- =============================================================================
create table public.business_shift_applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.business_shifts(id) on delete cascade,
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  status text not null default 'submitted', -- 'submitted'|'shortlisted'|'rejected'|'accepted'|'withdrawn'
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, cna_id)
);

create index business_shift_apps_shift_idx on public.business_shift_applications(shift_id);
create index business_shift_apps_cna_idx on public.business_shift_applications(cna_id);

create trigger business_shift_apps_set_updated_at
  before update on public.business_shift_applications
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: approved_roster
-- CNAs the facility has saved as "preferred." Hugely important for facility
-- retention — they want familiar faces.
-- =============================================================================
create table public.approved_roster (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  saved_by_user_id uuid references public.users(id),
  notes text,
  last_worked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, cna_id)
);

create index approved_roster_org_idx on public.approved_roster(org_id);
create index approved_roster_cna_idx on public.approved_roster(cna_id);

-- =============================================================================
-- TABLE: timesheets
-- For B2B billing — CNA clocks in/out at the facility, supervisor approves,
-- then payroll/invoicing triggers.
-- =============================================================================
create table public.timesheets (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.business_shifts(id) on delete cascade,
  cna_id uuid not null references public.cna_profiles(user_id),
  clock_in timestamptz,
  clock_out timestamptz,
  hours_worked numeric(5, 2),
  break_minutes int default 0,
  supervisor_id uuid references public.users(id),
  approved_at timestamptz,
  approved_notes text,
  status text not null default 'pending', -- 'pending'|'approved'|'disputed'|'paid'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (clock_out is null or clock_in is null or clock_out > clock_in)
);

create index timesheets_shift_idx on public.timesheets(shift_id);
create index timesheets_cna_idx on public.timesheets(cna_id);
create index timesheets_pending_approval_idx on public.timesheets(status)
  where status = 'pending';

create trigger timesheets_set_updated_at
  before update on public.timesheets
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: invoices
-- Net-30 monthly invoices for facilities. Different from per-shift payments
-- to consumers because B2B AP runs on monthly cycles.
-- =============================================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  invoice_number text unique not null, -- KIN-2026-001 etc.
  period_start date not null,
  period_end date not null,
  -- Amounts
  subtotal_cents int not null check (subtotal_cents >= 0),
  markup_cents int default 0,
  tax_cents int default 0,
  total_cents int not null check (total_cents >= 0),
  -- Payment terms
  due_date date,
  paid_at timestamptz,
  status public.invoice_status not null default 'draft',
  -- Stripe references
  stripe_invoice_id text unique,
  stripe_payment_intent_id text,
  -- Free-form
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_org_idx on public.invoices(org_id);
create index invoices_status_idx on public.invoices(status);
create index invoices_overdue_idx on public.invoices(due_date)
  where status in ('sent', 'overdue');

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: invoice_line_items
-- =============================================================================
create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  timesheet_id uuid references public.timesheets(id),
  description text not null,
  hours numeric(6, 2),
  rate_cents int,
  amount_cents int not null,
  created_at timestamptz not null default now()
);

create index invoice_line_items_invoice_idx on public.invoice_line_items(invoice_id);
