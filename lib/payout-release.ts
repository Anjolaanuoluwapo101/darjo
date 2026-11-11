// Shared payout release used by the circle payout card and the /payouts hub.
import { db } from '@/lib/server';
import { PayPalError } from '@/lib/paypal';
import { sendPayout, getBatchStatus } from '@/lib/paypal/payouts';
import { finalizePayout, failPayout, toPayoutApi } from '@/lib/payouts';
import { notifyPayoutFinalized, notifyPayoutFailed } from '@/lib/notification-events';
import { isPaypalSupported } from '@/lib/rules/countries';
import type { Payout } from '@/types/api';

type User = {
  id: string;
  email: string;
  currency: string;
  nationality: string;
};

type Failure = {
  ok: false;
  code: string;
  message: string;
  status: number;
};

type Success = {
  ok: true;
  payout: Payout;
  notificationIds: string[];
};

export async function releasePayout(
  payoutId: string,
  me: User,
): Promise<Success | Failure> {
  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: { circle: true },
  });
  if (!payout) return { ok: false, code: 'NOT_FOUND', message: 'Payout not found.', status: 404 };
  if (payout.circle.status !== 'active')
    return { ok: false, code: 'POT_NOT_FULL', message: 'Not everyone has paid yet.', status: 409 };
  if (payout.winnerId !== me.id)
    return {
      ok: false,
      code: 'NOT_YOUR_TURN',
      message: "Only this cycle's winner can release the payout.",
      status: 403,
    };
  if (!isPaypalSupported(me.nationality))
    return {
      ok: false,
      code: 'COUNTRY_NOT_SUPPORTED',
      message: 'PayPal cannot send a payout to your country yet.',
      status: 403,
    };
  if (payout.status === 'released' || payout.status === 'paid')
    return {
      ok: false,
      code: 'PAYOUT_ALREADY_RELEASED',
      message: 'The payout was already sent.',
      status: 409,
    };
  if (payout.status !== 'prepared' && payout.status !== 'failed')
    return {
      ok: false,
      code: 'PAYOUT_NOT_READY',
      message: 'This payout is not ready to release.',
      status: 409,
    };

  const claim = await db.payout.updateMany({
    where: { id: payout.id, status: { in: ['prepared', 'failed'] } },
    data: { status: 'released' },
  });
  if (claim.count === 0)
    return {
      ok: false,
      code: 'PAYOUT_ALREADY_RELEASED',
      message: 'The payout was already sent.',
      status: 409,
    };

  const notificationIds: string[] = [];
  try {
    const batchId = await sendPayout({
      key: payout.idempotencyKey,
      receiverEmail: me.email,
      amountCents: payout.netCents,
      note: `D'arjo payout - ${payout.circle.name}, cycle ${payout.cycle}`,
    });
    await db.payout.update({ where: { id: payout.id }, data: { paypalBatchId: batchId } });

    const status = await getBatchStatus(batchId);
    if (status === 'SUCCESS') {
      await finalizePayout(payout.id);
      notificationIds.push(...(await notifyPayoutFinalized(payout.id)));
    } else if (status === 'DENIED' || status === 'CANCELED') {
      await failPayout(payout.id);
      notificationIds.push(...(await notifyPayoutFailed(payout.id)));
    }
  } catch (e) {
    await db.payout.updateMany({
      where: { id: payout.id, paypalBatchId: null },
      data: { status: 'prepared' },
    });
    if (e instanceof PayPalError) {
      console.error('PayPal payout error', e.status, JSON.stringify(e.body));
      return {
        ok: false,
        code: 'PAYPAL_ERROR',
        message: 'PayPal could not send the payout. Please try again.',
        status: 502,
      };
    }
    throw e;
  }

  const fresh = await db.payout.findUnique({ where: { id: payout.id } });
  return {
    ok: true,
    payout: toPayoutApi(fresh ?? payout, { currency: me.currency, nationality: me.nationality }),
    notificationIds,
  };
}
