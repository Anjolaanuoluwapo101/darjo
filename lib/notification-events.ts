// Event helpers that turn committed business state into deduped notifications.
// Call these after the payment/payout/join transaction has committed, then send
// the returned ids to after(() => dispatchPush(ids)).
import { db } from '@/lib/server';
import { computeTier } from '@/lib/rules';
import { createNotifications, notificationKeys } from '@/lib/notifications';
import { displayName } from '@/lib/names';
import type { NotificationInput } from '@/lib/notifications';
import type { Tier } from '@/types/api';

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export async function notifyPaymentSettled(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { circle: { include: { memberships: true } }, user: true },
  });
  if (!payment || payment.status !== 'paid') return [];

  const inputs: NotificationInput[] = [
    {
      userId: payment.userId,
      type: 'payment_paid',
      title: 'Contribution received',
      body: `${usd(payment.amountCents)} for ${payment.circle.name} was paid.`,
      url: `/circles/${payment.circleId}`,
      data: { paymentId: payment.id, circleId: payment.circleId },
      dedupeKey: notificationKeys.paymentPaid(payment.id),
    },
  ];

  const latestEvent = await db.scoreEvent.findFirst({
    where: { userId: payment.userId, circleId: payment.circleId },
    orderBy: { createdAt: 'desc' },
  });
  if (latestEvent) {
    const before = computeTier(payment.user.score - latestEvent.points);
    if (payment.user.tier > before) {
      inputs.push({
        userId: payment.userId,
        type: 'tier_up',
        title: 'You moved up a tier',
        body: `Your contribution score is now ${payment.user.score}. You are Tier ${payment.user.tier}.`,
        url: '/profile',
        data: { tier: payment.user.tier },
        dedupeKey: notificationKeys.tierUp(payment.userId, payment.user.tier as Tier),
      });
    }
  }

  const payout = await db.payout.findUnique({
    where: { circleId_cycle: { circleId: payment.circleId, cycle: payment.cycle } },
  });
  if (payout?.status === 'prepared') {
    const winner = await db.user.findUnique({ where: { id: payout.winnerId } });
    inputs.push({
      userId: payout.winnerId,
      type: 'payout_ready',
      title: 'Your payout is ready',
      body: `${payment.circle.name} collected the full pot. Release ${usd(payout.netCents)} when you are ready.`,
      url: '/payouts',
      data: { payoutId: payout.id, circleId: payout.circleId },
      dedupeKey: notificationKeys.payoutReady(payout.id),
    });
    for (const membership of payment.circle.memberships) {
      inputs.push({
        userId: membership.userId,
        type: 'circle_filled',
        title: 'Circle is full',
        body: `${payment.circle.name} has collected the full pot for cycle ${payment.cycle}. ${winner ? displayName(winner) : 'The winner'} can release it.`,
        url: `/circles/${payment.circleId}`,
        data: { circleId: payment.circleId, cycle: payment.cycle, payoutId: payout.id },
        dedupeKey: notificationKeys.circleFilled(payment.circleId),
      });
    }
  }

  return (await createNotifications(inputs)).map((row) => row.id);
}

export async function notifyPaymentFailed(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { circle: true },
  });
  if (!payment || payment.status !== 'failed') return [];
  return (
    await createNotifications([
      {
        userId: payment.userId,
        type: 'payment_failed',
        title: 'Contribution failed',
        body: `Your ${usd(payment.amountCents)} payment to ${payment.circle.name} did not go through.`,
        url: `/circles/${payment.circleId}`,
        data: { paymentId: payment.id, circleId: payment.circleId },
        dedupeKey: notificationKeys.paymentFailed(payment.id),
      },
    ])
  ).map((row) => row.id);
}

export async function notifyPaymentLate(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { circle: true },
  });
  if (!payment || payment.status !== 'late') return [];
  return (
    await createNotifications([
      {
        userId: payment.userId,
        type: 'payment_overdue',
        title: 'Contribution is late',
        body: `Your ${usd(payment.amountCents)} contribution to ${payment.circle.name} is past due.`,
        url: `/circles/${payment.circleId}`,
        data: { paymentId: payment.id, circleId: payment.circleId },
        dedupeKey: notificationKeys.paymentOverdue(payment.id),
      },
    ])
  ).map((row) => row.id);
}

export async function notifyPaymentDueSoon(paymentIds: string[]) {
  if (paymentIds.length === 0) return [];
  const payments = await db.payment.findMany({
    where: { id: { in: paymentIds }, status: 'pending' },
    include: { circle: true },
  });
  return (
    await createNotifications(
      payments.map((payment) => ({
        userId: payment.userId,
        type: 'payment_due' as const,
        title: 'Contribution due soon',
        body: `${usd(payment.amountCents)} for ${payment.circle.name} is due ${shortDate(payment.dueAt)}.`,
        url: `/circles/${payment.circleId}`,
        data: { paymentId: payment.id, circleId: payment.circleId },
        dedupeKey: notificationKeys.paymentDue(payment.id),
      })),
    )
  ).map((row) => row.id);
}

