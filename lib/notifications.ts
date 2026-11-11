// Server-only notification helpers. Creates deduped in-app notifications and
// maps them to the shared API shape. Push delivery is handled by lib/push.ts.
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server';
import type { AppNotification, NotificationType } from '@/types/api';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string | null;
  data?: Prisma.InputJsonValue | null;
  dedupeKey: string;
}

export const notificationKeys = {
  paymentDue: (paymentId: string) => `payment-due:${paymentId}`,
  paymentOverdue: (paymentId: string) => `payment-overdue:${paymentId}`,
  paymentPaid: (paymentId: string) => `payment-paid:${paymentId}`,
  paymentFailed: (paymentId: string) => `payment-failed:${paymentId}`,
  nudge: (circleId: string, userId: string, cycle: number) =>
    `nudge:${circleId}:${cycle}:${userId}`,
  payoutReady: (payoutId: string) => `payout-ready:${payoutId}`,
  payoutSent: (payoutId: string) => `payout-sent:${payoutId}`,
  payoutPaid: (payoutId: string) => `payout-paid:${payoutId}`,
  payoutFailed: (payoutId: string) => `payout-failed:${payoutId}`,
  tierUp: (userId: string, tier: number) => `tier-up:${userId}:${tier}`,
  circleFilled: (circleId: string) => `circle-filled:${circleId}`,
  cycleStarted: (circleId: string, cycle: number) => `cycle-started:${circleId}:${cycle}`,
  circleCompleted: (circleId: string) => `circle-completed:${circleId}`,
};

export function toAppNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Prisma.JsonValue | null;
  readAt: Date | null;
  pushStatus: string;
  createdAt: Date;
}): AppNotification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    url: row.url,
    data: (row.data as Record<string, unknown> | null) ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    pushStatus: row.pushStatus as AppNotification['pushStatus'],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) return [];
  return db.notification.createManyAndReturn({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url ?? null,
      data: input.data ?? undefined,
      dedupeKey: input.dedupeKey,
    })),
    skipDuplicates: true,
    select: { id: true, userId: true },
  });
}

export async function createNotification(input: NotificationInput) {
  const rows = await createNotifications([input]);
  return rows[0] ?? null;
}

export async function listNotifications(
  userId: string,
  options: { cursor?: string | null; limit?: number; unread?: boolean } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(options.unread ? { readAt: null } : {}),
  };
  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toAppNotification);
  return {
    items,
    unreadCount,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}

export async function markNotificationsRead(
  userId: string,
  options: { ids?: string[]; all?: boolean },
) {
  if (!options.all && (!options.ids || options.ids.length === 0)) return 0;
  const result = await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(options.all ? {} : { id: { in: options.ids } }),
    },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
