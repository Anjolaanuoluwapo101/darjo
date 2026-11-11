// POST /api/match -> deterministic filtering + scoring for the Intelligent Matching tab.
import { NextRequest } from 'next/server';
import { db, fail, ok, requireUser, circleInclude, toSummary } from '@/lib/server';
import { joinCheck } from '@/lib/rules';
import { MIN_CONTRIBUTION_CENTS, MIN_MEMBERS } from '@/lib/rules/constants';
import { scoreCircle } from '@/lib/matching';
import type { MatchPreferences } from '@/lib/matching';
import type { MatchCandidate, MatchSuggestion, Tier } from '@/types/api';

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as {
    contributionCents?: unknown;
    frequency?: unknown;
    risk?: unknown;
  };
  const contributionCents = Number(body.contributionCents);
  const prefs: MatchPreferences = {
    ...(Number.isFinite(contributionCents) && contributionCents >= MIN_CONTRIBUTION_CENTS
      ? { contributionCents: Math.round(contributionCents) }
      : {}),
    ...(body.frequency === 'weekly' || body.frequency === 'monthly'
      ? { frequency: body.frequency }
      : {}),
    ...(body.risk === 'safe' || body.risk === 'risky' ? { risk: body.risk } : {}),
  };

  const circles = await db.circle.findMany({
    where: { status: 'open', memberships: { none: { userId: me.id } } },
    include: circleInclude,
  });

  const candidates: MatchCandidate[] = [];
  for (const circle of circles) {
    const check = joinCheck(
      { tier: me.tier as Tier, nationality: me.nationality },
      {
        tier: circle.tier as Tier,
        includedNationalities: circle.includedNationalities,
        excludedNationalities: circle.excludedNationalities,
      },
      circle.memberships.length,
      circle.memberLimit,
      false,
    );
    if (!check.ok) continue;

    const summary = toSummary(circle, me);
    const scored = scoreCircle(
      {
        tier: circle.tier,
        contributionCents: circle.contributionCents,
        frequency: circle.frequency as 'weekly' | 'monthly',
        memberLimit: circle.memberLimit,
        memberCount: circle.memberships.length,
        risk: summary.risk,
        ownTier: summary.ownTier,
      },
      prefs,
    );
    candidates.push({
      circle: summary,
      inviteCode: circle.inviteCode,
      score: scored.score,
      reasons: scored.reasons,
      seatsLeft: Math.max(circle.memberLimit - circle.memberships.length, 0),
      joinPath: `/join?code=${encodeURIComponent(circle.inviteCode)}`,
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.circle.name.localeCompare(b.circle.name));
  const top = candidates.slice(0, 6);

  const summary =
    top.length === 0
      ? 'No open circle fits your filters right now. You can create one that matches what you want.'
      : top.length === 1
        ? `${top[0].circle.name} is the best fit for you right now.`
        : `${top[0].circle.name} is the best fit, followed by ${top[1].circle.name}.`;

  let createSuggestion: MatchSuggestion | null = null;
  if (top.length === 0) {
    const contribution = prefs.contributionCents ?? 10_000;
    const frequency = prefs.frequency ?? 'monthly';
    createSuggestion = {
      name: `My ${frequency} circle`,
      contributionCents: contribution,
      frequency,
      memberLimit: Math.max(MIN_MEMBERS, 4),
      reason: 'No open circle fits yet. Create one and invite people you trust.',
    };
  }

  return ok({ candidates: top, summary, createSuggestion });
}
