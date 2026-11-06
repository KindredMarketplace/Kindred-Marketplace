# Phase 1: Business-model foundation

Split into 1a (build health, brand, app shell, scope) and 1b (DB + membership + locked preview), because it crosses DB, payments and UI boundaries. Both run this session (Nick pre-approved autonomous execution).

## Summary

| # | Task | Requirements |
|---|------|-------------|
| 1a.1 | Build health: live types, SSR upgrade, zero TS errors | R7.1, R7.2 |
| 1a.2 | K brand mark + favicons + metadata | R2.1, R2.2 |
| 1a.3 | Installable PWA (manifest, icons, SW, offline, install prompt) | R1.1–R1.3 |
| 1a.4 | Archive business portal, redirect dead routes, nav/footer cleanup | R6.1, R6.2, R2.3 |
| 1b.1 | Migration 00023 (plans, memberships, standard, founding, browse fns, RLS) | R3.1, R3.2, R4.1–R4.5, R5.1–R5.3, R5.5, R5.6 |
| 1b.2 | Membership app layer (lib, checkout, webhook, pages, admin comp) | R4.4, R4.6, R4.7 |
| 1b.3 | Locked preview UI + /kindred-standard page + gating | R3.3, R3.4, R5.1–R5.5 |
| 1b.4 | Verify (build, smoke screenshots, SQL property checks) | all |

## Dependencies

- [x] Supabase project active (verified 2026-11-05)
- [ ] Stripe test keys in `.env.local` (missing: the code degrades gracefully)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present (needed for the webhook)

---

## Tasks

### Task 1a.1: Build health
**What:** Make type-check and production build pass.
**Files:** Modify `types/database.types.ts` (generated), `lib/supabase/{server,middleware}.ts` (getAll/setAll), `package.json` (ssr 0.12.7, supabase-js 2.118.0), plus small fixes where the stub types hid bugs.
**AC:**
- [ ] `npx tsc --noEmit` → 0 errors (R7.1)
- [ ] `npm run build` succeeds (R7.1)

### Task 1a.2: Brand
**What:** Replace the heart KindredMark with the K mark everywhere.
**Files:** Create `public/brand/kindred-k.png`, `app/icon.png`, `app/apple-icon.png`. Modify `components/KindredMark.tsx`, `app/layout.tsx` (metadata, tagline).
**AC:**
- [ ] No heart/plus SVG path left in components (R2.1)
- [ ] `<title>` / OG use "A better way to connect." (R2.2)

### Task 1a.3: Installable app
**What:** PWA install on iOS/Android.
**Files:** Create `app/manifest.ts`, `public/sw.js`, `public/offline.html`, `public/icons/*`, `components/pwa/RegisterServiceWorker.tsx`, `components/pwa/InstallPrompt.tsx`. Modify `app/layout.tsx` (viewport/theme-color, register).
**AC:**
- [ ] `/manifest.webmanifest` serves name, icons 192/512/maskable, standalone (R1.1)
- [ ] SW only caches static assets and the offline page; never `/api`, never navigations except as the offline fallback (R1.2)
- [ ] Apple touch icon + `apple-mobile-web-app-capable` present (R1.3)

### Task 1a.4: Scope cleanup
**What:** Remove B2B and training from the live app.
**Files:** Move `app/business` and `components/business` to `_archive/business-portal/`. Modify `next.config.js` (redirects), `lib/supabase/middleware.ts` (drop business routing), `components/SiteFooter.tsx`, `components/SiteHeader.tsx`, `app/page.tsx` copy references, `tsconfig.json` (exclude `_archive`).
**AC:**
- [ ] `/business/*`, `/become-a-cna`, `/training-partners`, `/insurance-billing`, `/for-business` redirect (R6.2)
- [ ] No nav or footer link points at removed areas (R2.3)

### Task 1b.1: Migration 00023
**What:** Data layer for membership, standard and preview.
**Files:** Create `supabase/migrations/00023_platform_model_membership.sql`. Regenerate types.
**AC:**
- [ ] anon `select` on `cna_profiles` returns 0 rows (R5.6)
- [ ] `browse_caregivers()` as non-member returns only an initial, no last_name/photo (R5.2)
- [ ] Approving a caregiver with fewer than 25 founding slots used creates a comped founding membership (R4.5)
- [ ] Prices live in `access_plans` (R4.3)
- [ ] security: functions `set search_path = ''`, execute granted narrowly

### Task 1b.2: Membership app layer
**Files:** Create `lib/membership.ts`, `app/api/membership/checkout/route.ts`, `app/client/membership/page.tsx`, `app/cna/membership/page.tsx`, `components/membership/MembershipCard.tsx`. Modify `app/api/stripe/webhook/route.ts`, `app/admin/applications/[id]/page.tsx` (comp + standard toggles), `app/admin/actions.ts`, portal nav links.
**AC:**
- [ ] Checkout returns 503 + friendly message without keys (R4.7)
- [ ] Webhook verifies the signature and updates `memberships` via the service role (R4.6)
- [ ] Founding members see "Founding caregiver · free through <date>"

### Task 1b.3: Locked preview UI
**Files:** Modify `app/browse/page.tsx`, `app/browse/BrowseClient.tsx`, `app/client/browse/page.tsx`, `app/page.tsx` (caregiver strip), `app/cna/jobs/page.tsx`, `app/cna/jobs/[id]/page.tsx`, `components/client/StartMessageModal.tsx` / message actions (member gate). Create `app/kindred-standard/page.tsx`, `components/membership/UnlockCTA.tsx`.
**AC:**
- [ ] Non-member sees initials and an unlock CTA, members see names (R5.1, R5.3)
- [ ] Starting a message as a non-member is refused server-side (R5.4)
- [ ] `/kindred-standard` public and linked from nav/footer (R3.3)

### Task 1b.4: Verify
**AC:**
- [ ] tsc 0, build passes
- [ ] Screenshots at 390 and 1280 of /, /browse, /kindred-standard, /login, offline page
- [ ] SQL property checks P1–P5 pass

## Tests

| Test | File | Verifies |
|------|------|---------|
| SQL property checks | `scripts/verify-platform-model.sql` | P1–P5 |
| Smoke + screenshots | `scripts/smoke.mjs` | pages render, manifest, SW |
| membership helpers | `lib/membership.test.ts` (node:test) | isMemberStatus, price format |
