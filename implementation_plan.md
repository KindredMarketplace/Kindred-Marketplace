---
title: Kindred 90-Day Implementation Plan
type: plan
status: living
created: 2026-11-05
---

# Kindred: 90-Day Implementation Plan

**Launch target: Jan 24, 2027** (12 weeks from today, 2026-11-05). One phase is roughly one focused build session. Phases 1 through 6 are launch-critical. Phase 7 is the store-app follow-on.

| Phase | Weeks | Title | Ships |
|---|---|---|---|
| 1 | Nov 5 | **Business-model foundation** | Build passes; K brand; installable PWA; B2B archived; memberships + founding 25; Kindred Standard; locked preview with DB-level redaction; Stripe Checkout + webhook |
| 2 | Nov 9 – 22 | Caregiver onboarding to "listed" | Document upload for ID / L2 / insurance on the compliance page; admin verify panel with expiry; experience-hours capture in /apply; "You're listed" state; recommended insurance carriers list |
| 3 | Nov 23 – Dec 6 | Family experience | Wire browse filters (rate, availability, languages, care types); full profile page that answers every question up front (Marcus's test); membership-gated messaging + job posting; family FAQ ("you are the employer", HomePay pointer) |
| 4 | Dec 7 – 20 | Distance + matching | Google Maps key; caregiver work radius / drawn area; family distance shown; jobs-near-me for caregivers; email notifications (Resend) for messages, applications, verification expiring |
| 5 | Dec 21 – Jan 10 | Trust loop + polish | Reviews after hire; report / block; legal pages final (attorney input); copy pass for the new model; empty states; accessibility pass; Sentry |
| 6 | Jan 11 – 24 | Launch hardening | Playwright E2E for both journeys; RLS audit; Supabase advisors clean; Vercel prod at app.kindredmarketplace.com; Stripe live keys; landing → app links; founding-25 recruitment live |
| 7 | Post-launch | Store apps | Capacitor wrapper for iOS / Android around the PWA, push notifications, store listings |

## Phase 1 tasks (this session)

1. Build health: generate live DB types, upgrade the Supabase SSR client, zero type errors, `next build` passes.
2. Brand: K mark component + favicons + metadata tagline.
3. Installable app: manifest, icons, service worker, offline page, install prompt.
4. Scope cleanup: archive the business portal, redirect dead routes, fix footer / nav links.
5. DB migration 00023: access_plans, memberships, Kindred Standard, founding trigger, browse functions, RLS tightening.
6. Membership app layer: `lib/membership.ts`, Stripe Checkout route, webhook, membership pages for both portals, admin comp.
7. Locked preview UI: `/browse`, `/client/browse` and caregiver jobs read through the browse functions; unlock CTAs; `/kindred-standard` page.
8. Verify: build, smoke screenshots, SQL property checks.
