// Pure rule functions: no database, no network. Easy to test.
import type { Tier, ScoreEvent, VolatilityLabel } from '@/types/api';
import {
  FEE_RATE, SCORE_MIN, SCORE_MAX, SCORE_POINTS, TIER_MIN_SCORE, RANKS, RISKY_MEMBER_SHARE,
} from './constants';

export const feeCents = (grossCents: number) => Math.round(grossCents * FEE_RATE);
export const netCents = (grossCents: number) => grossCents - feeCents(grossCents);

export const pointsFor = (type: ScoreEvent['type']) => SCORE_POINTS[type];
export const applyScoreEvent = (score: number, type: ScoreEvent['type']) =>
  Math.min(SCORE_MAX, Math.max(SCORE_MIN, score + pointsFor(type)));

export function computeTier(score: number): Tier {
  if (score >= TIER_MIN_SCORE[4]) return 4;
  if (score >= TIER_MIN_SCORE[3]) return 3;
  if (score >= TIER_MIN_SCORE[2]) return 2;
  return 1;
}

export function rankFor(tier: Tier, completedCircles: number): string | null {
  if (tier < 4) return null;
  return RANKS.find((r) => completedCircles >= r.minCompleted)?.name ?? null;
}

interface Viewer { tier: Tier; nationality: string }
interface CircleRules {
  tier: Tier; includedNationalities: string[]; excludedNationalities: string[];
}

export function nationalityAllowed(nationality: string, c: CircleRules) {
  if (c.excludedNationalities.includes(nationality)) return false;
  if (c.includedNationalities.length > 0 && !c.includedNationalities.includes(nationality)) return false;
  return true;
}

// Circle Studio visibility: own tier or lower, and nationality not excluded
export const canSeeCircle = (u: Viewer, c: CircleRules) =>
  c.tier <= u.tier && nationalityAllowed(u.nationality, c);

export type JoinError = 'TIER_TOO_LOW' | 'NATIONALITY_EXCLUDED' | 'CIRCLE_FULL' | 'ALREADY_MEMBER';
export function joinCheck(
  u: Viewer, c: CircleRules, memberCount: number, memberLimit: number, alreadyMember: boolean,
): { ok: true } | { ok: false; code: JoinError } {
  if (alreadyMember) return { ok: false, code: 'ALREADY_MEMBER' };
  if (c.tier > u.tier) return { ok: false, code: 'TIER_TOO_LOW' };
  if (!nationalityAllowed(u.nationality, c)) return { ok: false, code: 'NATIONALITY_EXCLUDED' };
  if (memberCount >= memberLimit) return { ok: false, code: 'CIRCLE_FULL' };
  return { ok: true };
}

// Sort: own tier first, then lower tiers (highest first)
export const sortForStudio = <T extends { tier: Tier }>(circles: T[], viewerTier: Tier) =>
  [...circles].sort((a, b) => {
    const aOwn = a.tier === viewerTier ? 0 : 1;
    const bOwn = b.tier === viewerTier ? 0 : 1;
    return aOwn - bOwn || b.tier - a.tier;
  });

// Version 1 safe/risky rule
export function computeRisk(
  viewerVolatility: VolatilityLabel, memberVolatilities: VolatilityLabel[],
): { risk: 'safe' | 'risky'; reason: string } {
  if (viewerVolatility === 'high')
    return { risk: 'risky', reason: 'Your currency has swung a lot against USD, so each payment can cost you more.' };
  const high = memberVolatilities.filter((v) => v === 'high').length;
  if (memberVolatilities.length > 0 && high / memberVolatilities.length >= RISKY_MEMBER_SHARE)
    return { risk: 'risky', reason: 'Many members use currencies that swing a lot against USD.' };
  return { risk: 'safe', reason: "Members' currencies have been steady against USD." };
}
