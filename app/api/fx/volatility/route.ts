// GET /api/fx/volatility?currency=JPY -> how steady the currency is against USD.
// The label falls back to our own table when the live rates cannot be reached.
import { NextRequest } from 'next/server';
import { ok, fail, requireUser } from '@/lib/server';
import { getVolatility } from '@/lib/fx';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const raw = req.nextUrl.searchParams.get('currency') ?? me.currency;
  const currency = raw.trim().toUpperCase();
  if (!currency) return fail('VALIDATION', 'Which currency should we look up?');

  const volatility = await getVolatility(currency);
  return ok(volatility);
}
