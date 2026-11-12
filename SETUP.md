# Setup

## Requirements

- Node 20+
- A Postgres database (Neon works well)
- A PayPal sandbox app for the payment flow

## Environment

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

Production cookies are `Secure`, so the app must be served over HTTPS. Local
`next dev` runs on `http://localhost` and issues a non-secure cookie.

## First run

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000 for the landing page. Sign in from the header; any
signed-out user who opens an app page is sent to `/login` by `proxy.ts`.

## Demo data

`npm run seed` wipes the database and recreates the demo: three PayPal sandbox
people and one circle whose first cycle is already paid, with the Japan account
as the winner, so a payout can be released straight away.

```bash
npm run seed
```

The sandbox accounts live in `data/demo-users.json` and their app password is
the same as their PayPal sandbox password. They are sandbox accounts only and
never work against live PayPal.

With `DEMO_TOOLS=true`, you can also POST `{"confirm":"RESET"}` to
`/api/dev/reset` to recreate the demo people from `DEMO_SEED_USERS` (or the
built-in default). The reset wipes existing rows, so never enable it against
data you care about.

## Payouts and currencies

The pot is always collected and paid out in US dollars. PayPal converts the
payout into the receiver's own currency, so the app only shows an estimate next
to the payout, and the country list in `data/countries.ts` follows the PayPal
Payouts country list. A member from a country PayPal cannot pay out to is
refused the payout before any money is sent.

## Frontend without a backend

Set `NEXT_PUBLIC_USE_MOCKS=true` and restart. The API client reads `mocks/*.json`
and `proxy.ts` lets every route through, so no database or session is needed.

## Checks

```bash
npm test
npx tsc --noEmit
npx eslint app components lib data types scripts proxy.ts next.config.ts
npm run build
```

`npm run build` also runs TypeScript. `npm run seed` needs a reachable database
and wipes it, so do not run it in the middle of a demo.

## Tests

`npm test` runs the Vitest unit tests in `tests/`: the rules engine and the mock
branches of `lib/api-client.ts`. `lib/api-client.ts` reads
`NEXT_PUBLIC_USE_MOCKS` when the module loads, so the tests set the variable and
re-import the module for every case.

`node scripts/smoke-api.mjs` runs an end-to-end smoke test against the real API.
It starts `next dev` on port 3100, signs up three throwaway users, and checks the
non-member view, the hidden circle, joining, unpaid, late, failed and paid
contributions. Pass `--base=http://localhost:3000` to use a server you already
have running, or `--skip-db` to leave out the direct database probes.

The smoke test keeps its rows on purpose. The circles it creates are set to
`completed` when the run ends so they stay out of Studio and join lists; the
created emails are printed at the end of the run.

Mock circles `c1` and `c2` are the standard fixtures. `c3` is a non-member view
of an open circle and `c4` is a member who has not paid this cycle.

## Deploy

The Vercel build command is `npm run vercel-build` (`prisma generate && next
build`). Add the environment variables above in the project settings, apply
migrations with `npx prisma migrate deploy`, and set `NEXT_PUBLIC_USE_MOCKS=false`
and `DEMO_TOOLS=false` for anything public.
