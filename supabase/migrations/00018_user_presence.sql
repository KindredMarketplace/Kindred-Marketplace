-- =============================================================================
-- 00018_user_presence.sql
-- Lightweight presence tracking for the inbox green-dot indicator.
--
-- Design: instead of maintaining a global Supabase Realtime presence channel
-- (which would require every page in the app to join + maintain a subscription
-- just to render inbox dots), we use a periodic-ping approach:
--
--   - Every logged-in user's layout includes a tiny client component that
--     pings the server every 60 seconds while the tab is visible.
--   - The server action updates auth user's `users.last_active_at`.
--   - The inbox renders "online" if last_active_at is < 2 minutes old.
--
-- Tradeoffs:
--   - Slightly stale (up to ~2 minutes), but feels live enough at human scale.
--   - Zero realtime infrastructure for the inbox view.
--   - In-thread presence still uses Supabase Realtime presence for true
--     instant "the other person is here right now" detection. That's a much
--     higher-resolution signal and worth the realtime channel cost.
-- =============================================================================

alter table public.users
  add column if not exists last_active_at timestamptz;

-- Index supports the inbox query that filters/sorts other-user presence.
create index if not exists users_last_active_at_idx
  on public.users(last_active_at desc nulls last);

comment on column public.users.last_active_at is
  'Best-effort "user was recently active in the app" timestamp. Updated by a periodic ping from the client layout while the tab is visible. Treat anything in the last ~2 minutes as "online".';
