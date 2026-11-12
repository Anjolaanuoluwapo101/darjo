// One router for: auth (signup, login, logout), me, circles (list, create, get, join).
// More specific files (e.g. app/api/circles/[id]/pay/route.ts, app/api/webhooks/paypal/route.ts)
// win over this catch-all, so later endpoints go in their own files.
import { NextRequest, after } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import {
  db, ok, fail, setSession, clearSession, requireUser, currencyFor,
  toUser, toSummary, toDetail, loadCircle, circleInclude,
} from '@/lib/server';
import { canSeeCircle, joinCheck, nationalityAllowed, sortForStudio } from '@/lib/rules';
import { markLateIfDue } from '@/lib/payments';
import { notifyJoin } from '@/lib/notification-events';
import { dispatchPush } from '@/lib/push';
import { MIN_CONTRIBUTION_CENTS, MIN_MEMBERS, MAX_MEMBERS } from '@/lib/rules/constants';
import type { Tier } from '@/types/api';

type Ctx = { params: Promise<{ path: string[] }> };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
// Passwords are never trimmed: a leading or trailing space can be part of the
// password. Login accepts the exact password and, as a convenience, the same
// password without surrounding spaces (people often paste one with a space).
const rawStr = (v: unknown) => (typeof v === 'string' ? v : '');
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN);
const codes = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.toUpperCase()) : [];

async function makeInviteCode() {
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 10; i++) {
    const code = 'AJO-' + Array.from({ length: 4 }, () => letters[randomInt(letters.length)]).join('');
    if (!(await db.circle.findUnique({ where: { inviteCode: code } }))) return code;
  }
  throw new Error('Could not make an invite code');
}

export const GET = (req: NextRequest, ctx: Ctx) => handle('GET', req, ctx);
export const POST = (req: NextRequest, ctx: Ctx) => handle('POST', req, ctx);

