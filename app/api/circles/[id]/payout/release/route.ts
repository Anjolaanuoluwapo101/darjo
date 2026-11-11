// POST /api/circles/:id/payout/release
// Only the member whose turn it is can call this. It sends the net amount through PayPal Payouts.
import { NextRequest, after } from 'next/server';
import { db, ok, fail, requireUser } from '@/lib/server';
import { releasePayout } from '@/lib/payout-release';
import { dispatchPush } from '@/lib/push';

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

  const result = await releasePayout(payout.id, me);
  if (!result.ok) return fail(result.code, result.message, result.status);
  after(() => dispatchPush(result.notificationIds));
  return ok({ payout: result.payout });
}
