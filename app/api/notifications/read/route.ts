// POST /api/notifications/read  { ids?: string[], all?: boolean }
import { NextRequest } from 'next/server';
import { fail, ok, requireUser } from '@/lib/server';
import { markNotificationsRead } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as {
    ids?: unknown;
    all?: unknown;
  };
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === 'string')
    : undefined;
  const all = body.all === true;
  const updated = await markNotificationsRead(me.id, { ids, all });
  return ok({ updated });
}
