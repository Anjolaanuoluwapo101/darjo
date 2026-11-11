// POST /api/circles/:id/pay          -> create a PayPal order for my contribution this cycle
// POST /api/circles/:id/pay/capture  -> capture the approved order and settle the payment
import { NextRequest, after } from 'next/server';
import { db, ok, fail, requireUser } from '@/lib/server';
import { createOrder, captureOrder, PayPalError } from '@/lib/paypal';
import { settlePayment, toPayment } from '@/lib/payments';
import { notifyPaymentSettled } from '@/lib/notification-events';
import { dispatchPush } from '@/lib/push';
import { isPaypalSupported } from '@/lib/rules/countries';

type Ctx = { params: Promise<{ id: string; step?: string[] }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: circleId, step } = await ctx.params;
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);
  if (!isPaypalSupported(me.nationality))
    return fail('COUNTRY_NOT_SUPPORTED', 'PayPal cannot be used from your country yet.', 403);

  const circle = await db.circle.findUnique({ where: { id: circleId } });
  if (!circle) return fail('NOT_FOUND', 'Circle not found.', 404);
  const payment = await db.payment.findUnique({
    where: { circleId_cycle_userId: { circleId, cycle: circle.currentCycle, userId: me.id } },
  });
  if (circle.status !== 'active' || !payment)
    return fail('VALIDATION', 'There is no payment due in this circle right now.');

  try {
    // ----- start a payment -----
    if (!step || step.length === 0) {
      if (payment.status === 'paid') return fail('VALIDATION', 'You have already paid this cycle.');
      const orderId = await createOrder({
        amountCents: payment.amountCents,
        customId: `${circleId}:${circle.currentCycle}:${me.id}`,
        description: `D'arjo ${circle.name} - cycle ${circle.currentCycle}`,
        requestId: `order-${payment.id}-${Date.now()}`,
      });
      await db.payment.update({ where: { id: payment.id }, data: { paypalOrderId: orderId } });
      return ok({ orderId, amountCents: payment.amountCents, currency: 'USD' as const });
    }

    // ----- capture after the buyer approved -----
    if (step[0] === 'capture' && step.length === 1) {
      const body = ((await req.json().catch(() => null)) ?? {}) as { orderId?: unknown };
      const orderId = typeof body.orderId === 'string' ? body.orderId : '';
      if (!orderId || orderId !== payment.paypalOrderId)
        return fail('VALIDATION', 'That order does not match your payment.');
      if (payment.status === 'paid') return ok({ payment: toPayment(payment) });
      const result = await captureOrder(orderId);
      if (result.status === 'COMPLETED') {
        const settled = await settlePayment(payment.id, result.captureId);
        const notificationIds = await notifyPaymentSettled(payment.id);
        after(() => dispatchPush(notificationIds));
        return ok({ payment: toPayment(settled ?? payment) });
      }
      // Not completed yet (for example pending review): the webhook will settle it later
      return ok({ payment: toPayment(payment) });
    }
    return fail('NOT_FOUND', 'Unknown endpoint.', 404);
  } catch (e) {
    if (e instanceof PayPalError) {
      console.error('PayPal error', e.status, JSON.stringify(e.body));
      return fail('PAYPAL_ERROR', 'PayPal had a problem. Please try again.', 502);
    }
    throw e;
  }
}
