# Platform-model DB tests

Runs migrations `00024_platform_model_membership.sql` and `00025_account_and_messaging_hardening.sql` against an in-memory Postgres
(PGlite) seeded with a minimal copy of the Kindred schema, then checks the
correctness properties from `design.md` (P1–P5) plus the gating rules.

```bash
cd scripts/db-tests
npm i --no-save @electric-sql/pglite@0.3.9
sed -e 's/^notify pgrst.*//' ../../supabase/migrations/00024_platform_model_membership.sql > migration.sql
sed -e 's/^notify pgrst.*//' ../../supabase/migrations/00025_account_and_messaging_hardening.sql > migration25.sql
node run.mjs
```

Last run 2026-11-05: 68/68 passed (both apply orders), including every exploit from two rounds of security review.
