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

Open http://localhost:3000. `/` redirects to `/studio`; signed-out users are sent
to `/login` by `proxy.ts`.

## Demo data

With `DEMO_TOOLS=true`, sign in with a seeded person (`secret123` by default) and
POST `{"confirm":"RESET"}` to `/api/dev/reset` to recreate the demo circle. The
reset wipes existing rows, so never enable it against data you care about.

## Frontend without a backend

Set `NEXT_PUBLIC_USE_MOCKS=true` and restart. The API client reads `mocks/*.json`
and `proxy.ts` lets every route through, so no database or session is needed.

## Checks

```bash
npx tsc --noEmit
npx eslint app components lib data types proxy.ts next.config.ts
npm run build
```

`npm run build` also runs TypeScript.

## Deploy

The Vercel build command is `npm run vercel-build` (`prisma generate && next
build`). Add the environment variables above in the project settings, apply
migrations with `npx prisma migrate deploy`, and set `NEXT_PUBLIC_USE_MOCKS=false`
and `DEMO_TOOLS=false` for anything public.
