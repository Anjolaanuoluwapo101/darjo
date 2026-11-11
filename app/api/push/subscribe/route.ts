// POST /api/push/subscribe  { endpoint, keys: { p256dh, auth }, userAgent? }
// DELETE /api/push/subscribe  { endpoint }
import { NextRequest } from 'next/server';
import { db, fail, ok, requireUser } from '@/lib/server';

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
    userAgent?: unknown;
  };
  const endpoint = text(body.endpoint);
  const p256dh = text(body.keys?.p256dh);
  const auth = text(body.keys?.auth);
  if (!endpoint || !p256dh || !auth)
    return fail('VALIDATION', 'A valid push subscription is required.');

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: me.id,
      endpoint,
      p256dh,
      auth,
      userAgent: text(body.userAgent) || null,
    },
    update: {
      userId: me.id,
      p256dh,
      auth,
      userAgent: text(body.userAgent) || null,
      lastSeenAt: new Date(),
    },
  });
  return ok({ subscribed: true });
}

export async function DELETE(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as { endpoint?: unknown };
  const endpoint = text(body.endpoint);
  if (!endpoint) return fail('VALIDATION', 'An endpoint is required.');
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: me.id } });
  return ok({ subscribed: false });
}
