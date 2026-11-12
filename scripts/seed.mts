// Seed realistic demo activity: business + personal demo accounts, ~50 circles
// across open/active/completed, historical payments, payouts, scores and
// notifications. Run it with `npm run seed`.
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
  businessName?: string;
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

const DAY = 86_400_000;
const FEE_RATE = 0.015;
const SCORE_POINTS = { on_time: 5, recovered: 2, late: -5, failed: -10 } as const;
const TIER_MIN_SCORE: Record<number, number> = { 1: 0, 2: 25, 3: 50, 4: 75 };

// Deterministic randomness so the demo looks the same after a reseed.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261112);
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)];
const chance = (probability: number) => rand() < probability;
const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const currencyFor = (code: string) =>
  COUNTRIES.find((country) => country.code === code.toUpperCase())?.currency;

const tierFor = (score: number) => {
  let tier = 1;
  for (const [level, min] of Object.entries(TIER_MIN_SCORE)) {
    if (score >= min) tier = Number(level);
  }
  return tier;
};

const rankFor = (tier: number, completed: number): string | null => {
  if (tier < 4) return null;
  if (completed >= 10) return 'Ruby';
  if (completed >= 6) return 'Gold';
  if (completed >= 3) return 'Silver';
  if (completed >= 1) return 'Bronze';
  return null;
};

const applyPoints = (score: number, type: keyof typeof SCORE_POINTS) =>
  Math.min(100, Math.max(0, score + SCORE_POINTS[type]));

const NATIONALITY_GROUPS = {
  europe: ['DE', 'FR', 'IT', 'ES', 'NL', 'PT', 'IE', 'SE', 'PL', 'LT'],
  americas: ['US', 'CA', 'MX', 'BR', 'AR', 'CL'],
  africa: ['NG', 'GH', 'KE', 'ZA', 'MU', 'MA'],
  asia: ['JP', 'IN', 'SG', 'PH', 'VN'],
} as const;

const CIRCLE_PREFIXES = [
  'Sunrise', 'Harbor', 'Mosaic', 'Harvest', 'Compass', 'Atlas', 'Cedar',
  'Northstar', 'Copper', 'Lagoon', 'Meridian', 'Orchard', 'Summit', 'Willow',
  'Beacon', 'Cobalt', 'Marigold', 'Tidewater', 'Juniper', 'Golden Gate',
  'Silver Fern', 'Redwood', 'Bluebird', 'Kestrel', 'Amber',
];

const CIRCLE_SUFFIXES = [
  'Savings Circle', 'Collective', 'Trust Circle', 'Payout Circle', 'Circle',
  'Fund', 'Pool', 'Partners',
];

const CONTRIBUTIONS = [2500, 5000, 7500, 10000, 12500, 15000, 20000, 25000];

type SeededUser = {
  id: string;
  name: string;
  nationality: string;
};

type SeedCircle = {
  id: string;
  name: string;
  status: 'open' | 'active' | 'completed';
  currentCycle: number;
};

