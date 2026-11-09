# D'arjo

D'arjo is a savings-circle app: a small group of people agrees to put the same
amount into a pot every week or every month, and the pot goes to one member per
cycle. Everyone pays through PayPal, and the money is paid out through PayPal
Payouts.

## What is in the app

- **Sign up and join** with a country, so the app can warn you when a circle
  carries currency risk (a circle where many members use a currency that swings
  against the US dollar is marked risky).
- **Circle Studio** lists the circles you can join, split into your own tier and
  the tiers below.
- **Circle pages** show the pot, who has paid, whose turn it is and what the
  payout will be, in US dollars and as a rough estimate in the winner's own
  currency.
- **Profile** shows your D'arjo score, your tier and rank, your score history
  and how steady your currency is.
- **Assistant** answers questions about your circles, payments and payouts, and
  can draft a nudge for someone who has not paid yet.
- **Payouts** go out through PayPal Payouts. The pot is always collected and sent
  in US dollars, and PayPal converts it into the receiver's own currency.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma with
Neon Postgres, PayPal REST + JS SDK, and Gemini for the assistant.

## Quick start

```bash
npm install
npx prisma migrate deploy
npm run seed      # optional: three PayPal sandbox people and a ready-to-pay circle
npm run dev
```

Open http://localhost:3000. `/` redirects to `/studio`.

`npm run seed` wipes the database first, so only run it against a demo
database. See [SETUP.md](SETUP.md) for the environment variables and
[docs/demo-script.md](docs/demo-script.md) for a guided demo.

## Checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Layout

| Path | What lives there |
| --- | --- |
| `app/` | Screens and API routes |
| `components/` | Screen building blocks |
| `lib/` | Server helpers, PayPal client, rules engine, FX helpers |
| `data/` | Country list and the demo sandbox accounts |
| `mocks/` | Sample data used when `NEXT_PUBLIC_USE_MOCKS=true` |
| `prisma/` | Database schema and migrations |
| `scripts/` | Seed script and the API smoke test |
| `tests/` | Vitest unit tests |

## Licence

See [LICENSE](LICENSE).
