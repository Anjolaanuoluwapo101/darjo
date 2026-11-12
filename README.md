# D'arjo

D'arjo is a rotating savings circle app. A small, trusted group agrees to put
the same amount into a pot every week or every month, and the pot goes to one
member per cycle. Contributions and payouts run through PayPal, and every member
builds a contribution score that follows them from circle to circle.

It is a demo experience, not a bank: there are no deposits and no promised
returns, and a late or missed contribution can still delay the pot.

## Contents

- [What the app does](#what-the-app-does)
- [How a circle works](#how-a-circle-works)
- [Money and currencies](#money-and-currencies)
- [Trust score, tiers and ranks](#trust-score-tiers-and-ranks)
- [Circle risk](#circle-risk)
- [Notifications and push](#notifications-and-push)
- [Scheduled jobs](#scheduled-jobs)
- [Data model](#data-model)
- [API routes](#api-routes)
- [Stack](#stack)
- [Local setup](#local-setup)
- [Checks and tests](#checks-and-tests)
- [Deploy](#deploy)
- [Repository layout](#repository-layout)
- [Branches and pull requests](#branches-and-pull-requests)
- [Licence](#licence)

## What the app does

| Screen | Purpose |
| --- | --- |
| Home | Marketing landing page: how it works, what you can check, and the risks of joining a circle. |
| Sign up / Log in | Create an account with a name, email, password and nationality. Nationality sets your currency and affects circle risk and PayPal payout eligibility. |
| Circle Studio | Browse open circles you can join (your tier or lower, nationality not excluded), plus a "find my circle" matcher that suggests circles by contribution, frequency and risk. |
| Join a circle | Enter the invite code shared by a circle's creator. |
| Create a circle | Set the name, USD contribution, weekly or monthly rhythm, member limit (2–12), and which nationalities are included or excluded. |
| Circle detail | See the pot collected this cycle, who has paid / is pending / is late, the turn order, the current winner, and a payout card when it is your turn. |
| Profile | Your contribution score (0–100), tier (1–4), rank, score history, your circles, and a currency-volatility reading. |
| Payouts | Payouts ready to release (only the cycle winner can release one), release history, and local-currency estimates. |
| Assistant | Ask questions about your circles, payments and payouts. It can draft a nudge to a member who has not paid, but it never releases a payout. |
| Notifications | In-app list of payment, payout, circle and score events, with unread counts and cursor pagination. |

## How a circle works

1. **Create the circle.** The creator picks a name, contribution amount
   (minimum $1.00), a weekly or monthly rhythm, a member limit (2–12), and
   optional nationality include/exclude lists. Turn positions are assigned before
   anyone joins, so everyone knows when their payout is due.
2. **Invite people.** The creator shares the invite code. A circle stays **open**
   until it fills; only open circles can be joined.
3. **The circle fills.** When the last seat is taken, the circle becomes
   **active** and cycle 1 payment rows are created with a due date (7 days for
   weekly, 30 days for monthly).
4. **Contribute each cycle.** Every member pays the same USD amount by the due
   date through PayPal. Pot progress is visible to everyone.
5. **Take your turn.** The member whose turn position matches the current cycle
   is the winner. When the pot is full, the payout is **prepared**. The winner
   releases it through PayPal Payouts; the platform keeps 1.5%, and the rest goes
   to the winner.
6. **Next cycle.** Once the payout is marked **paid**, the circle advances to the
   next cycle, new payment rows are created, and the next member in turn order
   becomes the winner. When every cycle is done, the circle is **completed**.

## Money and currencies

- Pots are collected and paid out in **US dollars**. PayPal converts a payout into
  the receiver's own currency, so the app shows a local-currency estimate next to
  each payout. It is a guide, not a locked rate.
- The platform fee is **1.5% of the pot**, taken before release.
- A member from a country PayPal cannot pay out to is refused a payout before any
  money is sent.
- D'arjo is **not a bank**, accepts no deposits, and promises no investment
  returns.

## Trust score, tiers and ranks

Every on-time, late, recovered or failed payment updates the contribution score
(clamped to 0–100):

| Event | Points |
| --- | --- |
| Paid on time | +5 |
| Caught up after being late | +2 |
| Paid late | −5 |
| Missed / failed payment | −10 |

The score sets the **tier**:

| Tier | Minimum score |
| --- | --- |
| 1 | 0 |
| 2 | 25 |
| 3 | 50 |
| 4 | 75 |

At tier 4 a cosmetic **rank** is based on completed circles: Bronze (1),
Silver (3), Gold (6), Ruby (10). A tier gates which circles are visible and
joinable in the Studio — you can see your own tier and lower tiers.

## Circle risk

Each circle carries a **safe / risky** tag computed for the viewer:

- If your own currency is highly volatile against the USD, the circle is marked
  risky for you.
- Otherwise, if at least 40% of the circle's members use high-volatility
  currencies, it is marked risky.

The tag comes with a plain-language reason, never buried in fine print.

## Notifications and push

Events (payment paid/late/failed, payout ready/sent/failed, circle filled, cycle
started, circle completed, tier up, nudge) create deduplicated in-app
notifications. Web Push delivery is attempted after each notification transaction
commits; stale subscriptions are cleaned up automatically.

## Scheduled jobs

Alongside a Vercel deployment, `vercel.json` registers two daily cron jobs. Both
require `CRON_SECRET` as a Bearer token.

- `/api/cron/notifications` — 09:00 UTC: marks past-due contributions late and
  retries pending push deliveries.
- `/api/cron/simulate` — 10:00 UTC: demo-only activity simulator that settles a
  share of due contributions and advances completed-cycle payouts so the hosted
  demo looks alive. It never calls PayPal.

## Data model

Prisma models in `prisma/schema.prisma`:

- **User** — id, name, optional business name (shown instead of the personal name
  for business accounts), email (unique), password hash, nationality, currency,
  score, tier, rank.
- **Circle** — id, name, creator, tier, contribution, frequency, member limit,
  status (open/active/completed), invite code, nationality include/exclude lists,
  current cycle.
- **Membership** — links a user to a circle with a fixed turn position.
- **Payment** — one row per member per cycle: status (pending/paid/late/failed),
  amount, due date, PayPal order/capture ids.
- **Payout** — one row per circle per cycle: gross, 1.5% fee, net, status
  (prepared/released/paid/failed), PayPal batch id.
- **ScoreEvent** — score changes with type and points.
- **Notification** — deduplicated in-app notifications with push tracking.
- **PushSubscription** — Web Push endpoints per user.
- **WebhookEvent** — PayPal webhook ids, to ignore duplicates.

## API routes

Auth and circle collection endpoints live in `app/api/[...path]/route.ts`
(signup, login, logout, me, circle list/create/get/join). Dedicated routes handle
PayPal payment start/capture, payout release, the PayPal webhook, the payouts hub,
profile, notifications, push subscriptions, FX volatility, the AI assistant,
contact, and the two cron jobs. `proxy.ts` is the middleware that guards app pages
by session cookie (skipped in mock mode).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM with
Neon Postgres, PayPal REST + JS SDK, web-push, jose (session JWTs), bcryptjs,
Gemini (`@google/genai`) for the assistant, the Frankfurter API for live FX rates
(with a fallback table), Vitest for tests, and Vercel for hosting and cron.

## Local setup

### Prerequisites

- Node.js 20+
- A Postgres database (Neon works well)
- A PayPal sandbox app for the real payment flow (optional if you use mocks)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd darjo
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill it in. `.env.local` is for machine-local
overrides (for example `DEMO_TOOLS=true`) and is not committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Direct connection, used for migrations |
| `AUTH_SECRET` | Signs the session cookie; 32+ random characters |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | PayPal REST app credentials |
| `PAYPAL_WEBHOOK_ID` | Webhook ID from the PayPal dashboard |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Same client ID, exposed to the browser SDK |
| `NEXT_PUBLIC_USE_MOCKS` | `true` serves `mocks/*.json` and skips the auth gate |
| `DEMO_TOOLS` | `true` enables `/api/dev/reset` and `/api/dev/mark-late` |
| `DEMO_SEED_USERS` | Optional JSON array of demo users for the reset endpoint |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS` | Assistant |
| `FX_API_KEY` | Exchange rates |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `CRON_SECRET` | Secret shared with the Vercel cron jobs |

Production cookies are `Secure`, so the app must be served over HTTPS in
production. Local `next dev` runs on `http://localhost` and issues a non-secure
cookie.

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000 for the landing page. Use **Sign in** to reach
`/login`; signed-out visitors to app pages are sent to `/login`.

### 5. Demo data (optional)

```bash
npm run seed
```

This wipes the database and recreates the demo: PayPal sandbox people, demo
accounts, and 50 circles (10 open, 20 active, 20 completed) with payment and
score history. The sandbox accounts live in `data/demo-users.json`; their app
password is the same as their PayPal sandbox password. They are sandbox accounts
only and never work against live PayPal. The script prints sign-in credentials.
Only run it against a demo database you can afford to wipe.

With `DEMO_TOOLS=true`, you can also POST `{"confirm":"RESET"}` to
`/api/dev/reset` to recreate the demo people from `DEMO_SEED_USERS` (or the
built-in default). Never enable it against data you care about.

### Frontend without a backend

Set `NEXT_PUBLIC_USE_MOCKS=true` and restart. The API client reads `mocks/*.json`
and `proxy.ts` lets every route through, so no database or session is needed.

## Checks and tests

```bash
npm test          # Vitest unit tests
npx tsc --noEmit  # TypeScript
npm run lint      # ESLint
npm run build     # Production build (also type-checks)
```

`npm run seed` needs a reachable database and wipes it, so do not run it in the
middle of a demo.

`node scripts/smoke-api.mjs` runs an end-to-end smoke test against the real API.
It starts `next dev` on port 3100, signs up three throwaway users, and checks the
non-member view, the hidden circle, joining, unpaid, late, failed and paid
contributions. Pass `--base=http://localhost:3000` to use a server you already
have running, or `--skip-db` to leave out the direct database probes.

Mock circles `c1` and `c2` are the standard fixtures. `c3` is a non-member view
of an open circle and `c4` is a member who has not paid this cycle.

## Deploy

The Vercel build command is `npm run vercel-build`
(`prisma generate && next build`). Add the environment variables above in the
project settings, apply migrations with `npx prisma migrate deploy`, and set
`NEXT_PUBLIC_USE_MOCKS=false` and `DEMO_TOOLS=false` for anything public.

The two cron schedules live in `vercel.json` and are registered automatically on
deploy.

## Repository layout

| Path | What lives there |
| --- | --- |
| `app/` | Screens and API routes |
| `components/` | Screen building blocks |
| `lib/` | Server helpers, PayPal client, rules engine, FX helpers, notifications, push, assistant |
| `data/` | Country list and the demo sandbox accounts |
| `mocks/` | Sample data used when `NEXT_PUBLIC_USE_MOCKS=true` |
| `prisma/` | Database schema and migrations |
| `scripts/` | Seed script, payout backfill and the API smoke test |
| `tests/` | Vitest unit tests |
| `docs/` | Demo script and supporting notes |

See [SETUP.md](SETUP.md) for a shorter setup checklist and
[docs/demo-script.md](docs/demo-script.md) for a guided demo.

## Branches and pull requests

`master` is the default branch and always holds the code that is deployed.

Work goes on a feature branch named `c/<what-it-is>`, for example
`c/countries-data`, `c/fx-volatility`, `c/profile-screen` or `c/assistant-screen`.
Every pull request targets `master` and needs a review before it is merged.

## Licence

See [LICENSE](LICENSE).
