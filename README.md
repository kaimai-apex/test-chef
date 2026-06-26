# Hearth — private chef marketplace (working build)

A runnable, full-stack implementation of the private-chef marketplace planned in
`~/Desktop/chef`. It builds the **entire core loop** from the plan as a Next.js web
app so you can click through the real product — client side, chef side, and the
admin console — against seeded data.

> The plan (doc 05) calls for a **native SwiftUI iOS app + Supabase + Stripe**. A
> native app can't be compiled or demonstrated in this environment, so this build
> is the same marketplace as a **runnable web app** with a Supabase-ready data
> layer. It's faithful to the data model (doc 06), pricing (doc 03), and product
> spec (doc 02); the web UI is the verifiable stand-in for the SwiftUI client, and
> the booking/pricing/escrow logic is exactly what the iOS app would call.

## Run it

```bash
cd ~/Desktop/chef-app
npm install      # already done
npm run dev      # → http://localhost:3007 (or `next dev`)
```

There's no login. Use the **"Viewing as"** switcher (top-right) to move between
three personas — this is the demo stand-in for Supabase Auth:

| Persona | Who | Sees |
|---------|-----|------|
| **Client** (Jordan Lee) | a buyer | Discover, booking flow, their bookings, messaging, reviews |
| **Chef** (Ana Reyes) | a supplier | Dashboard, requests inbox, menus, earnings/payouts |
| **Admin** (Hearth ops) | us | Approval queue, bookings table, GMV dashboard, refunds |

## What's built (maps to the plan)

The full **core loop** from doc 02 works end-to-end:

> discover → pick menu & date → guests/allergies/address → pay (escrow) → chef
> accepts → message → service → payout releases → both review

- **Landing page** (`/`) — two funnels: client browse/waitlist + chef recruiting (doc 04)
- **Chef application** (`/apply`) — the onboarding funnel → admin review queue (doc 04)
- **Discover** (`/discover`) — browse + filter by date/party/cuisine/price (doc 02)
- **Chef profile** (`/chefs/[id]`) — bio, menus with courses, availability, reviews (doc 02)
- **Booking flow** (`/book/[menuId]`) — 5-step: date → guests → **allergies** → address → review/pay, with a **live all-in price calculator** (doc 02/03)
- **Bookings** (`/bookings`, `/bookings/[id]`) — status, allergies front-and-center, messaging, reviews, escrow state
- **Chef mode** (`/chef`, `/chef/requests`, `/chef/menus`, `/chef/earnings`) — dashboard, accept/decline, menu manager, payout ledger
- **Admin** (`/admin`) — verify & approve chefs, bookings oversight, refunds, GMV/active-supply dashboard

Cross-cutting rules from doc 02 are honored: **allergies are a first-class citizen**
(safety screen in booking, highlighted on every booking view, chef-ack prompt);
**price is always all-in**; **double-blind reviews**; **trust signals** (verified
badges, completions, ratings); **empty states** route somewhere useful.

### Pricing is real (doc 03)

`src/lib/pricing.ts` is the single source of truth: **15% chef commission + 8%
client service fee**. The worked example in doc 03 (an 8-guest $120/guest dinner +
$40 travel) produces exactly **$1,162.50 charged / $850 chef payout** in the app —
verified in the booking flow and earnings ledger.

## Architecture

```
Next.js 16 (App Router, RSC) + Tailwind v4
  src/app/**          pages (server components) + server actions
  src/lib/
    types.ts          domain types (mirror db/schema.sql)
    pricing.ts        take-rate engine (doc 03)
    booking.ts        booking state machine (doc 02)
    store.ts          data access seam  ← swap this for Supabase
    seed.ts           hand-seeded launch cohort (doc 04)
    actions.ts        all mutations (booking lifecycle, escrow, reviews, admin)
    session.ts        persona cookie (stand-in for Supabase Auth)
  src/components/**    UI (ChefCard, BookingFlow, MessageThread, PriceBreakdown, …)
  db/schema.sql       production Postgres schema + RLS (doc 06)
  db/seed.sql         representative SQL seed
```

Data lives in a local JSON file (`.data/db.json`), seeded on first run. **Every
read/write goes through `src/lib/store.ts`** — that's the seam. Delete
`.data/db.json` to reset to the seed.

## Going to production (the doc 05 stack)

1. **Supabase** — create the project, run `db/schema.sql` (tables + RLS) and seed.
   Replace the functions in `src/lib/store.ts` with Supabase client calls
   (same signatures). Replace `src/lib/session.ts` with Supabase Auth.
2. **Stripe Connect** — the escrow flow is simulated (`escrow` field transitions
   `authorized → held → released`). Wire `createBooking`/`chefAccept`/`chefComplete`
   in `src/lib/actions.ts` to Stripe authorize→capture→transfer, with a webhook
   (Supabase Edge Function) as the source of truth for payment state.
3. **iOS** — the SwiftUI app from doc 02 consumes the same Supabase backend; this
   web app's flows and pricing are the reference implementation.

## Notes

- Food photos are deterministic gradient placeholders (no external images) so the
  UI renders identically every time. In production these are Supabase-hosted
  photos — the product is the food photography (doc 04).
- Launch city is **Austin** as a placeholder (doc 00/04: your co-founder's metro).
- The `⚠ DECIDE` levers (commission, service fee, city) are constants in
  `src/lib/pricing.ts` — change them in one place.
