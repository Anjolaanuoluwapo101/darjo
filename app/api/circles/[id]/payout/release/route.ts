// POST /api/circles/:id/payout/release
// Only the member whose turn it is can call this. It sends the net amount through PayPal Payouts.
import { NextRequest } from 'next/server';
import { db, ok, fail, requireUser } from '@/lib/server';
import { PayPalError } from '@/lib/paypal';
import { sendPayout, getBatchStatus } from '@/lib/paypal/payouts';
import { finalizePayout, failPayout, toPayoutApi } from '@/lib/payouts';
import { isPaypalSupported } from '@/lib/rules/countries';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id: circleId } = await ctx.params;
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const circle = await db.circle.findUnique({ where: { id: circleId } });
  if (!circle) return fail('NOT_FOUND', 'Circle not found.', 404);
  const payout = await db.payout.findUnique({
    where: { circleId_cycle: { circleId, cycle: circle.currentCycle } },
  });
  if (circle.status !== 'active' || !payout)
    return fail('POT_NOT_FULL', 'Not everyone has paid yet.', 409);
  if (payout.winnerId !== me.id)
    return fail('NOT_YOUR_TURN', 'Only this cycle\'s winner can release the payout.', 403);
  // PayPal cannot pay out to every country, so we refuse before touching money.
  if (!isPaypalSupported(me.nationality))
    return fail('COUNTRY_NOT_SUPPORTED', 'PayPal cannot send a payout to your country yet.', 403);
  if (payout.status === 'released' || payout.status === 'paid')
    return fail('PAYOUT_ALREADY_RELEASED', 'The payout was already sent.', 409);

  // Claim it first. If two taps arrive together, only one gets count 1.
  const claim = await db.payout.updateMany({
    where: { id: payout.id, status: { in: ['prepared', 'failed'] } },
    data: { status: 'released' },
  });
  if (claim.count === 0)
    return fail('PAYOUT_ALREADY_RELEASED', 'The payout was already sent.', 409);

  try {
    // For sandbox, the winner's account email must be a sandbox PERSONAL account email.
    const batchId = await sendPayout({
      key: payout.idempotencyKey, receiverEmail: me.email,
      amountCents: payout.netCents, note: `D'arjo payout - ${circle.name}, cycle ${payout.cycle}`,
    });
    await db.payout.update({ where: { id: payout.id }, data: { paypalBatchId: batchId } });

    // Check straight away so the demo works even before the webhook arrives
    const status = await getBatchStatus(batchId);
    if (status === 'SUCCESS') await finalizePayout(payout.id);
    else if (status === 'DENIED' || status === 'CANCELED') await failPayout(payout.id);
  } catch (e) {
    // Nothing was sent: put it back so the winner can try again
    await db.payout.updateMany({
      where: { id: payout.id, paypalBatchId: null }, data: { status: 'prepared' },
    });
    if (e instanceof PayPalError) {
      console.error('PayPal payout error', e.status, JSON.stringify(e.body));
      return fail('PAYPAL_ERROR', 'PayPal could not send the payout. Please try again.', 502);
    }
    throw e;
  }
  const fresh = await db.payout.findUnique({ where: { id: payout.id } });
  return ok({
    payout: toPayoutApi(fresh ?? payout, { currency: me.currency, nationality: me.nationality }),
  });
}
