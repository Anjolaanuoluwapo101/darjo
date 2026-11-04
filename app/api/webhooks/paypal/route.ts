// REPLACES the layer 2 webhook file. Adds payout events.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server';
import { verifyWebhook } from '@/lib/paypal';
import { settlePayment, failPayment } from '@/lib/payments';
import { finalizePayout, failPayout } from '@/lib/payouts';


interface PayPalEvent {
  id: string; event_type: string;
  resource?: {
    id?: string; custom_id?: string; payout_batch_id?: string;
    batch_header?: { payout_batch_id?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

async function findPayment(event: PayPalEvent) {
  const r = event.resource;
  if (r?.custom_id) {
    const [circleId, cycle, userId] = r.custom_id.split(':');
    if (circleId && cycle && userId)
      return db.payment.findUnique({
        where: { circleId_cycle_userId: { circleId, cycle: Number(cycle), userId } },
      });
  }
  const orderId = r?.supplementary_data?.related_ids?.order_id;
  return orderId ? db.payment.findFirst({ where: { paypalOrderId: orderId } }) : null;
}

async function findPayout(event: PayPalEvent) {
  const batchId = event.resource?.batch_header?.payout_batch_id ?? event.resource?.payout_batch_id;
  return batchId ? db.payout.findFirst({ where: { paypalBatchId: batchId } }) : null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let genuine = false;
  try {
    genuine = await verifyWebhook(req.headers, raw);
  } catch (e) {
    console.error('Webhook verification error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!genuine) return NextResponse.json({ ok: false }, { status: 400 });

  const event = JSON.parse(raw) as PayPalEvent;
  if (await db.webhookEvent.findUnique({ where: { id: event.id } }))
    return NextResponse.json({ ok: true, duplicate: true });

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const p = await findPayment(event);
      if (p) await settlePayment(p.id, event.resource?.id ?? null);
      break;
    }
    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.DECLINED': {
      const p = await findPayment(event);
      if (p) await failPayment(p.id);
      break;
    }
    case 'PAYMENT.PAYOUTSBATCH.SUCCESS': {
      const p = await findPayout(event);
      if (p) await finalizePayout(p.id);
      break;
    }
    case 'PAYMENT.PAYOUTSBATCH.DENIED': {
      const p = await findPayout(event);
      if (p) await failPayout(p.id);
      break;
    }
    case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED': {
      const p = await findPayout(event);
      if (p) await finalizePayout(p.id);
      break;
    }
    case 'PAYMENT.PAYOUTS-ITEM.FAILED':
    case 'PAYMENT.PAYOUTS-ITEM.BLOCKED':
    case 'PAYMENT.PAYOUTS-ITEM.CANCELED': {
      const p = await findPayout(event);
      if (p) await failPayout(p.id);
      break;
    }
    default:
      break;
  }
  await db.webhookEvent.create({ data: { id: event.id } });
  return NextResponse.json({ ok: true });
}