async function main() {
  const raw = readFileSync(join(root, 'data', 'demo-users.json'), 'utf8');
  const demo = JSON.parse(raw) as DemoFile;
  if (!demo.users?.length) {
    console.error('data/demo-users.json has no users.');
    process.exit(1);
  }

  console.log('Wiping the database...');
  await prisma.notification.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.scoreEvent.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.circle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log(`Creating ${demo.users.length} demo accounts...`);
  const passwordHashes = new Map<string, string>();
  const users: SeededUser[] = [];
  let primaryUserId = '';
  for (const demoUser of demo.users) {
    let passwordHash = passwordHashes.get(demoUser.password);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(demoUser.password, 10);
      passwordHashes.set(demoUser.password, passwordHash);
    }
    const nationality = demoUser.nationality.toUpperCase();
    const user = await prisma.user.create({
      data: {
        name: demoUser.name,
        businessName: demoUser.businessName ?? null,
        email: demoUser.email.toLowerCase(),
        passwordHash,
        nationality,
        currency: currencyFor(nationality) ?? 'USD',
        score: 0,
        tier: 1,
      },
    });
    if (demoUser.email.toLowerCase() === 'demo-user-01@darjo.example') {
      primaryUserId = user.id;
    }
    users.push({ id: user.id, name: user.name, nationality });
  }

  const membershipsByUser = new Map<string, SeedCircle[]>();
  const circleNames = new Set<string>();
  const makeCircleName = () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const name = `${pick(CIRCLE_PREFIXES)} ${pick(CIRCLE_SUFFIXES)}`;
      if (!circleNames.has(name)) {
        circleNames.add(name);
        return name;
      }
    }
    const fallback = `Darjo Circle ${circleNames.size + 1}`;
    circleNames.add(fallback);
    return fallback;
  };

  console.log('Creating 50 circles and their history...');
  const now = Date.now();
  let openCount = 0;
  let activeCount = 0;
  let completedCount = 0;

  for (let index = 0; index < 50; index++) {
    const status: SeedCircle['status'] =
      index < 10 ? 'open' : index < 30 ? 'active' : 'completed';

    const creator = pick(users);
    const frequency = chance(0.4) ? 'weekly' : 'monthly';
    const periodDays = frequency === 'weekly' ? 7 : 30;
    const gapMs = periodDays * DAY + (status === 'completed' ? 2 : 1) * DAY;

    let included: string[] = [];
    let excluded: string[] = [];
    if (chance(0.18)) {
      const group = pick(Object.values(NATIONALITY_GROUPS)) as readonly string[];
      included = shuffle([...group, creator.nationality]).slice(0, 6);
      if (!included.includes(creator.nationality)) included.push(creator.nationality);
    } else if (chance(0.1)) {
      const group = pick(Object.values(NATIONALITY_GROUPS)) as readonly string[];
      excluded = group.filter((code) => code !== creator.nationality).slice(0, 4);
    }

    const allowed = (user: SeededUser) => {
      if (excluded.includes(user.nationality)) return false;
      if (included.length > 0 && !included.includes(user.nationality)) return false;
      return true;
    };

    const allowedPool = users.filter(allowed);
    const maxMembers = Math.min(8, Math.max(4, allowedPool.length));
    const memberLimit = randInt(4, maxMembers);
    // Open circles are still looking for members, so leave at least one seat free.
    const targetMembers = status === 'open' ? randInt(2, Math.max(2, memberLimit - 1)) : memberLimit;
    const selected = shuffle(allowedPool).slice(0, Math.min(targetMembers, allowedPool.length));
    if (!selected.some((user) => user.id === creator.id)) {
      selected[0] = creator;
    }

    const contributionCents = pick(CONTRIBUTIONS);
    const tier =
      status === 'open'
        ? randInt(1, 2)
        : status === 'active'
          ? randInt(1, 3)
          : randInt(1, 4);

    // Put the creator at a random turn, everyone else in shuffled order.
    const ordered = shuffle(selected);
    const creatorAt = ordered.findIndex((user) => user.id === creator.id);

    const totalCycles = memberLimit;
    let currentCycle = 1;
    let cycleStartedAt: Date | null = null;
    let createdAt: Date;

    if (status === 'open') {
      createdAt = new Date(now - randInt(0, 20) * DAY);
    } else if (status === 'active') {
      currentCycle = randInt(1, Math.max(1, totalCycles - 1));
      const inProgressDays = randInt(1, Math.max(1, periodDays - 1)) + randInt(0, 5);
      createdAt = new Date(
        now - (currentCycle - 1) * gapMs - inProgressDays * DAY,
      );
      cycleStartedAt = new Date(createdAt.getTime() + (currentCycle - 1) * gapMs);
    } else {
      currentCycle = totalCycles;
      createdAt = new Date(
        now - (totalCycles - 1) * gapMs - periodDays * DAY - randInt(10, 90) * DAY,
      );
      cycleStartedAt = new Date(createdAt.getTime() + (totalCycles - 1) * gapMs);
    }

    const circle = await prisma.circle.create({
      data: {
        name: makeCircleName(),
        creatorId: creator.id,
        tier,
        contributionCents,
        frequency,
        memberLimit,
        status,
        inviteCode: `AJO-${String(index + 1).padStart(4, '0')}${String(randInt(10, 99))}`,
        includedNationalities: included,
        excludedNationalities: excluded,
        currentCycle,
        cycleStartedAt,
        createdAt,
      },
    });

    const seededMembers: SeededUser[] = [];
    for (let position = 0; position < ordered.length; position++) {
      const member = ordered[position];
      seededMembers.push(member);
      await prisma.membership.create({
        data: {
          circleId: circle.id,
          userId: member.id,
          turnPosition: position + 1,
        },
      });
    }
    void creatorAt;

    for (const member of seededMembers) {
      const list = membershipsByUser.get(member.id) ?? [];
      list.push({
        id: circle.id,
        name: circle.name,
        status,
        currentCycle,
      });
      membershipsByUser.set(member.id, list);
    }

    if (status === 'open') {
      openCount++;
      continue;
    }

    const potCents = contributionCents * memberLimit;
    const feeCents = Math.round(potCents * FEE_RATE);
    const historyCycles = status === 'completed' ? totalCycles : currentCycle - 1;

    const cycleStart = (cycle: number) =>
      new Date(createdAt.getTime() + (cycle - 1) * gapMs);
    const dueAt = (cycle: number) =>
      new Date(cycleStart(cycle).getTime() + periodDays * DAY);

    for (let cycle = 1; cycle <= historyCycles; cycle++) {
      const start = cycleStart(cycle);
      const due = dueAt(cycle);
      const winner = seededMembers[(cycle - 1) % seededMembers.length];
      const paymentRows = seededMembers.map((member) => {
        const paidAt = new Date(
          Math.min(
            now - 3_600_000,
            start.getTime() + randInt(0, Math.min(3, periodDays - 1)) * DAY + randInt(0, 20) * 3_600_000,
          ),
        );
        return {
          circleId: circle.id,
          cycle,
          userId: member.id,
          amountCents: contributionCents,
          status: 'paid',
          dueAt: due,
          paidAt,
          paypalCaptureId: `SEED-${circle.id}-${cycle}-${member.id}`,
        };
      });
      await prisma.payment.createMany({ data: paymentRows });

      const payoutPaidAt = new Date(
        Math.min(now - 3_600_000, due.getTime() + randInt(0, 1) * DAY),
      );
      await prisma.payout.create({
        data: {
          circleId: circle.id,
          cycle,
          winnerId: winner.id,
          grossCents: potCents,
          feeCents,
          netCents: potCents - feeCents,
          status: 'paid',
          paypalBatchId: `SEED-BATCH-${circle.id}-${cycle}`,
          idempotencyKey: `seed-payout-${circle.id}-${cycle}`,
        },
      });
      void payoutPaidAt;
    }

    if (status === 'active') {
      const start = cycleStart(currentCycle);
      const due = dueAt(currentCycle);
      const unpaidCount = randInt(1, Math.max(1, Math.floor(memberLimit / 2)));
      const unpaid = new Set(shuffle(seededMembers).slice(0, unpaidCount).map((m) => m.id));

      const paymentRows = seededMembers.map((member) => {
        if (unpaid.has(member.id)) {
          return {
            circleId: circle.id,
            cycle: currentCycle,
            userId: member.id,
            amountCents: contributionCents,
            status: due.getTime() < now && chance(0.5) ? 'late' : 'pending',
            dueAt: due,
          };
        }
        const paidAt = new Date(
          Math.min(
            now - 3_600_000,
            start.getTime() + randInt(0, Math.min(3, periodDays - 1)) * DAY,
          ),
        );
        return {
          circleId: circle.id,
          cycle: currentCycle,
          userId: member.id,
          amountCents: contributionCents,
          status: 'paid',
          dueAt: due,
          paidAt,
          paypalCaptureId: `SEED-${circle.id}-${currentCycle}-${member.id}`,
        };
      });
      await prisma.payment.createMany({ data: paymentRows });
    }

    if (status === 'active') activeCount++;
    else completedCount++;
  }

  console.log('Calculating scores and score history...');
  for (const user of users) {
    const circles = membershipsByUser.get(user.id) ?? [];
    const completed = circles.filter((circle) => circle.status === 'completed').length;
    const active = circles.filter((circle) => circle.status === 'active').length;

    const eventCount = Math.min(24, 4 + completed * 3 + active + randInt(0, 5));
    let score = 0;
    const events = [];
    for (let event = 0; event < eventCount; event++) {
      const roll = rand();
      const type: keyof typeof SCORE_POINTS =
        roll < 0.82 ? 'on_time' : roll < 0.92 ? 'recovered' : 'late';
      score = applyPoints(score, type);
      const circle = circles.length > 0 ? pick(circles) : null;
      if (!circle) continue;
      events.push({
        userId: user.id,
        circleId: circle.id,
        type,
        points: SCORE_POINTS[type],
        createdAt: new Date(now - randInt(1, 240) * DAY - randInt(0, 23) * 3_600_000),
      });
    }
    if (events.length > 0) await prisma.scoreEvent.createMany({ data: events });

    let tier = tierFor(score);
    let rank = rankFor(tier, completed);

    // The primary demo login gets full Studio visibility.
    if (user.id === primaryUserId) {
      score = 94;
      tier = 4;
      rank = rankFor(tier, completed) ?? 'Bronze';
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { score, tier, rank },
    });
  }

  console.log('Creating recent notifications...');
  for (const user of users) {
    const circles = membershipsByUser.get(user.id) ?? [];
    if (circles.length === 0) continue;
    const count = randInt(3, 6);
    const rows = [];
    for (let i = 0; i < count; i++) {
      const circle = pick(circles);
      const paidCents = pick(CONTRIBUTIONS);
      const roll = rand();
      const base = { userId: user.id, dedupeKey: `seed-notification:${user.id}:${i}` };
      if (roll < 0.35) {
        rows.push({
          ...base,
          type: 'payment_paid',
          title: 'Contribution received',
          body: `$${(paidCents / 100).toFixed(2)} for ${circle.name} was paid.`,
          url: `/circles/${circle.id}`,
          data: { circleId: circle.id },
        });
      } else if (roll < 0.6) {
        rows.push({
          ...base,
          type: 'cycle_started',
          title: `Cycle ${circle.currentCycle} started`,
          body: `${circle.name} is on cycle ${circle.currentCycle}.`,
          url: `/circles/${circle.id}`,
          data: { circleId: circle.id, cycle: circle.currentCycle },
        });
      } else if (roll < 0.85) {
        rows.push({
          ...base,
          type: 'payout_paid',
          title: 'Payout sent',
          body: `$${(paidCents / 100).toFixed(2)} from ${circle.name} was sent to your account.`,
          url: '/payouts',
          data: { circleId: circle.id },
        });
      } else {
        rows.push({
          ...base,
          type: 'circle_completed',
          title: 'Circle completed',
          body: `${circle.name} finished all of its cycles. Your contribution score has been updated.`,
          url: `/circles/${circle.id}`,
          data: { circleId: circle.id },
        });
      }
    }
    await prisma.notification.createMany({
      data: rows.map((row, i) => ({
        ...row,
        pushStatus: 'skipped',
        readAt: i > 1 ? new Date(now - i * 3_600_000) : null,
        createdAt: new Date(now - i * randInt(2, 30) * 3_600_000),
      })),
    });
  }

  console.log(
    `\nSeeded ${users.length} accounts and 50 circles ` +
      `(${openCount} open, ${activeCount} active, ${completedCount} completed).`,
  );
  console.log('\nSign in with any of these accounts:');
  console.log('  demo-user-01@darjo.example  /  DemoPass123!  (NG, tier 4, recommended)');
  console.log('  demo-user-02@darjo.example  /  DemoPass123!  (IT)');
  console.log('  darjo-pool-01@business.example.com  /  J0nhD03!  (PH business)');
  console.log('  sb-yl7dj53722335@personal.example.com  /  1A+jxpJK  (US sandbox)');
  console.log('\nRun `npm run dev` and open /studio.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
