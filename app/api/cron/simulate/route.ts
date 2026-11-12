// GET /api/cron/simulate -> daily Vercel cron.
// Gives the hosted demo realistic activity: settles due contributions, releases
// payouts for full pots and starts the next cycle.
import { NextRequest, after } from 'next/server';
import { fail, ok } from '@/lib/server';
import { simulateActivity } from '@/lib/simulate';
import { dispatchPush } from '@/lib/push';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`)
    return fail('UNAUTHORIZED', 'Cron secret is missing or invalid.', 401);

  const result = await simulateActivity();
  after(() => dispatchPush(result.notificationIds));

  return ok({
    circles: result.circles,
    settled: result.settled,
    payoutsReleased: result.payoutsReleased,
    notifications: result.notificationIds.length,
  });
}
