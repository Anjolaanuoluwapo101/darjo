// POST /api/dev/mark-late -> demo helper. Off unless DEMO_TOOLS=true.
// Marks one member's contribution as late so the video does not have to wait for a real due date.
import { NextRequest, after } from 'next/server';
import { db, ok, fail, requireUser } from '@/lib/server';
import { markLate, toPayment } from '@/lib/payments';
import { notifyPaymentLate } from '@/lib/notification-events';
import { dispatchPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  if (process.env.DEMO_TOOLS !== 'true') return fail('NOT_FOUND', 'Unknown endpoint.', 404);
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as { circleId?: unknown; userId?: unknown };
  const circleId = typeof body.circleId === 'string' ? body.circleId.trim() : '';
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!circleId || !userId) return fail('VALIDATION', 'Send circleId and userId.');

  const circle = await db.circle.findUnique({ where: { id: circleId } });
  if (!circle) return fail('NOT_FOUND', 'Circle not found.', 404);
  const member = await db.membership.findFirst({ where: { circleId, userId } });
  if (!member) return fail('NOT_FOUND', 'That person is not in this circle.', 404);

  const payment = await db.payment.findUnique({
    where: { circleId_cycle_userId: { circleId, cycle: circle.currentCycle, userId } },
  });
  if (!payment) return fail('NOT_FOUND', 'That person has no contribution in this cycle.', 404);

  const updated = await markLate(payment.id, true);
  const notificationIds = await notifyPaymentLate(payment.id);
  after(() => dispatchPush(notificationIds));
  return ok({ payment: toPayment(updated ?? payment) });
}
