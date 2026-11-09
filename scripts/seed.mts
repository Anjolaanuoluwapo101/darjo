// Seed the demo data: three PayPal sandbox people and one circle that is ready
// to pay out. Run it with `npm run seed`.
//
// It wipes the database first, so never point it at data you want to keep.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { COUNTRIES } from '../data/countries.ts';

type DemoUser = {
  name: string;
  email: string;
  password: string;
  nationality: string;
};

type DemoFile = {
  note?: string;
  users: DemoUser[];
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Node does not read .env files for us, so we do it here.
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    let raw: string;
    try {
      raw = readFileSync(join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env before seeding.');
  process.exit(1);
}

const prisma = new PrismaClient();

const CONTRIBUTION_CENTS = 5000;
const FEE_RATE = 0.015;
const TIER_MIN_SCORE: Record<number, number> = { 1: 0, 2: 25, 3: 50, 4: 75 };
const ON_TIME_POINTS = 5;

const currencyFor = (code: string) =>
  COUNTRIES.find((country) => country.code === code.toUpperCase())?.currency;

const tierFor = (score: number) => {
  let tier = 1;
  for (const [level, min] of Object.entries(TIER_MIN_SCORE)) {
    if (score >= min) tier = Number(level);
  }
  return tier;
};

// The demo circle: three members, everyone paid, and the Japan member is the
// winner of cycle 1 so a payout can be released straight away.
async function main() {
  const raw = readFileSync(join(root, 'data', 'demo-users.json'), 'utf8');
  const demo = JSON.parse(raw) as DemoFile;
  if (!demo.users?.length) {
    console.error('data/demo-users.json has no users.');
    process.exit(1);
  }

  console.log('Wiping the database...');
  await prisma.webhookEvent.deleteMany({});
  await prisma.scoreEvent.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.circle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating the sandbox people...');
  const users = [];
  for (const demoUser of demo.users) {
    const nationality = demoUser.nationality.toUpperCase();
    const user = await prisma.user.create({
      data: {
        name: demoUser.name,
        email: demoUser.email.toLowerCase(),
        passwordHash: await bcrypt.hash(demoUser.password, 10),
        nationality,
        currency: currencyFor(nationality) ?? 'USD',
        score: 0,
        tier: 1,
      },
    });
    users.push(user);
  }

  console.log('Creating the demo circle...');
  const creator = users[0];
  const circle = await prisma.circle.create({
    data: {
      name: 'Sandbox Savings Circle',
      creatorId: creator.id,
      tier: 2,
      contributionCents: CONTRIBUTION_CENTS,
      frequency: 'weekly',
      memberLimit: users.length,
      status: 'active',
      inviteCode: 'DEMO24',
      includedNationalities: [],
      excludedNationalities: [],
      currentCycle: 1,
      cycleStartedAt: new Date(),
    },
  });

  // The Japan account takes turn 1 so it is the winner of the first cycle.
  const ordered = [users[2], users[0], users[1]];
  for (let index = 0; index < ordered.length; index++) {
    await prisma.membership.create({
      data: {
        circleId: circle.id,
        userId: ordered[index].id,
        turnPosition: index + 1,
      },
    });
    await prisma.payment.create({
      data: {
        circleId: circle.id,
        cycle: 1,
        userId: ordered[index].id,
        amountCents: CONTRIBUTION_CENTS,
        status: 'paid',
        dueAt: new Date(),
        paidAt: new Date(),
        paypalCaptureId: `SEED-${ordered[index].id}`,
      },
    });
  }

  // Give everyone a little history so the profile screen has something to show.
  const history: Record<string, number> = { [users[0].id]: 3, [users[1].id]: 2, [users[2].id]: 6 };
  for (const user of users) {
    const rounds = history[user.id] ?? 0;
    for (let round = 0; round < rounds; round++) {
      await prisma.scoreEvent.create({
        data: {
          userId: user.id,
          circleId: circle.id,
          type: 'on_time',
          points: ON_TIME_POINTS,
        },
      });
    }
    const score = rounds * ON_TIME_POINTS;
    await prisma.user.update({
      where: { id: user.id },
      data: { score, tier: tierFor(score) },
    });
  }

  const grossCents = CONTRIBUTION_CENTS * users.length;
  const feeCents = Math.round(grossCents * FEE_RATE);
  await prisma.payout.create({
    data: {
      circleId: circle.id,
      cycle: 1,
      winnerId: ordered[0].id,
      grossCents,
      feeCents,
      netCents: grossCents - feeCents,
      status: 'prepared',
      idempotencyKey: `payout-${circle.id}-1`,
    },
  });

  console.log('\nSeeded. Sign in with any of these accounts:');
  for (const demoUser of demo.users) {
    console.log(`  ${demoUser.email}  /  ${demoUser.password}  (${demoUser.nationality})`);
  }
  console.log(`\nCircle: ${circle.name} (invite code DEMO24)`);
  console.log('The winner of cycle 1 is the Japan account, ready to release a payout.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