export async function notifyJoin(circleId: string, userId: string) {
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    include: { memberships: true },
  });
  if (!circle) return [];
  const inputs: NotificationInput[] = circle.memberships.map((membership) => ({
    userId: membership.userId,
    type: 'cycle_started',
    title: circle.memberships.length >= circle.memberLimit ? 'Circle is full' : 'You joined a circle',
    body:
      circle.memberships.length >= circle.memberLimit
        ? `${circle.name} is full. Cycle ${circle.currentCycle} starts now.`
        : `${circle.name} has ${circle.memberLimit - circle.memberships.length} seat(s) left.`,
    url: `/circles/${circle.id}`,
    data: { circleId: circle.id, cycle: circle.currentCycle, joinedUserId: userId },
    dedupeKey:
      circle.memberships.length >= circle.memberLimit
        ? notificationKeys.circleFilled(circle.id)
        : notificationKeys.cycleStarted(circle.id, circle.currentCycle),
  }));
  return (await createNotifications(inputs)).map((row) => row.id);
}

export async function notifyPayoutFinalized(payoutId: string) {
  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: {
      circle: { include: { memberships: true } },
    },
  });
  if (!payout || payout.status !== 'paid') return [];

  const inputs: NotificationInput[] = [
    {
      userId: payout.winnerId,
      type: 'payout_paid',
      title: 'Payout sent',
      body: `${usd(payout.netCents)} from ${payout.circle.name} was sent to your account.`,
      url: '/payouts',
      data: { payoutId: payout.id, circleId: payout.circleId, cycle: payout.cycle },
      dedupeKey: notificationKeys.payoutPaid(payout.id),
    },
  ];

  if (payout.circle.status === 'completed') {
    for (const membership of payout.circle.memberships) {
      inputs.push({
        userId: membership.userId,
        type: 'circle_completed',
        title: 'Circle completed',
        body: `${payout.circle.name} finished all ${payout.circle.memberLimit} cycles. Your contribution score has been updated.`,
        url: `/circles/${payout.circleId}`,
        data: { circleId: payout.circleId },
        dedupeKey: notificationKeys.circleCompleted(payout.circleId),
      });
    }
  } else {
    const nextPayment = await db.payment.findFirst({
      where: { circleId: payout.circleId, cycle: payout.circle.currentCycle },
      orderBy: { dueAt: 'asc' },
    });
    for (const membership of payout.circle.memberships) {
      inputs.push({
        userId: membership.userId,
        type: 'cycle_started',
        title: `Cycle ${payout.circle.currentCycle} started`,
        body: `${payout.circle.name} is on cycle ${payout.circle.currentCycle}. ${nextPayment ? `${usd(nextPayment.amountCents)} is due ${shortDate(nextPayment.dueAt)}.` : ''}`,
        url: `/circles/${payout.circleId}`,
        data: { circleId: payout.circleId, cycle: payout.circle.currentCycle },
        dedupeKey: notificationKeys.cycleStarted(payout.circleId, payout.circle.currentCycle),
      });
    }
  }

  return (await createNotifications(inputs)).map((row) => row.id);
}

export async function notifyPayoutFailed(payoutId: string) {
  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: { circle: true },
  });
  if (!payout || payout.status !== 'failed') return [];
  return (
    await createNotifications([
      {
        userId: payout.winnerId,
        type: 'payout_failed',
        title: 'Payout could not be sent',
        body: `${usd(payout.netCents)} for ${payout.circle.name} could not be sent. Please check your account.`,
        url: '/payouts',
        data: { payoutId: payout.id, circleId: payout.circleId },
        dedupeKey: notificationKeys.payoutFailed(payout.id),
      },
    ])
  ).map((row) => row.id);
}

export async function notifyNudge(input: {
  circleId: string;
  toUserId: string;
  fromUserId: string;
  cycle: number;
  text: string;
}) {
  const [circle, sender] = await Promise.all([
    db.circle.findUnique({ where: { id: input.circleId } }),
    db.user.findUnique({ where: { id: input.fromUserId } }),
  ]);
  if (!circle || !sender) return [];
  return (
    await createNotifications([
      {
        userId: input.toUserId,
        type: 'nudge',
        title: 'A circle member nudged you',
        body: `${displayName(sender)} in ${circle.name}: ${input.text}`,
        url: `/circles/${input.circleId}`,
        data: { circleId: input.circleId, fromUserId: input.fromUserId, cycle: input.cycle },
        dedupeKey: notificationKeys.nudge(input.circleId, input.toUserId, input.cycle),
      },
    ])
  ).map((row) => row.id);
}
