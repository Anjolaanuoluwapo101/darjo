// POST /api/payouts/:id/release -> release one payout from the hub.
import { NextRequest, after } from 'next/server';
import { fail, ok, requireUser } from '@/lib/server';
import { releasePayout } from '@/lib/payout-release';
import { dispatchPush } from '@/lib/push';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const { id } = await ctx.params;
  const result = await releasePayout(id, me);
  if (!result.ok) return fail(result.code, result.message, result.status);
  after(() => dispatchPush(result.notificationIds));
  return ok({ payout: result.payout });
}
