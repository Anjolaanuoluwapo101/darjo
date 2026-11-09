// What happens after PayPal confirms (or rejects) a payout. Safe to call more than once.
import { db } from '@/lib/server';
import { rankFor } from '@/lib/rules';
import { estimateLocalAmount } from '@/lib/fx';
import type { Tier, Payout } from '@/types/api';

export const toPayoutApi = (p: {
  id: string; circleId: string; cycle: number; winnerId: string;
  grossCents: number; feeCents: number; netCents: number; status: string;
}, winner?: { currency: string; nationality: string }): Payout => {
  const payout: Payout = {
    id: p.id, circleId: p.circleId, cycle: p.cycle, winnerId: p.winnerId,
    grossCents: p.grossCents, feeCents: p.feeCents, netCents: p.netCents,
    status: p.status as Payout['status'],
  };
  if (winner) {
    const estimate = estimateLocalAmount(payout.netCents, winner.currency, winner.nationality);
    if (estimate) {
      payout.localCurrency = estimate.currency;
      payout.localAmount = estimate.amount;
      payout.localFormatted = estimate.formatted;
    }
  }
  return payout;
};

// Payout reached the winner: mark paid, then start the next cycle (or finish the circle)
export async function finalizePayout(payoutId: string) {
  await db.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status === 'paid') return;
    await tx.payout.update({ where: { id: payout.id }, data: { status: 'paid' } });

    const circle = await tx.circle.findUnique({
      where: { id: payout.circleId }, include: { memberships: true },
    });
    if (!circle || circle.currentCycle !== payout.cycle) return; // already moved on

    const now = new Date();
    const next = circle.currentCycle + 1;
    if (next > circle.memberLimit) {
      await tx.circle.update({ where: { id: circle.id }, data: { status: 'completed' } });
      // Completed circles can raise the cosmetic rank of top-tier members
      for (const m of circle.memberships) {
        const user = await tx.user.findUnique({ where: { id: m.userId } });
        if (!user) continue;
        const completed = await tx.membership.count({
          where: { userId: user.id, circle: { status: 'completed' } },
        });
        await tx.user.update({
          where: { id: user.id }, data: { rank: rankFor(user.tier as Tier, completed) },
        });
      }
      return;
    }
    const dueAt = new Date(now.getTime() + (circle.frequency === 'weekly' ? 7 : 30) * 86_400_000);
    await tx.circle.update({
      where: { id: circle.id }, data: { currentCycle: next, cycleStartedAt: now },
    });
    await tx.payment.createMany({
      data: circle.memberships.map((m) => ({
        circleId: circle.id, cycle: next, userId: m.userId, amountCents: circle.contributionCents, dueAt,
      })),
      skipDuplicates: true,
    });
  });
}

export async function failPayout(payoutId: string) {
  await db.payout.updateMany({
    where: { id: payoutId, status: { not: 'paid' } },
    data: { status: 'failed' },
  });
}
