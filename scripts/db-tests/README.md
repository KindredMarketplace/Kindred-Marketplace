# Platform-model DB tests

Runs migration `00024_platform_model_membership.sql` against an in-memory Postgres
(PGlite) seeded with a minimal copy of the Kindred schema, then checks the
correctness properties from `design.md` (P1–P5) plus the gating rules.

```bash
cd scripts/db-tests
npm i --no-save @electric-sql/pglite@0.3.9
sed -e 's/^notify pgrst.*//' ../../supabase/migrations/00024_platform_model_membership.sql > migration.sql
node run.mjs
```

Last run 2026-11-05: 48/48 passed (includes every exploit from the first security review).
