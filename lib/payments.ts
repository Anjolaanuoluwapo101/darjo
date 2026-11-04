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
  if (unpaid > 0) return null;
  return preparePayout(tx, circleId, cycle);
}

// Create the payout row for a cycle if the pot is full. Idempotent.
async function preparePayout(tx: Tx, circleId: string, cycle: number) {
  const circle = await tx.circle.findUnique({ where: { id: circleId }, include: { memberships: true } });
  const winner = circle?.memberships.find((m) => m.turnPosition === cycle);
  if (!circle || !winner) return null;
  const grossCents = circle.contributionCents * circle.memberLimit;
  const fee = feeCents(grossCents);
  const payout = await tx.payout.upsert({
    where: { circleId_cycle: { circleId, cycle } },
    create: {
      circleId, cycle, winnerId: winner.userId, grossCents, feeCents: fee, netCents: grossCents - fee,
      status: 'prepared', idempotencyKey: `payout-${circleId}-${cycle}`,
    },
    update: {},
  });
  return payout;
}

// Public helper: make sure the payout for the current cycle exists and is prepared.
// Used by the assistant (which may prepare a payout but must never release it).
export async function ensurePayoutPrepared(circleId: string, cycle?: number) {
  return db.$transaction(async (tx) => {
    const circle = await tx.circle.findUnique({ where: { id: circleId } });
    if (!circle) return null;
    const target = cycle ?? circle.currentCycle;
    const unpaid = await tx.payment.count({
      where: { circleId, cycle: target, status: { not: 'paid' } },
    });
    if (unpaid > 0) return null;
    return preparePayout(tx, circleId, target);
  });
}

// Mark one contribution as late. The status change happens once, so the score event is created once.
// force=true marks it late even before the due date (demo helper only).
export async function markLate(paymentId: string, force = false) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status !== 'pending') return p;
    if (!force && p.dueAt.getTime() > Date.now()) return p;
    const changed = await tx.payment.updateMany({
      where: { id: p.id, status: 'pending' },
      data: { status: 'late' },
    });
    if (changed.count === 0) return p; // someone else got there first
    await recordEvent(tx, p.userId, p.circleId, 'late');
    return tx.payment.findUnique({ where: { id: p.id } });
  });
}

// Lazy late check: a contribution that was not paid by its due date is late.
// Runs when a circle is fetched. The status change happens once, so the score event is created once.
export async function markLateIfDue(circleId: string) {
  const due = await db.payment.findMany({
    where: { circleId, status: 'pending', dueAt: { lt: new Date() } },
    select: { id: true },
  });
  for (const p of due) await markLate(p.id);
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
