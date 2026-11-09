-- =============================================================================
-- 00029 — Let the server (service_role) run the kindred_internal guard triggers
--
-- Bug found Nov 9 on the live preview: /apply failed with "permission denied
-- for schema kindred_internal". The guard triggers added in 00024/00025
-- (cna_profiles, users, cna_verifications, bookings, reviews ...) are
-- SECURITY INVOKER, so they run as whoever is writing. When the server writes
-- with the service-role key (application intake, admin approval, Stripe
-- webhook), that role had no USAGE on kindred_internal, so every such write
-- failed. The trigger itself lets privileged writers through
-- (is_privileged_writer: current_user not in anon/authenticated).
--
-- service_role is already fully trusted (it bypasses RLS), so this grants it
-- nothing it couldn't do anyway; anon/authenticated are unchanged.
-- =============================================================================

grant usage on schema kindred_internal to service_role;
grant execute on all functions in schema kindred_internal to service_role;
alter default privileges in schema kindred_internal grant execute on functions to service_role;
