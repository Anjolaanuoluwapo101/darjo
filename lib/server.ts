// Server-only helpers: database, session cookie, response helpers, DB -> API mappers.
// Only Anjola edits this file. Never import it from a screen.
import { PrismaClient } from '@prisma/client';
import type { Prisma, User as UserRow } from '@prisma/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import type {
  User, Tier, Member, Payout, CircleSummary, CircleDetail,
} from '@/types/api';
import { computeRisk } from '@/lib/rules';
import { currencyFor } from '@/lib/rules/countries';
import { estimateLocalAmount, volatilityLabel } from '@/lib/fx';

// ---------- database ----------
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = db;

// ---------- responses ----------
export const ok = <T>(data: T) => NextResponse.json({ ok: true, data });
export const fail = (code: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error: { code, message } }, { status });

// ---------- session (signed cookie) ----------
const COOKIE = 'darjo_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

export async function setSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7,
  });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
export async function requireUser(): Promise<UserRow | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? db.user.findUnique({ where: { id: payload.sub } }) : null;
  } catch {
    return null;
  }
}

// ---------- country and currency helpers ----------
export { currencyFor, volatilityLabel };

// ---------- mappers: database rows -> API shapes ----------
export const circleInclude = {
  memberships: { include: { user: true }, orderBy: { turnPosition: 'asc' } },
} satisfies Prisma.CircleInclude;
export type CircleRow = Prisma.CircleGetPayload<{ include: typeof circleInclude }>;

export const toUser = (u: UserRow): User => ({
  id: u.id, name: u.name, email: u.email, nationality: u.nationality, currency: u.currency,
  tier: u.tier as Tier, rank: u.rank, score: u.score,
});

export function toSummary(c: CircleRow, viewer: UserRow): CircleSummary {
  const { risk, reason } = computeRisk(
    volatilityLabel(viewer.currency),
    c.memberships.map((m) => volatilityLabel(m.user.currency)),
  );
  return {
    id: c.id, name: c.name, tier: c.tier as Tier, contributionCents: c.contributionCents,
    frequency: c.frequency as 'weekly' | 'monthly',
    memberLimit: c.memberLimit, memberCount: c.memberships.length,
    status: c.status as CircleSummary['status'],
    creatorName: c.memberships.find((m) => m.userId === c.creatorId)?.user.name ?? '',
    nationalitiesInCircle: Array.from(new Set(c.memberships.map((m) => m.user.nationality))),
    risk, riskReason: reason, ownTier: c.tier === viewer.tier,
  };
}

export const toPayout = (p: {
  id: string; circleId: string; cycle: number; winnerId: string;
  grossCents: number; feeCents: number; netCents: number; status: string;
}): Payout => ({ ...p, status: p.status as Payout['status'] });
export async function toDetail(c: CircleRow, viewer: UserRow): Promise<CircleDetail> {
  const [payments, payoutRow] = await Promise.all([
    db.payment.findMany({ where: { circleId: c.id, cycle: c.currentCycle } }),
    db.payout.findUnique({ where: { circleId_cycle: { circleId: c.id, cycle: c.currentCycle } } }),
  ]);
  const byUser = new Map(payments.map((p) => [p.userId, p]));
  const members: Member[] = c.memberships.map((m) => {
    const status = byUser.get(m.userId)?.status;
    return {
      userId: m.userId, name: m.user.name, nationality: m.user.nationality,
      currency: m.user.currency,
      tier: m.user.tier as Tier, rank: m.user.rank, turnPosition: m.turnPosition,
      currentCycleStatus: status === 'failed' ? 'failed' : status === 'paid' ? 'paid' : status === 'late' ? 'late' : 'pending',
    };
  });
  const winner = c.status === 'active'
    ? c.memberships.find((m) => m.turnPosition === c.currentCycle) : undefined;
  const payout = payoutRow ? toPayout(payoutRow) : null;
  if (payout) {
    // Show the winner roughly what the pot is worth in their own currency.
    const winnerMember = c.memberships.find((m) => m.userId === payoutRow!.winnerId);
    const estimate = winnerMember
      ? estimateLocalAmount(payout.netCents, winnerMember.user.currency, winnerMember.user.nationality)
      : null;
    if (estimate) {
      payout.localCurrency = estimate.currency;
      payout.localAmount = estimate.amount;
      payout.localFormatted = estimate.formatted;
    }
  }
  return {
    ...toSummary(c, viewer),
    inviteCode: c.inviteCode,
    includedNationalities: c.includedNationalities,
    excludedNationalities: c.excludedNationalities,
    currentCycle: c.currentCycle, totalCycles: c.memberLimit,
    potCents: c.contributionCents * c.memberLimit,
    paidThisCycleCents: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amountCents, 0),
    members,
    currentWinnerId: winner?.userId ?? null,
    payout,
    viewerPaidThisCycle: byUser.get(viewer.id)?.status === 'paid',
    viewerIsCurrentWinner: winner?.userId === viewer.id,
  };
}

export async function loadCircle(where: { id: string } | { inviteCode: string }) {
  return db.circle.findUnique({ where, include: circleInclude });
}
