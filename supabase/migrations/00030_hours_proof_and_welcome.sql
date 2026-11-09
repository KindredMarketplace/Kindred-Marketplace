-- =============================================================================
-- 00030 — Application order change (Nick, Nov 9)
--
-- Applicants now upload only PROOF OF HOURS with their application. The
-- Level 2 background check, ID and liability insurance come AFTER Kindred
-- accepts them (application_status 'verifying' = "Accepted, onboarding"), so
-- nobody pays for a background check or a policy and then gets declined.
--
--   - document_type 'work_history': proof of hands-on hours (employer letters,
--     pay stubs, timesheets...). Reviewed by Kindred, who then confirms the
--     number into cna_profiles.experience_hours.
--   - cna_profiles.welcome_seen_at: when the caregiver dismissed the one-time
--     "You're in!" welcome. Harmless for the caregiver to set (the guard
--     trigger leaves it writable).
-- =============================================================================

alter type public.document_type add value if not exists 'work_history';

alter table public.cna_profiles
  add column if not exists welcome_seen_at timestamptz;

comment on column public.cna_profiles.welcome_seen_at is
  'When the caregiver dismissed the one-time acceptance welcome. Null = not shown yet.';

notify pgrst, 'reload schema';