async function handle(method: 'GET' | 'POST', req: NextRequest, ctx: Ctx) {
  const path = (await ctx.params).path;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const key = `${method} ${path.join('/')}`;

  // ----- auth -----
  if (key === 'POST auth/signup') {
    const name = str(body.name), email = str(body.email).toLowerCase();
    const password = rawStr(body.password), nationality = str(body.nationality).toUpperCase();
    if (!name || !email.includes('@') || password.length < 6)
      return fail('VALIDATION', 'Enter a name, a valid email and a password of at least 6 characters.');
    const currency = currencyFor(nationality);
    if (!currency) return fail('VALIDATION', 'Choose a valid nationality.');
    if (await db.user.findUnique({ where: { email } }))
      return fail('VALIDATION', 'That email is already registered.', 409);
    const user = await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 10), nationality, currency },
    });
    await setSession(user.id);
    return ok({ user: toUser(user) });
  }

  if (key === 'POST auth/login') {
    const user = await db.user.findUnique({ where: { email: str(body.email).toLowerCase() } });
    if (!user) return fail('UNAUTHENTICATED', 'Wrong email or password.', 401);
    const password = rawStr(body.password);
    const matches = await bcrypt.compare(password, user.passwordHash)
      || (password !== password.trim() && await bcrypt.compare(password.trim(), user.passwordHash));
    if (!matches) return fail('UNAUTHENTICATED', 'Wrong email or password.', 401);
    await setSession(user.id);
    return ok({ user: toUser(user) });
  }

  if (key === 'POST auth/logout') {
    // Unsubscribe push notifications for this user (best-effort; never block logout).
    const current = await requireUser();
    if (current) {
      await db.pushSubscription.deleteMany({ where: { userId: current.id } }).catch(() => {});
    }
    await clearSession();
    return ok({});
  }

  // ----- everything below needs a logged-in user -----
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  if (key === 'GET me') return ok({ user: toUser(me) });

  // ----- circles -----
  if (key === 'GET circles') {
    const mine = req.nextUrl.searchParams.get('mine') === '1';
    // "My circles" for the assistant: every circle the viewer belongs to, in any
    // status. The studio listing below only shows open circles the viewer has not joined.
    if (mine) {
      const rows = await db.circle.findMany({
        where: { memberships: { some: { userId: me.id } } },
        include: circleInclude,
      });
      const payments = await db.payment.findMany({
        where: { userId: me.id, circleId: { in: rows.map((r) => r.id) } },
        select: { circleId: true, cycle: true, status: true },
      });
      const payByCycle = new Map<string, string>(
        payments.map((p) => [`${p.circleId}:${p.cycle}`, p.status]),
      );
      const order = { active: 0, open: 1, completed: 2 } as const;
      const circles = rows
        .map((circle) => ({
          ...toSummary(circle, me),
          viewerPaymentStatus: (payByCycle.get(`${circle.id}:${circle.currentCycle}`) ?? null) as
            | 'paid'
            | 'pending'
            | 'late'
            | 'failed'
            | null,
        }))
        .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
      return ok({ circles });
    }
    const risk = req.nextUrl.searchParams.get('risk');
    const rows = await db.circle.findMany({
      where: { status: 'open', tier: { lte: me.tier }, memberships: { none: { userId: me.id } } },
      include: circleInclude,
    });
    const visible = rows.filter((c) => canSeeCircle(
      { tier: me.tier as Tier, nationality: me.nationality },
      { tier: c.tier as Tier, includedNationalities: c.includedNationalities, excludedNationalities: c.excludedNationalities },
    ));
    let circles = sortForStudio(visible.map((c) => toSummary(c, me)), me.tier as Tier);
    if (risk === 'safe' || risk === 'risky') circles = circles.filter((c) => c.risk === risk);
    return ok({ circles });
  }

  if (key === 'POST circles') {
    const name = str(body.name);
    const contributionCents = int(body.contributionCents);
    const memberLimit = int(body.memberLimit);
    const frequency = body.frequency;
    const included = codes(body.includedNationalities), excluded = codes(body.excludedNationalities);
    if (!name || name.length > 60) return fail('VALIDATION', 'Give the circle a name (up to 60 characters).');
    if (!(contributionCents >= MIN_CONTRIBUTION_CENTS))
      return fail('VALIDATION', 'The contribution must be at least $1.00.');
    if (!(memberLimit >= MIN_MEMBERS && memberLimit <= MAX_MEMBERS))
      return fail('VALIDATION', `A circle needs ${MIN_MEMBERS} to ${MAX_MEMBERS} members.`);
    if (frequency !== 'weekly' && frequency !== 'monthly')
      return fail('VALIDATION', 'Choose weekly or monthly.');
    if (included.some((c) => excluded.includes(c)))
      return fail('VALIDATION', 'A nationality cannot be both included and excluded.');
    if (!nationalityAllowed(me.nationality, { tier: me.tier as Tier, includedNationalities: included, excludedNationalities: excluded }))
      return fail('VALIDATION', 'Your own nationality cannot be excluded from your circle.');
    const created = await db.circle.create({
      data: {
        name, creatorId: me.id, tier: me.tier, contributionCents, frequency, memberLimit,
        inviteCode: await makeInviteCode(),
        includedNationalities: included, excludedNationalities: excluded,
        memberships: { create: { userId: me.id, turnPosition: 1 } },
      },
      include: circleInclude,
    });
    return ok({ circle: await toDetail(created, me) });
  }

  if (key === 'POST circles/join') {
    const inviteCode = str(body.inviteCode).toUpperCase(), circleId = str(body.circleId);
    if (!inviteCode && !circleId) return fail('VALIDATION', 'Enter an invite code.');
    const circle = await loadCircle(inviteCode ? { inviteCode } : { id: circleId });
    if (!circle) return fail('NOT_FOUND', 'No circle found.', 404);
    const check = joinCheck(
      { tier: me.tier as Tier, nationality: me.nationality },
      { tier: circle.tier as Tier, includedNationalities: circle.includedNationalities, excludedNationalities: circle.excludedNationalities },
      circle.memberships.length, circle.memberLimit,
      circle.memberships.some((m) => m.userId === me.id),
    );
    if (!check.ok) return fail(check.code, 'You cannot join this circle.', 403);
    if (circle.status !== 'open') return fail('CIRCLE_FULL', 'This circle is full.', 403);

    const newCount = circle.memberships.length + 1;
    await db.$transaction(async (tx) => {
      await tx.membership.create({ data: { circleId: circle.id, userId: me.id, turnPosition: newCount } });
      if (newCount === circle.memberLimit) {
        // Last seat taken: activate the circle and create cycle 1 payment rows
        const now = new Date();
        const dueAt = new Date(now.getTime() + (circle.frequency === 'weekly' ? 7 : 30) * 86_400_000);
        await tx.circle.update({ where: { id: circle.id }, data: { status: 'active', cycleStartedAt: now } });
        const everyone = [...circle.memberships.map((m) => m.userId), me.id];
        await tx.payment.createMany({
          data: everyone.map((userId) => ({
            circleId: circle.id, cycle: 1, userId, amountCents: circle.contributionCents, dueAt,
          })),
        });
      }
    });
    const fresh = await loadCircle({ id: circle.id });
    const notificationIds = await notifyJoin(circle.id, me.id);
    after(() => dispatchPush(notificationIds));
    return ok({ circle: await toDetail(fresh!, me) });
  }

  if (method === 'GET' && path[0] === 'circles' && path.length === 2) {
    const circle = await loadCircle({ id: path[1] });
    const isMember = circle?.memberships.some((m) => m.userId === me.id);
    const allowed = circle && (isMember || canSeeCircle(
      { tier: me.tier as Tier, nationality: me.nationality },
      { tier: circle.tier as Tier, includedNationalities: circle.includedNationalities, excludedNationalities: circle.excludedNationalities },
    ));
    if (!circle || !allowed) return fail('NOT_FOUND', 'This circle is not available to you.', 404);
    // A contribution that passed its due date is late (checked when the circle is fetched)
    if (circle.status === 'active') await markLateIfDue(circle.id);
    const fresh = await loadCircle({ id: circle.id });
    return ok({ circle: await toDetail(fresh!, me) });
  }

  return fail('NOT_FOUND', 'Unknown endpoint.', 404);
}
