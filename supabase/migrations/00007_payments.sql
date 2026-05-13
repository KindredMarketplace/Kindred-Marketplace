-- =============================================================================
-- 00007_payments.sql
-- Stripe Connect: client pays → Kindred holds (escrow) → release to CNA after
-- shift completion. Tracks platform fee, payout, and refunds.
-- =============================================================================

create type public.payment_status as enum (
  'pending',              -- created, awaiting client action
  'authorized',           -- card authorized, funds held
  'captured',             -- funds in our balance, awaiting release
  'released',             -- transferred to CNA
  'refunded',
  'partially_refunded',
  'failed',
  'disputed'
);

-- =============================================================================
-- TABLE: payments
-- One row per charge against a client. Each captures a single shift OR a
-- multi-shift package (e.g. a week of recurring shifts billed together).
-- =============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  shift_id uuid references public.shifts(id), -- nullable if billing multiple shifts at once
  client_id uuid not null references public.client_profiles(user_id),
  cna_id uuid not null references public.cna_profiles(user_id),
  -- Amounts (all in cents to avoid float drift)
  gross_amount_cents int not null check (gross_amount_cents >= 0),
  platform_fee_cents int not null check (platform_fee_cents >= 0),
  cna_payout_cents int not null check (cna_payout_cents >= 0),
  stripe_processing_fee_cents int default 0,
  -- Stripe references
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  stripe_transfer_id text, -- the transfer from us to the CNA's connected account
  stripe_refund_id text,
  -- Status
  status public.payment_status not null default 'pending',
  authorized_at timestamptz,
  captured_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (gross_amount_cents = platform_fee_cents + cna_payout_cents + coalesce(stripe_processing_fee_cents, 0))
);

create index payments_booking_idx on public.payments(booking_id);
create index payments_client_idx on public.payments(client_id);
create index payments_cna_idx on public.payments(cna_id);
create index payments_status_idx on public.payments(status);
create index payments_stripe_intent_idx on public.payments(stripe_payment_intent_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

comment on table public.payments is
  'Stripe Connect escrow: client → Kindred → CNA. Funds held until shift completes.';

-- =============================================================================
-- TABLE: payment_methods
-- Saved cards / ACH for clients. Stripe customer + payment method references
-- only — we never store raw card data.
-- =============================================================================
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_payment_method_id text not null unique,
  -- For display only — copied from Stripe's response
  card_brand text,
  card_last4 text,
  card_exp_month int,
  card_exp_year int,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_methods_user_idx on public.payment_methods(user_id);

create trigger payment_methods_set_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

-- Enforce single default per user
create unique index payment_methods_one_default_per_user
  on public.payment_methods(user_id) where is_default = true;

-- =============================================================================
-- TABLE: platform_fee_config
-- Single-row config table for the platform fee structure. Default = tiered
-- per Open Question Q2 (leaning B): 10% top_rated, 12% verified, 15% new.
-- =============================================================================
create table public.platform_fee_config (
  id int primary key default 1,
  fee_pct_new numeric(5, 4) not null default 0.1500,        -- 15%
  fee_pct_verified numeric(5, 4) not null default 0.1200,   -- 12%
  fee_pct_top_rated numeric(5, 4) not null default 0.1000,  -- 10%
  -- Training school referral cut (separate revenue stream)
  training_referral_pct numeric(5, 4) not null default 0.1000, -- 10% of tuition
  updated_at timestamptz not null default now(),
  check (id = 1) -- single-row guard
);

insert into public.platform_fee_config (id) values (1)
on conflict do nothing;

create trigger platform_fee_config_set_updated_at
  before update on public.platform_fee_config
  for each row execute function public.set_updated_at();

comment on table public.platform_fee_config is
  'Single-row platform fee config. Tiered fees — see Open Q2 in build tracker.';

-- =============================================================================
-- TABLE: refunds
-- Detailed log per refund (a payment may be partially refunded multiple times)
-- =============================================================================
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  amount_cents int not null check (amount_cents > 0),
  reason text not null, -- 'no_show' | 'cancellation_24h' | 'cancellation_24h+' | 'dispute' | 'other'
  stripe_refund_id text unique,
  initiated_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index refunds_payment_idx on public.refunds(payment_id);
