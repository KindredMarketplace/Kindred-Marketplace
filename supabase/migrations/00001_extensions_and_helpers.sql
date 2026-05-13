-- =============================================================================
-- 00001_extensions_and_helpers.sql
-- Foundational extensions and helper functions used throughout the schema.
-- =============================================================================

-- UUID generation (gen_random_uuid is built into Postgres 13+, but pgcrypto
-- gives us additional crypto helpers if we need them later)
create extension if not exists "pgcrypto";

-- For polygon/geo queries on CNA service areas — uses earth-distance + cube.
-- Lighter than PostGIS for our needs; we can swap to PostGIS later if we need
-- true GIS (route planning, etc.). Free tier Supabase supports both.
create extension if not exists "cube";
create extension if not exists "earthdistance";

-- Full text search for browsing CNAs by bio/specialty
create extension if not exists "pg_trgm";

-- =============================================================================
-- Helper: updated_at trigger function
-- Attach to any table with an updated_at column to auto-bump it on UPDATE.
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Helper: distance between two lat/lng points (in miles)
-- Used to match jobs to CNAs by proximity.
-- =============================================================================
create or replace function public.miles_between(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select earth_distance(
    ll_to_earth(lat1, lng1),
    ll_to_earth(lat2, lng2)
  ) * 0.000621371; -- meters to miles
$$;

comment on function public.miles_between is
  'Returns distance in miles between two lat/lng points. Used for matching CNAs to jobs.';
