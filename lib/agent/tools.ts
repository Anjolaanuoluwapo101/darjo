// The tools the model may call. Every tool checks that the person asking belongs to the circle.
// There is no tool that releases a payout: only the winner's tap on the release endpoint does that.
import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import { after } from 'next/server';
import { db } from '@/lib/server';
import { ensurePayoutPrepared } from '@/lib/payments';
import { notifyNudge } from '@/lib/notification-events';
import { dispatchPush } from '@/lib/push';
import type { AgentAction } from '@/types/api';

export interface AgentContext {
  userId: string;
  circleId?: string;
}

export interface ToolResult {
  data: Record<string, unknown>;
  action?: AgentAction;
}

export interface AgentTool {
  declaration: FunctionDeclaration;
  run: (args: Record<string, unknown>, ctx: AgentContext) => Promise<ToolResult>;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const dollars = (cents: number) => (cents / 100).toFixed(2);

async function circleForMember(circleId: string, userId: string) {
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    include: { memberships: { include: { user: true }, orderBy: { turnPosition: 'asc' } } },
  });
  if (!circle) return { error: 'That circle does not exist.' as const };
  if (!circle.memberships.some((m) => m.userId === userId))
    return { error: 'You are not a member of that circle.' as const };
  return { circle };
}

const getCircleStatus: AgentTool = {
  declaration: {
    name: 'get_circle_status',
    description: 'Get the current cycle, pot, and who has paid for a circle the person belongs to.',
    parameters: {
      type: Type.OBJECT,
      properties: { circleId: { type: Type.STRING, description: 'The circle id.' } },
      required: ['circleId'],
    },
  },
  async run(args, ctx) {
    const circleId = str(args.circleId) || ctx.circleId || '';
    const found = await circleForMember(circleId, ctx.userId);
    if ('error' in found) return { data: { error: found.error } };
    const circle = found.circle;
    const payments = await db.payment.findMany({
      where: { circleId: circle.id, cycle: circle.currentCycle },
    });
    const paid = new Map(payments.map((p) => [p.userId, p.status]));
    return {
      data: {
        name: circle.name,
        status: circle.status,
        currentCycle: circle.currentCycle,
        totalCycles: circle.memberLimit,
        frequency: circle.frequency,
        contributionCents: circle.contributionCents,
        potCents: circle.contributionCents * circle.memberLimit,
        paidThisCycleCents: payments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + p.amountCents, 0),
        members: circle.memberships.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          tier: m.user.tier,
          turnPosition: m.turnPosition,
          paidThisCycle: paid.get(m.userId) === 'paid',
          paymentStatus: paid.get(m.userId) ?? 'pending',
        })),
      },
    };
  },
};

const listUnpaidMembers: AgentTool = {
  declaration: {
    name: 'list_unpaid_members',
    description: 'List the members of a circle who have not paid this cycle yet, and how late they are.',
    parameters: {
      type: Type.OBJECT,
      properties: { circleId: { type: Type.STRING, description: 'The circle id.' } },
      required: ['circleId'],
    },
  },
  async run(args, ctx) {
    const circleId = str(args.circleId) || ctx.circleId || '';
    const found = await circleForMember(circleId, ctx.userId);
    if ('error' in found) return { data: { error: found.error } };
    const circle = found.circle;
    const payments = await db.payment.findMany({
      where: { circleId: circle.id, cycle: circle.currentCycle },
    });
    const now = Date.now();
    const unpaid = circle.memberships
      .map((m) => {
        const payment = payments.find((p) => p.userId === m.userId);
        const status = payment?.status ?? 'pending';
        const daysLate = payment && status !== 'paid'
          ? Math.max(0, Math.floor((now - payment.dueAt.getTime()) / 86_400_000))
          : 0;
        return {
          userId: m.userId,
          name: m.user.name,
          amountCents: payment?.amountCents ?? circle.contributionCents,
          status,
          daysLate,
          dueAt: payment?.dueAt.toISOString() ?? null,
        };
      })
      .filter((m) => m.status !== 'paid');
    return {
      data: {
        circleName: circle.name,
        cycle: circle.currentCycle,
        unpaidMembers: unpaid,
      },
    };
  },
};

const draftNudge: AgentTool = {
  declaration: {
    name: 'draft_nudge',
    description: 'Draft a friendly reminder message for a member who has not paid this cycle.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userId: { type: Type.STRING, description: 'The member to remind.' },
        circleId: { type: Type.STRING, description: 'The circle id.' },
      },
      required: ['userId', 'circleId'],
    },
  },
  async run(args, ctx) {
    const circleId = str(args.circleId) || ctx.circleId || '';
    const memberId = str(args.userId);
    const found = await circleForMember(circleId, ctx.userId);
    if ('error' in found) return { data: { error: found.error } };
    const circle = found.circle;
    const member = circle.memberships.find((m) => m.userId === memberId);
    if (!member) return { data: { error: 'That person is not in this circle.' } };
    const payment = await db.payment.findUnique({
      where: { circleId_cycle_userId: { circleId: circle.id, cycle: circle.currentCycle, userId: memberId } },
    });
    if (payment?.status === 'paid') return { data: { error: 'That member has already paid this cycle.' } };
    const amount = payment?.amountCents ?? circle.contributionCents;
    const text = `Hi ${member.user.name}, your $${dollars(amount)} contribution for ${circle.name} is due. Can you pay today?`;
    return {
      data: { toUserId: memberId, name: member.user.name, amountCents: amount, text },
      action: { type: 'nudge_drafted', toUserId: memberId, text },
    };
  },
};

