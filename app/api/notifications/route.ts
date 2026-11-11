// GET /api/notifications?cursor=&limit=&unread=1
import { NextRequest } from 'next/server';
import { fail, ok, requireUser } from '@/lib/server';
import { listNotifications } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const cursor = req.nextUrl.searchParams.get('cursor');
  const limitParam = Number(req.nextUrl.searchParams.get('limit'));
  const page = await listNotifications(me.id, {
    cursor,
    limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20,
    unread: req.nextUrl.searchParams.get('unread') === '1',
  });
  return ok(page);
}
