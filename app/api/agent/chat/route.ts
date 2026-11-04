// POST /api/agent/chat -> the D'arjo assistant (Gemini with our own tools).
import { NextRequest } from 'next/server';
import { ok, fail, requireUser } from '@/lib/server';
import { runAgent } from '@/lib/agent/client';

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const body = ((await req.json().catch(() => null)) ?? {}) as { circleId?: unknown; message?: unknown };
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const circleId = typeof body.circleId === 'string' ? body.circleId.trim() : undefined;
  if (!message) return fail('VALIDATION', 'Type a message first.');
  if (message.length > 2000) return fail('VALIDATION', 'That message is too long.');

  const result = await runAgent({ userId: me.id, message, circleId });
  return ok(result);
}
