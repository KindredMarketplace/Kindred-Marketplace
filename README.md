# Kindred Marketplace

> A Florida-first marketplace connecting families with vetted Certified Nursing Assistants.

This is the application monorepo: Next.js 14 (App Router) + Supabase + Stripe Connect.

---

## What's in this scaffold

Generated during the AFK build session — a complete foundation you can run locally and start building features on.

| Layer | Status |
|---|---|
| Folder structure (Next.js App Router) | ✅ Done |
| Database schema (13 migrations, 40 tables, all RLS-enabled) | ✅ Applied live |
| Storage buckets (avatars, documents, attachments, public) | ✅ Applied live |
| Service taxonomy seed (39 service tags) | ✅ Applied live |
| Brand palette + fonts (Fraunces + Inter) wired into Tailwind | ✅ Done |
| Supabase client wrappers (browser/server/middleware) | ✅ Done |
| Stripe client + fee calculator | ✅ Done |
| Landing page placeholder | ✅ Done |
| Health-check endpoint (`/api/health`) | ✅ Done |
| Auth callback handler | ✅ Done |
| Auth UI (login/signup forms) | ⏳ Not started |
| Onboarding flows (CNA wizard, client wizard) | ⏳ Not started |
| Browse/search pages | ⏳ Not started |
| Booking + payment flows | ⏳ Not started |
| Stripe webhook handler | ⏳ Stub only |
| Messaging UI | ⏳ Not started |
| Mobile responsiveness pass | ⏳ Pending |

---

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Open `SECRETS.txt`

That file (gitignored) lists:
- Your Supabase project ref (`fibrhkrdyadnuebwovac`)
- Database password — **rotate this immediately**, it was shared in chat
- Checklist of keys to grab from Stripe, Mapbox, Resend, etc.

