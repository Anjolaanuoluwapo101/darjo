// GET /api/payouts -> the multi-circle payout hub.
// Ready payouts come first; history is read-only and covers every circle the viewer belongs to.
import { db, fail, ok, requireUser } from '@/lib/server';
import { toPayoutApi } from '@/lib/payouts';
import { isPaypalSupported } from '@/lib/rules/countries';
import type { PayoutHubItem } from '@/types/api';

export async function GET() {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const memberships = await db.membership.findMany({
    where: { userId: me.id },
    select: { circleId: true },
  });
  const circleIds = memberships.map((m) => m.circleId);
  if (circleIds.length === 0) {
    return ok({ ready: [], history: [], totals: { readyNetCents: 0, paidNetCents: 0 } });
  }

  const rows = await db.payout.findMany({
    where: { circleId: { in: circleIds } },
    include: { circle: true },
    orderBy: [{ cycle: 'desc' }],
  });
  const winnerIds = Array.from(new Set(rows.map((row) => row.winnerId)));
  const winners = await db.user.findMany({
    where: { id: { in: winnerIds } },
    select: { id: true, name: true, currency: true, nationality: true },
  });
  const winnerById = new Map(winners.map((winner) => [winner.id, winner]));

  const toItem = (row: (typeof rows)[number]): PayoutHubItem => {
    const winner = winnerById.get(row.winnerId);
    const viewerRole = row.winnerId === me.id ? 'winner' : 'member';
    let canRelease =
      viewerRole === 'winner' &&
      row.status === 'prepared' &&
      row.circle.status === 'active' &&
      isPaypalSupported(me.nationality);
    if (!isPaypalSupported(me.nationality)) canRelease = false;

    let releaseBlockedReason: string | undefined;
    if (viewerRole !== 'winner') releaseBlockedReason = 'Only the winner can release this payout.';
    else if (row.status === 'released') releaseBlockedReason = 'Waiting for payment confirmation.';
    else if (row.status !== 'prepared') releaseBlockedReason = 'This payout is not ready to release.';
    else if (!isPaypalSupported(me.nationality))
      releaseBlockedReason = 'Payouts are not available in your country yet.';

    return {
      ...toPayoutApi(
        row,
        winner ? { currency: winner.currency, nationality: winner.nationality } : undefined,
      ),
      circleName: row.circle.name,
      winnerName: winner?.name ?? '',
      viewerRole,
      canRelease,
      ...(releaseBlockedReason ? { releaseBlockedReason } : {}),
    };
  };

  const ready = rows
    .filter((row) => row.status === 'prepared' && row.winnerId === me.id)
    .map(toItem)
    .sort(
      (a, b) =>
        Number(b.canRelease) - Number(a.canRelease) ||
        Number(b.status === 'prepared') - Number(a.status === 'prepared') ||
        b.cycle - a.cycle,
    );
  const history = rows
    .filter(
      (row) =>
        (row.status === 'paid' || row.status === 'failed' || row.status === 'released') &&
        row.winnerId === me.id,
    )
    .map(toItem);

  const readyNetCents = ready.reduce((sum, item) => sum + item.netCents, 0);
  const paidNetCents = history
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.netCents, 0);

  return ok({ ready, history, totals: { readyNetCents, paidNetCents } });
}
