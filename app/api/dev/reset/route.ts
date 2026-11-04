// POST /api/dev/reset -> demo helper. Off unless DEMO_TOOLS=true.
// Wipes the demo data and recreates the demo people, so a demo can start from a clean circle.
// Send { "confirm": "RESET" } to run it.
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ok, fail } from '@/lib/server';
import { currencyFor } from '@/lib/rules/countries';

interface SeedUser { name: string; email: string; password: string; nationality: string }

const DEFAULT_SEED: SeedUser[] = [
  { name: 'Ada Demo', email: 'sb-eytkw53718260@personal.example.com', password: 'secret123', nationality: 'US' },
  { name: 'Ben Demo', email: 'ben.demo@darjo.test', password: 'secret123', nationality: 'US' },
];

function seedUsers(): SeedUser[] {
  const raw = process.env.DEMO_SEED_USERS;
  if (!raw) return DEFAULT_SEED;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed as SeedUser[];
  } catch {
    console.error('DEMO_SEED_USERS is not valid JSON, using the default demo people');
  }
  return DEFAULT_SEED;
}

export async function POST(req: NextRequest) {
  if (process.env.DEMO_TOOLS !== 'true') return fail('NOT_FOUND', 'Unknown endpoint.', 404);
  const body = ((await req.json().catch(() => null)) ?? {}) as { confirm?: unknown };
  if (body.confirm !== 'RESET')
    return fail('VALIDATION', 'Send { "confirm": "RESET" } to wipe the demo data.');

  const users = seedUsers();
  await db.$transaction(async (tx) => {
    await tx.webhookEvent.deleteMany({});
    await tx.scoreEvent.deleteMany({});
    await tx.payout.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.membership.deleteMany({});
    await tx.circle.deleteMany({});
    await tx.user.deleteMany({});
    for (const u of users) {
      await tx.user.create({
        data: {
          name: u.name,
          email: u.email.toLowerCase(),
          passwordHash: await bcrypt.hash(u.password, 10),
          nationality: u.nationality.toUpperCase(),
          currency: currencyFor(u.nationality) ?? 'USD',
        },
      });
    }
  });

  return ok({
    reset: true,
    users: users.map((u) => ({ name: u.name, email: u.email, password: u.password })),
  });
}