The Supabase **anon** key is already filled into `.env.local`. You still need:
- `SUPABASE_SERVICE_ROLE_KEY` — [grab it here](https://supabase.com/dashboard/project/fibrhkrdyadnuebwovac/settings/api)
- Stripe test keys — [grab here](https://dashboard.stripe.com/test/apikeys)
- (P1) Mapbox token, (P1) Resend key

### 3. Generate database types

```bash
npx supabase login   # one time
npm run db:types     # writes types/database.types.ts
```

This replaces the temporary type stub with full schema-aware types.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 — landing page should render with the Kindred gradient hero.

### 5. Smoke-test the database connection

```bash
curl http://localhost:3000/api/health
```

Should return `{"status":"ok",...}` with a low `uptime_ms`. If you get `503`, double-check your env vars.

---

## Project structure

```
kindred/
├── app/                          Next.js App Router
│   ├── (marketing)/              Public marketing pages
│   ├── (auth)/login/             Login flow
│   ├── (auth)/signup/            Signup flow
│   ├── (client)/dashboard/       Family/client portal
│   ├── (cna)/dashboard/          Caregiver portal
│   ├── (business)/dashboard/     B2B portal (v2)
│   ├── api/health/               Health check
│   ├── auth/callback/            OAuth/magic-link callback
│   ├── layout.tsx                Root layout, fonts, metadata
│   ├── page.tsx                  Marketing landing
│   └── globals.css               Tailwind directives + base styles
├── components/                   Shared React components
│   └── ui/                       Primitives (Button, Card, Dialog...)
├── lib/
│   ├── supabase/                 Database client wrappers
│   │   ├── client.ts             Browser-side client
│   │   ├── server.ts             Server-side client + service-role client
│   │   └── middleware.ts         Session-refresh logic
│   ├── stripe/                   Payment client + fee calc
│   │   ├── server.ts             Server-only Stripe SDK
│   │   ├── client.ts             Stripe.js loader
│   │   └── fees.ts               Tiered platform fee calculator
│   └── utils/
│       ├── cn.ts                 Tailwind-aware className merger
│       └── money.ts              Cents ↔ display formatters
├── supabase/
│   ├── migrations/               13 .sql migrations (applied live)
│   └── seed/                     Service taxonomy seed
├── types/
│   └── database.types.ts         (Auto-generate via `npm run db:types`)
├── middleware.ts                 Wires Supabase session refresh
└── docs/
    └── architecture.md           Schema overview + roadmap
```

---

## Database overview

40 tables, all with Row Level Security. See `docs/architecture.md` for the full
schema map.

**Key tables:**

| Domain | Tables |
|---|---|
| Identity | `users`, `client_profiles`, `cna_profiles`, `care_recipients` |
| CNA details | `cna_services`, `cna_verifications`, `cna_service_areas`, `cna_availability` |
| Marketplace | `jobs`, `job_applications`, `bookings`, `shifts` |
| Payments | `payments`, `payment_methods`, `platform_fee_config`, `refunds` |
| Messaging | `message_threads`, `messages` |
| Trust & Safety | `reviews`, `favorites`, `audit_log`, `documents` |
| Training liaison | `training_partners`, `training_partner_cohorts`, `training_referrals` |
| B2B (schema-only in v1) | `organizations`, `organization_members`, `business_shifts`, `timesheets`, `invoices`, ... |

**Brand palette (locked in Tailwind):**
- `sage` `#8FC9B5` (calm/wellness)
- `teal` `#5BA9B8` (trust/professional)
- `sky` `#7BB3D6` (openness)
- `coral` `#E89B85` (warmth/care accent)
- `cream` `#FBFAF6` (background)

Fonts: **Fraunces** (display headings), **Inter** (body).

---

## Important context

### What we are
A **marketplace** (not a staffing agency). CNAs are 1099 contractors. Clients hire directly. We facilitate the connection, payments, and trust signals.

### What we are NOT (yet)
- A staffing agency
- A training school (we **liaise** to local schools and collect a referral fee)
- HIPAA-compliant infrastructure (we're on Supabase free tier; plan to upgrade to HIPAA tier pre-launch)
- Medicaid-billing-ready (schema supports it; vendor selection + EVV integration deferred)

### Payment models in v1
- **Self-pay** — fully supported, Stripe Connect escrow
- **LTC insurance** — client pays self-pay; we generate visit logs for them to submit
- **Medicaid** — schema ready, billing wiring deferred (requires HIPAA tier + EVV vendor)

---

## Useful commands

```bash
npm run dev            # Start dev server (port 3000)
npm run build          # Production build
npm run type-check     # TypeScript without emit
npm run lint           # ESLint

# Database
npm run db:types       # Regenerate TypeScript types from live schema
npm run db:diff        # Show schema drift vs migrations
```

## Key links

- **Live Supabase project:** https://supabase.com/dashboard/project/fibrhkrdyadnuebwovac
- **Database advisors:** https://supabase.com/dashboard/project/fibrhkrdyadnuebwovac/advisors/security
- **Stripe test dashboard:** https://dashboard.stripe.com/test/dashboard
- **GitHub repo:** Kindred-Marketplace (push this scaffold to it)

---

## What to tackle next (suggested order)

1. **Auth UI** — login + signup forms wired to Supabase Auth. Magic link is fine for MVP.
2. **CNA onboarding wizard** — the multi-step apply flow. Schema is ready (`cna_profiles`, `cna_services`, `cna_verifications`, `cna_availability`).
3. **Browse page** — list/grid of CNAs with filters using `service_taxonomy`. Mapbox component.
4. **Job posting** — client-side form → inserts into `jobs`. Notify nearby CNAs.
5. **Booking + Stripe Connect** — wire up CNA Express onboarding, payment intents, escrow release on shift completion.
6. **Messaging UI** — thread list + chat view. Schema is ready.
7. **Reviews** — post-shift prompts. Tier promotion is already automatic via trigger.

---

## Open product questions worth resolving early

These are in the **Open Questions** tab of your build tracker:

| # | Question | Default chosen |
|---|---|---|
| Q2 | Fee structure | Tiered (15/12/10%) — `platform_fee_config` |
| Q3 | CNA earnings range | Open — doesn't block schema |
| Q5 | Training payment model | Per-partner setting (all 3 supported) |
| Q6 | BG check required | Defaults to optional |
| Q9 | Cancellation policy | Snapshot stored per booking — needs policy text |
| Q11 | B2B timing | Schema now, UI 90+ days post-launch |
| Q13 | First B2B target | ALFs |
| Q14 | Same CNA pool for B2B? | Yes (same `cna_profiles`) |

---

## License

Proprietary — Kindred Marketplace, all rights reserved.
