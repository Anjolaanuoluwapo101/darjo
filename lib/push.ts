// Server-only Web Push delivery. Call dispatchPush() after the notification
// transaction has committed (usually from after() in a route handler).
import { sendNotification, setVapidDetails } from 'web-push';
import type { PushSubscription } from '@prisma/client';
import { db } from '@/lib/server';

const MAX_ATTEMPTS = 3;

export interface PushPayload {
  title: string;
  body: string;
  url?: string | null;
  tag?: string;
  notificationId?: string;
  type?: string;
}

let configured = false;
let configureFailed = false;

function configure() {
  if (configured) return true;
  if (configureFailed) return false;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@darjo.app';
  if (!publicKey || !privateKey) {
    configureFailed = true;
    return false;
  }
  try {
    setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
  } catch (error) {
    configureFailed = true;
    console.error('Web Push is not configured correctly', error);
    return false;
  }
}

function toWebPushSubscription(row: Pick<PushSubscription, 'endpoint' | 'p256dh' | 'auth'>) {
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
}

function isGone(error: unknown) {
  const status = (error as { statusCode?: number })?.statusCode;
  return status === 404 || status === 410;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configure()) return { status: 'skipped' as const, delivered: 0, reason: 'not-configured' };
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) {
    return { status: 'skipped' as const, delivered: 0, reason: 'no-subscriptions' };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/notifications',
    tag: payload.tag,
    notificationId: payload.notificationId,
    type: payload.type,
  });

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendNotification(toWebPushSubscription(subscription), body, {
        TTL: 60 * 60 * 24,
        urgency: 'normal',
      }),
    ),
  );

  const stale: string[] = [];
  let delivered = 0;
  const errors: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      delivered += 1;
      return;
    }
    const subscription = subscriptions[index];
    if (isGone(result.reason)) {
      stale.push(subscription.endpoint);
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  });

  if (stale.length > 0) {
    await db.pushSubscription.deleteMany({ where: { endpoint: { in: stale } } });
  }
  if (delivered === 0 && stale.length === subscriptions.length) {
    return { status: 'skipped' as const, delivered: 0, reason: 'subscriptions-expired' };
  }
  if (delivered === 0) {
    return {
      status: 'failed' as const,
      delivered: 0,
      reason: errors[0] || 'delivery-failed',
    };
  }
  return { status: 'sent' as const, delivered, reason: errors[0] };
}

export async function dispatchPush(notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  const rows = await db.notification.findMany({
    where: { id: { in: notificationIds }, pushStatus: 'pending', pushAttempts: { lt: MAX_ATTEMPTS } },
  });
  for (const row of rows) {
    const result = await sendPushToUser(row.userId, {
      title: row.title,
      body: row.body,
      url: row.url,
      tag: row.dedupeKey,
      notificationId: row.id,
      type: row.type,
    });
    const attempts = row.pushAttempts + 1;
    const status =
      result.status === 'sent' || result.status === 'skipped'
        ? result.status
        : attempts >= MAX_ATTEMPTS
          ? 'failed'
          : 'pending';
    await db.notification.update({
      where: { id: row.id },
      data: {
        pushStatus: status,
        pushAttempts: { increment: 1 },
        pushLastError: result.reason ? result.reason.slice(0, 500) : null,
        pushSentAt: result.status === 'sent' ? new Date() : row.pushSentAt,
      },
    });
  }
}

export async function dispatchPendingPush(limit = 100) {
  const rows = await db.notification.findMany({
    where: { pushStatus: 'pending', pushAttempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  });
  await dispatchPush(rows.map((row) => row.id));
  return rows.length;
}
