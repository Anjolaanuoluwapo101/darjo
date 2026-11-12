// Demo activity simulator for the hosted app. It settles a share of due
// contributions, releases completed-cycle payouts and lets the normal payout
// code start the next cycle or complete the circle. Nothing here talks to
// PayPal: the money movement is simulated so the product looks alive.
import { db } from '@/lib/server';
import { settlePayment } from '@/lib/payments';
import { ensurePayoutPrepared } from '@/lib/payments';
import { finalizePayout } from '@/lib/payouts';
import { notifyPaymentSettled, notifyPayoutFinalized } from '@/lib/notification-events';

export type SimulationResult = {
  circles: number;
  settled: number;
  payoutsReleased: number;
  notificationIds: string[];
};

const SETTLE_CHANCE = 0.85;

export async function simulateActivity(now = new Date()): Promise<SimulationResult> {
  const result: SimulationResult = {
    circles: 0,
    settled: 0,
    payoutsReleased: 0,
    notificationIds: [],
  };

  const circles = await db.circle.findMany({
    where: { status: 'active' },
    select: { id: true, currentCycle: true },
    orderBy: { cycleStartedAt: 'asc' },
    take: 100,
  });

  for (const circle of circles) {
    result.circles++;

    const due = await db.payment.findMany({
      where: {
        circleId: circle.id,
        cycle: circle.currentCycle,
        status: { in: ['pending', 'late'] },
        dueAt: { lte: now },
      },
      select: { id: true },
    });

    for (const payment of due) {
      if (Math.random() > SETTLE_CHANCE) continue;
      const settled = await settlePayment(payment.id, `SIM-${payment.id}`);
      if (settled?.status === 'paid') {
        result.settled++;
        result.notificationIds.push(...(await notifyPaymentSettled(payment.id)));
      }
    }

    let payout = await ensurePayoutPrepared(circle.id, circle.currentCycle);
    if (!payout || payout.status !== 'prepared') continue;

    const claimed = await db.payout.updateMany({
      where: { id: payout.id, status: 'prepared' },
      data: { status: 'released', paypalBatchId: `SIM-BATCH-${circle.id}-${circle.currentCycle}` },
    });
    if (claimed.count === 0) continue;

    await finalizePayout(payout.id);
    payout = await db.payout.findUnique({ where: { id: payout.id } });
    if (payout?.status === 'paid') {
      result.payoutsReleased++;
      result.notificationIds.push(...(await notifyPayoutFinalized(payout.id)));
    }
  }

  return result;
}
