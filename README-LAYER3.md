# Layer 3: release payout (drops onto starter + layers 1 and 2)

Copy into your project, keeping folders. The webhook file REPLACES the layer 2 one.
  lib/paypal/payouts.ts
  lib/payouts.ts
  app/api/circles/[id]/payout/release/route.ts
  app/api/webhooks/paypal/route.ts   (replace)

No new packages. In the PayPal dashboard webhook, also tick the payout batch success and denied events.

## Test (PowerShell)
IMPORTANT: the winner's account email must be a sandbox PERSONAL account email, because the payout is sent to it.
1. Fill a circle so every member has paid (a payout row with status "prepared" appears).
2. Log in as the winner (turn position equals the current cycle; for cycle 1 that is the first member / creator):
   $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
   Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"WINNER_EMAIL","password":"PASSWORD"}' -WebSession $s
3. Release:
   Invoke-RestMethod -Uri http://localhost:3000/api/circles/CIRCLE_ID/payout/release -Method Post -WebSession $s
4. Expect payout.status "released" or "paid". Check the winner's balance at sandbox.paypal.com.
5. Call release again: you should get PAYOUT_ALREADY_RELEASED (proves no double pay).
6. After "paid", the circle moves to cycle 2 with new payment rows (or becomes completed after the last cycle).
