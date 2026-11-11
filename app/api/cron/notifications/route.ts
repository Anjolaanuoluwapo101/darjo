// GET /api/cron/notifications -> daily Vercel cron.
// Marks past-due contributions late and retries pending push deliveries.
import { NextRequest, after } from 'next/server';
import { db, fail, ok } from '@/lib/server';
import { markLate } from '@/lib/payments';
import { notifyPaymentLate } from '@/lib/notification-events';
import { dispatchPendingPush, dispatchPush } from '@/lib/push';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`)
    return fail('UNAUTHORIZED', 'Cron secret is missing or invalid.', 401);

  const due = await db.payment.findMany({
    where: { status: 'pending', dueAt: { lt: new Date() } },
    select: { id: true },
    take: 500,
  });

  const notificationIds: string[] = [];
  for (const payment of due) {
    const updated = await markLate(payment.id);
    if (updated?.status === 'late') {
      notificationIds.push(...(await notifyPaymentLate(payment.id)));
    }
  }

  after(() => dispatchPush(notificationIds));
  const push = await dispatchPendingPush();

  return ok({ late: notificationIds.length, push });
}
