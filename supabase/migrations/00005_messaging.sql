-- =============================================================================
-- 00005_messaging.sql
-- Threaded messaging between users. Designed to be HIPAA-compliant once we move
-- to the HIPAA Supabase tier:
--   - All message bodies are stored as text but should be encrypted at the
--     column level (pgcrypto) when HIPAA is enabled.
--   - audit_log rows are required for every read of a message.
--   - read_at + delivered_at give us proof-of-delivery if disputed.
-- =============================================================================

-- =============================================================================
-- TABLE: message_threads
-- A thread is between two users. For a job-related thread, job_id is set; for
-- a booking-related thread, booking_id is set.
-- =============================================================================
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  -- Always two participants in v1. v2 = group threads for family members.
  participant_a uuid not null references public.users(id) on delete cascade,
  participant_b uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Normalize so (a,b) and (b,a) match — store smaller UUID first
  check (participant_a < participant_b),
  unique (participant_a, participant_b, job_id, booking_id)
);

create index message_threads_a_idx on public.message_threads(participant_a, last_message_at desc);
create index message_threads_b_idx on public.message_threads(participant_b, last_message_at desc);

create trigger message_threads_set_updated_at
  before update on public.message_threads
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: messages
-- =============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  -- When HIPAA tier enabled, swap to: body_encrypted bytea
  -- and use pgp_sym_encrypt() / pgp_sym_decrypt() functions.
  is_encrypted boolean not null default false,
  attachment_url text,
  delivered_at timestamptz default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on public.messages(thread_id, created_at desc);
create index messages_recipient_unread_idx on public.messages(recipient_id)
  where read_at is null;

-- =============================================================================
-- Trigger: keep message_threads.last_message_* in sync
-- =============================================================================
create or replace function public.messages_update_thread_summary()
returns trigger
language plpgsql
as $$
begin
  update public.message_threads
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 200),
    updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.messages_update_thread_summary();

comment on table public.messages is
  'When HIPAA tier is enabled, encrypt body at column level via pgcrypto and require BAA-covered storage.';
