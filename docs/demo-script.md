# Demo script

A short path through the app with the PayPal sandbox. It takes about ten
minutes and shows the money side of the product: joining a circle, paying into
the pot, and paying the pot out.

## Before you start

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

`npm run seed` wipes the database and puts back three PayPal sandbox people and
one circle. The accounts are in `data/demo-users.json`; the app password is the
same as the PayPal sandbox password.

| Person | Country | Role in the demo |
| --- | --- | --- |
| Kenji Sandbox (`sb-eytkw...`) | JP | Winner of cycle 1, releases the payout |
| Ada Sandbox (`sb-yl7dj...`) | US | Pays the next cycle |
| Ben Sandbox (`sb-ql7kl...`) | US | Has not paid yet, so the assistant can nudge him |

Open http://localhost:3000 and sign in.

## 1. The circle and the pot

Sign in as Kenji and open **Sandbox Savings Circle**.

- The pot shows three contributions of $50 and the cycle is fully paid.
- The payout card shows what Kenji receives, in US dollars and as an estimate in
  Japanese yen. Say that the money is sent in dollars and PayPal converts it,
  so the final yen amount is PayPal's own rate.

## 2. Release the payout

Press **Release payout** on the payout card.

- The app sends the money through PayPal Payouts to Kenji's sandbox account.
- The status moves to released and then paid, and the circle moves on to cycle 2.
- If the sandbox refuses, check `PAYPAL_ENV`, `PAYPAL_CLIENT_ID` and
  `PAYPAL_CLIENT_SECRET` in `.env`, and that the sandbox account is a personal
  account.

## 3. Pay the next cycle

Sign out, sign in as Ada and open the same circle.

- The circle is on cycle 2 and Ada has not paid yet.
- Press **Pay** and complete the PayPal checkout. The app listens for the
  webhook and marks the contribution paid.

## 4. The assistant

Open **Assistant** (or press **Ask the assistant** on a circle page).

- Ask "Who has not paid this cycle?" and the assistant names Ben.
- Ask it to draft a nudge and it shows the message it wrote.
- Note that the assistant can prepare a payout but never releases one.

## 5. The profile

Open **Profile**.

- The score ring shows the D'arjo score and how far the next tier is.
- The currency card shows how steady the member's currency is against the US
  dollar, and where that reading came from.
- The score history lists every payment and the points it earned.

## 6. Joining a circle

Sign out and sign in as Ben, then open the Studio.

- Joining is by invite code (`DEMO24` for the seeded circle) or from the
  Studio list.
- A circle is marked risky when many of its members use a currency that swings
  against the US dollar; the tag explains why.

## If something goes wrong

- **No sign-in?** The session cookie needs `AUTH_SECRET` in `.env`.
- **Payout fails?** The winner must be on a country PayPal can pay out to; the
  app refuses earlier with `COUNTRY_NOT_SUPPORTED` otherwise.
- **Assistant always falls back?** `GEMINI_API_KEY` is missing; the app keeps
  working and the assistant says so.
