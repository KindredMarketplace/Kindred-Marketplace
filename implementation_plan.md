---
title: Kindred 90-Day Implementation Plan
type: plan
status: living
created: 2026-11-05
---

# Kindred: 90-Day Implementation Plan

**Launch target: February 1, 2027** (moved from Jan 24 on 2026-11-06). In-home care only: no facilities / B2B (decided Oct 2026; the facility HTML mocks stay in Front-End/ for reference only). Phase 7 is the store-app follow-on.

| Phase | Dates | Title | Ships |
|---|---|---|---|
| 1 | Nov 5 – 6 ✅ | **Business-model foundation** | Build passes; K brand; installable PWA; B2B archived; memberships + founding 25; Kindred Standard; locked preview with DB-level redaction; Stripe Checkout + webhook; migrations 00023–00026 live; platform-model copy across every page; facilities removed; Pricing in the top nav |
| 2 | Nov 7 – 22 | Caregiver onboarding to "listed" | Proof of hours with the application; Level 2 / ID / insurance only after acceptance (Nick, Nov 9); private uploads with signed URLs; admin review queue + verifications queue; interview invites via Calendly link; one-time "You're in!" welcome; status-aware caregiver dashboard; insurer starting points on Get insured; background-check route decided (see Nov 9 notes) |
| 3 | Nov 23 – Dec 6 | Family experience | Real browse filters; full profile page (Marcus's "does she have this?" test); member-gated messaging + job posts; family FAQ (household employer, HomePay pointer); comp family membership from admin |
| 4 | Dec 7 – 20 | Distance + matching + notifications | Google Maps key; caregiver work radius; distance shown; jobs-near-me; **notifications system** (below) |
| 5 | Dec 21 – Jan 10 | Trust loop + polish | Reviews after hire (through a function, not public rows); report / block; legal pages final with attorney; accessibility pass; Sentry; Next `middleware` → `proxy` rename; React 19 |
| 6 | Jan 11 – 25 | Launch hardening | Full pentest re-run; Zod 4; Playwright E2E for both journeys; Supabase advisors clean; leaked-password protection; Vercel production on kindredmarketplace.com; Stripe live keys + dashboard webhook |
| 🚀 | **Feb 1** | **Launch** | Founding-25 recruiting live, ads pointed at the app |
| 7 | After launch | Store apps | Capacitor wrapper for the App Store / Play Store, push notifications |

## Phase 1 tasks (this session)

1. Build health: generate live DB types, upgrade the Supabase SSR client, zero type errors, `next build` passes.
2. Brand: K mark component + favicons + metadata tagline.
3. Installable app: manifest, icons, service worker, offline page, install prompt.
4. Scope cleanup: archive the business portal, redirect dead routes, fix footer / nav links.
5. DB migration 00023: access_plans, memberships, Kindred Standard, founding trigger, browse functions, RLS tightening.
6. Membership app layer: `lib/membership.ts`, Stripe Checkout route, webhook, membership pages for both portals, admin comp.
7. Locked preview UI: `/browse`, `/client/browse` and caregiver jobs read through the browse functions; unlock CTAs; `/kindred-standard` page.
8. Verify: build, smoke screenshots, SQL property checks.


## Notifications (Phase 4, noted Nov 9)

Nick's list of moments that should notify someone. The `notifications` table already exists (00009); what's missing is creating rows at each moment, an in-app bell, email (Resend), and phone push (web push works for the installed iPhone/Android app; Capacitor push in Phase 7).

| Who | Moment |
|---|---|
| Caregiver | Application received |
| Caregiver | Invited to interview (with booking link) / interview booked |
| Caregiver | Accepted into Kindred ("You're in") |
| Caregiver | Background check verified / ID verified / insurance verified / a document needs a new copy |
| Caregiver | Listed: families can now find you |
| Caregiver | Insurance or background check expiring in 30 days |
| Caregiver | New job posted in your area |
| Both | New message |
| Family | A caregiver applied to your job / accepted your message request |
| Admin | New application / new document uploaded for review |

## Backlog from Nick's phone testing (Nov 10)

- **Forgot password / change password** flow (there is none yet; admins can set a password from People in the meantime).
- Settings: notification choices (with the Phase 4 notifications system), two-step sign-in, signed-in devices, pause profile, download my data, time zone / language.
- Family side: profile photo and a working Account page (mirror of the caregiver settings work).
- Optional: admin review of new profile photos before families see them.
