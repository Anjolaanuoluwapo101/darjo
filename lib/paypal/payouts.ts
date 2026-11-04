// PayPal Payouts helpers (server only).
import { paypal, centsToValue } from '@/lib/paypal';

export async function sendPayout(p: {
  key: string; // our idempotency key: the same key can never pay twice
  receiverEmail: string; amountCents: number; note: string;
}): Promise<string> {
  const r = await paypal<{ batch_header: { payout_batch_id: string } }>('/v1/payments/payouts', {
    method: 'POST',
    requestId: p.key,
    body: {
      sender_batch_header: {
        sender_batch_id: p.key,
        email_subject: "Your D'arjo payout has arrived",
        email_message: 'Your circle payout has been sent.',
      },
      items: [{
        recipient_type: 'EMAIL',
        receiver: p.receiverEmail,
        amount: { currency: 'USD', value: centsToValue(p.amountCents) },
        note: p.note,
        sender_item_id: p.key,
      }],
    },
  });
  return r.batch_header.payout_batch_id;
}

// SUCCESS | PENDING | PROCESSING | NEW | DENIED | CANCELED
export async function getBatchStatus(batchId: string): Promise<string> {
  const r = await paypal<{ batch_header: { batch_status: string } }>(`/v1/payments/payouts/${batchId}`);
  return r.batch_header.batch_status;
}