const sendNudge: AgentTool = {
  declaration: {
    name: 'send_nudge',
    description:
      'Send a nudge notification to a member who has not paid this cycle. Only call after the person explicitly asks to send it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userId: { type: Type.STRING, description: 'The member to nudge.' },
        circleId: { type: Type.STRING, description: 'The circle id.' },
      },
      required: ['userId', 'circleId'],
    },
  },
  async run(args, ctx) {
    const circleId = str(args.circleId) || ctx.circleId || '';
    const memberId = str(args.userId);
    if (memberId === ctx.userId) return { data: { error: 'You do not need to nudge yourself.' } };
    const found = await circleForMember(circleId, ctx.userId);
    if ('error' in found) return { data: { error: found.error } };
    const circle = found.circle;
    const member = circle.memberships.find((m) => m.userId === memberId);
    if (!member) return { data: { error: 'That person is not in this circle.' } };
    const payment = await db.payment.findUnique({
      where: { circleId_cycle_userId: { circleId: circle.id, cycle: circle.currentCycle, userId: memberId } },
    });
    if (payment?.status === 'paid') return { data: { error: 'That member has already paid this cycle.' } };
    const amount = payment?.amountCents ?? circle.contributionCents;
    const text = `Hi ${member.user.name}, your $${dollars(amount)} contribution for ${circle.name} is due. Can you pay today?`;
    const ids = await notifyNudge({
      circleId: circle.id,
      toUserId: memberId,
      fromUserId: ctx.userId,
      cycle: circle.currentCycle,
      text,
    });
    if (ids.length > 0) after(() => dispatchPush(ids));
    return {
      data: { sent: true, toUserId: memberId, name: member.user.name, amountCents: amount, text },
      action: { type: 'nudge_sent', toUserId: memberId, circleId: circle.id, text },
    };
  },
};

const explainScore: AgentTool = {
  declaration: {
    name: 'explain_score',
    description: 'Explain the asking person their own contribution score, tier and recent history.',
    parameters: {
      type: Type.OBJECT,
      properties: { userId: { type: Type.STRING, description: 'The member id.' } },
      required: ['userId'],
    },
  },
  async run(args, ctx) {
    const userId = str(args.userId) || ctx.userId;
    if (userId !== ctx.userId) return { data: { error: 'You can only ask about your own score.' } };
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { data: { error: 'That member does not exist.' } };
    const events = await db.scoreEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const circleIds = Array.from(new Set(events.map((e) => e.circleId)));
    const circles = await db.circle.findMany({
      where: { id: { in: circleIds } },
      select: { id: true, name: true },
    });
    const circleName = new Map(circles.map((c) => [c.id, c.name]));
    return {
      data: {
        score: user.score,
        tier: user.tier,
        rank: user.rank,
        events: events.map((e) => ({
          type: e.type,
          points: e.points,
          circleName: circleName.get(e.circleId) ?? 'Circle',
          createdAt: e.createdAt.toISOString(),
        })),
      },
    };
  },
};

const preparePayout: AgentTool = {
  declaration: {
    name: 'prepare_payout',
    description:
      'Prepare the payout for a cycle when every member has paid. This never sends money; only the winner releases it.',
    parameters: {
      type: Type.OBJECT,
      properties: { circleId: { type: Type.STRING, description: 'The circle id.' } },
      required: ['circleId'],
    },
  },
  async run(args, ctx) {
    const circleId = str(args.circleId) || ctx.circleId || '';
    const found = await circleForMember(circleId, ctx.userId);
    if ('error' in found) return { data: { error: found.error } };
    const circle = found.circle;
    const payout = await ensurePayoutPrepared(circle.id, circle.currentCycle);
    if (!payout) {
      return { data: { error: 'The pot is not full yet, so there is nothing to prepare.' } };
    }
    const winner = circle.memberships.find((m) => m.userId === payout.winnerId);
    return {
      data: {
        payoutId: payout.id,
        status: payout.status,
        cycle: payout.cycle,
        grossCents: payout.grossCents,
        feeCents: payout.feeCents,
        netCents: payout.netCents,
        winnerName: winner?.user.name ?? null,
      },
      action: { type: 'payout_prepared', payoutId: payout.id },
    };
  },
};

export const agentTools: AgentTool[] = [
  getCircleStatus,
  listUnpaidMembers,
  draftNudge,
  sendNudge,
  explainScore,
  preparePayout,
];
