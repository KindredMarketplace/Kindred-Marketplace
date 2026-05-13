-- =============================================================================
-- 00006_reviews_and_favorites.sql
-- Client reviews of CNAs, two-way ratings, saved-caregiver favorites.
-- =============================================================================

-- =============================================================================
-- TABLE: reviews
-- One review per booking from each side.
-- =============================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.users(id),
  reviewee_id uuid not null references public.users(id),
  rating int not null check (rating between 1 and 5),
  body text,
  -- Tags for granular feedback
  tags text[] default array[]::text[], -- ['punctual', 'compassionate', 'reliable', ...]
  -- v1: reviews are immediately visible. v2: 7-day window like Airbnb so both
  -- sides post before seeing the other's.
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, reviewer_id) -- one review per reviewer per booking
);

create index reviews_reviewee_idx on public.reviews(reviewee_id);
create index reviews_booking_idx on public.reviews(booking_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Trigger: roll up rating averages onto cna_profiles
-- Recalculates rating_avg + rating_count whenever a review of a CNA is inserted,
-- updated, or deleted.
-- =============================================================================
create or replace function public.reviews_update_cna_aggregates()
returns trigger
language plpgsql
as $$
declare
  target_cna uuid;
begin
  target_cna := coalesce(new.reviewee_id, old.reviewee_id);
  -- Only roll up if the reviewee is a CNA (not a client review)
  if not exists (select 1 from public.cna_profiles where user_id = target_cna) then
    return coalesce(new, old);
  end if;

  update public.cna_profiles
  set
    rating_avg = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where reviewee_id = target_cna and is_visible = true
    ), 0),
    rating_count = (
      select count(*)
      from public.reviews
      where reviewee_id = target_cna and is_visible = true
    )
  where user_id = target_cna;

  return coalesce(new, old);
end;
$$;

create trigger reviews_rollup_aggregates
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_update_cna_aggregates();

-- =============================================================================
-- Trigger: auto-promote CNA tier based on completed shifts
-- Runs after a shift completes.
-- =============================================================================
create or replace function public.cna_check_tier_promotion()
returns trigger
language plpgsql
as $$
begin
  -- Only act when a shift just transitioned to 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    update public.cna_profiles cp
    set
      completed_shifts_count = completed_shifts_count + 1,
      tier = case
        -- top_rated: 10+ completed shifts AND rating_avg >= 4.5
        when completed_shifts_count + 1 >= 10 and rating_avg >= 4.5 then 'top_rated'::cna_tier
        -- verified: at least one completed shift AND BG check clear
        when bg_check_status = 'clear' then 'verified'::cna_tier
        else tier
      end
    from public.bookings b
    where b.id = new.booking_id and cp.user_id = b.cna_id;
  end if;
  return new;
end;
$$;

create trigger shifts_promote_cna_tier
  after update on public.shifts
  for each row execute function public.cna_check_tier_promotion();

-- =============================================================================
-- TABLE: favorites
-- Clients save CNAs to a favorites list ("Saved caregivers" in Client Portal).
-- =============================================================================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(user_id) on delete cascade,
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, cna_id)
);

create index favorites_client_idx on public.favorites(client_id);
create index favorites_cna_idx on public.favorites(cna_id);

-- =============================================================================
-- TABLE: saved_searches
-- (P2 — Master Checklist line 22). Users save filter sets to re-run later.
-- =============================================================================
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  filters jsonb not null, -- the full filter object from /browse
  created_at timestamptz not null default now()
);

create index saved_searches_user_idx on public.saved_searches(user_id);
