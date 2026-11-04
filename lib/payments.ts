// What happens when a payment succeeds or fails: payment row, score event, tier, payout preparation.
// Safe to call more than once for the same payment (the webhook and the capture route both call it).
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server';
import { applyScoreEvent, computeTier, rankFor, feeCents, pointsFor } from '@/lib/rules';
import type { Tier, Payment } from '@/types/api';

type Tx = Prisma.TransactionClient;
type ScoreType = 'on_time' | 'late' | 'failed' | 'recovered';

async function recordEvent(tx: Tx, userId: string, circleId: string, type: ScoreType) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const score = applyScoreEvent(user.score, type);
  const tier = computeTier(score);
  const completed = await tx.membership.count({ where: { userId, circle: { status: 'completed' } } });
  await tx.scoreEvent.create({ data: { userId, circleId, type, points: pointsFor(type) } });
  await tx.user.update({ where: { id: userId }, data: { score, tier, rank: rankFor(tier as Tier, completed) } });
}

// When every member has paid this cycle, prepare the payout (never released automatically)
async function preparePayoutIfFull(tx: Tx, circleId: string, cycle: number) {
  const unpaid = await tx.payment.count({ where: { circleId, cycle, status: { not: 'paid' } } });
  if (unpaid > 0) return;
  const circle = await tx.circle.findUnique({ where: { id: circleId }, include: { memberships: true } });
  const winner = circle?.memberships.find((m) => m.turnPosition === cycle);
  if (!circle || !winner) return;
  const grossCents = circle.contributionCents * circle.memberLimit;
  const fee = feeCents(grossCents);
  await tx.payout.upsert({
    where: { circleId_cycle: { circleId, cycle } },
    create: {
      circleId, cycle, winnerId: winner.userId, grossCents, feeCents: fee, netCents: grossCents - fee,
      status: 'prepared', idempotencyKey: `payout-${circleId}-${cycle}`,
    },
    update: {},
  });
}

export async function settlePayment(paymentId: string, captureId: string | null) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === 'paid') return p; // already settled: do nothing
    const now = new Date();
    if (p.status === 'late') {
      await recordEvent(tx, p.userId, p.circleId, 'recovered');
    } else if (now > p.dueAt) {
      await recordEvent(tx, p.userId, p.circleId, 'late');
      await recordEvent(tx, p.userId, p.circleId, 'recovered');
    } else {
      await recordEvent(tx, p.userId, p.circleId, 'on_time');
    }
    const updated = await tx.payment.update({
      where: { id: p.id }, data: { status: 'paid', paidAt: now, paypalCaptureId: captureId },
    });
    await preparePayoutIfFull(tx, p.circleId, p.cycle);
    return updated;
  });
}

export async function failPayment(paymentId: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === 'paid' || p.status === 'failed') return p;
    await recordEvent(tx, p.userId, p.circleId, 'failed');
    return tx.payment.update({ where: { id: p.id }, data: { status: 'failed' } });
  });
}

export const toPayment = (p: {
  id: string; circleId: string; cycle: number; userId: string; amountCents: number;
  status: string; paidAt: Date | null;
}): Payment => ({
  id: p.id, circleId: p.circleId, cycle: p.cycle, userId: p.userId, amountCents: p.amountCents,
  status: p.status as Payment['status'], paidAt: p.paidAt ? p.paidAt.toISOString() : null,
});
