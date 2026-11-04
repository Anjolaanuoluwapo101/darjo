# Layer 2: PayPal Checkout + webhook (drops onto starter + layer 1)

Copy into your project, keeping folders:
  lib/paypal/index.ts
  lib/payments.ts
  app/api/circles/[id]/pay/[[...step]]/route.ts
  app/api/webhooks/paypal/route.ts

.env needs: PAYPAL_ENV=sandbox, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID (after you register the webhook).
No new packages needed.

## Test the payment flow without a frontend (PowerShell)
1. Make two users and a 2-member circle (second user joins) so the circle becomes ACTIVE.
   $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
   Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"a@x.com","password":"secret123"}' -WebSession $s
2. Start a payment:
   Invoke-RestMethod -Uri http://localhost:3000/api/circles/CIRCLE_ID/pay -Method Post -WebSession $s
   -> returns orderId
3. In a browser, open https://www.sandbox.paypal.com/checkoutnow?token=ORDER_ID , log in with a sandbox PERSONAL account, approve.
4. Capture:
   Invoke-RestMethod -Uri http://localhost:3000/api/circles/CIRCLE_ID/pay/capture -Method Post -ContentType 'application/json' -Body '{"orderId":"ORDER_ID"}' -WebSession $s
   -> payment.status should be "paid"; check the Payment row, user score (+5) and, when everyone has paid, a Payout row with status "prepared".
5. Webhook needs a public URL (Vercel or a tunnel). Register it, copy the Webhook ID into .env, then use the dashboard webhook simulator.
