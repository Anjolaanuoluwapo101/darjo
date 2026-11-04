// GET /api/me/profile -> score, tier, history and the circles of the logged-in person.
import { db, ok, fail, requireUser, toUser } from '@/lib/server';
import { TIER_MIN_SCORE, RANKS } from '@/lib/rules/constants';
import type { ProfileData, Tier } from '@/types/api';

function nextTier(tier: Tier, completed: number): ProfileData['nextTier'] {
  if (tier < 4) {
    const target = (tier + 1) as Tier;
    return {
      tier: target,
      requirement: `Reach ${TIER_MIN_SCORE[target]} points to reach Tier ${target}.`,
    };
  }
  const nextRank = RANKS.find((r) => completed < r.minCompleted);
  return {
    tier: 4,
    requirement: nextRank
      ? `You are in Tier 4. Complete ${nextRank.minCompleted} circles to reach the ${nextRank.name} rank.`
      : 'You are in Tier 4 with the highest rank. Keep paying on time.',
  };
}

export async function GET() {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const [events, memberships, completed] = await Promise.all([
    db.scoreEvent.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
    }),
    db.membership.findMany({ where: { userId: me.id }, include: { circle: true } }),
    db.membership.count({ where: { userId: me.id, circle: { status: 'completed' } } }),
  ]);

  const circleIds = Array.from(new Set(events.map((e) => e.circleId)));
  const circleRows = await db.circle.findMany({
    where: { id: { in: circleIds } },
    select: { id: true, name: true },
  });
  const circleName = new Map(circleRows.map((c) => [c.id, c.name]));

  const data: ProfileData = {
    user: toUser(me),
    nextTier: nextTier(me.tier as Tier, completed),
    events: events.map((e) => ({
      id: e.id,
      type: e.type as ProfileData['events'][number]['type'],
      circleName: circleName.get(e.circleId) ?? 'Circle',
      points: e.points,
      createdAt: e.createdAt.toISOString(),
    })),
    circles: memberships.map((m) => ({
      id: m.circle.id,
      name: m.circle.name,
      status: m.circle.status as ProfileData['circles'][number]['status'],
    })),
  };
  return ok(data);
}
