// Backfill legacy Payout rows for completed circles that never had them.
// Determines each cycle's winner via Membership.turnPosition rotation:
//   cycle 1 → turnPosition 1, cycle 2 → turnPosition 2, ...
//
// Run it with: `npm run backfill-payouts`
//
// Safe to run multiple times: skips cycles that already have a Payout row.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';

// Node does not read .env files for us, so we do it here.
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    let raw: string;
    try {
      raw = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', file), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
      }
    }
  }
}
loadEnv();

const db = new PrismaClient();

async function main() {
  // Find completed circles that have zero Payout rows across all cycles.
  const completedCircles = await db.circle.findMany({
    where: { status: 'completed' },
    include: {
      memberships: { include: { user: true }, orderBy: { turnPosition: 'asc' } },
      payouts: true,
    },
  });

  let circlesBackfilled = 0;
  let payoutsCreated = 0;
  let cyclesSkipped = 0;

  for (const circle of completedCircles) {
    if (circle.payouts.length > 0) continue; // already has payouts, skip

    const membersByPosition = new Map(
      circle.memberships.map((m) => [m.turnPosition, m]),
    );

    for (let cycle = 1; cycle <= circle.memberLimit; cycle++) {
      const winner = membersByPosition.get(cycle);
      if (!winner) {
        cyclesSkipped++;
        continue;
      }

      const grossCents = circle.contributionCents * circle.memberLimit;
      await db.payout.create({
        data: {
          circleId: circle.id,
          cycle,
          winnerId: winner.userId,
          grossCents,
          feeCents: 0,
          netCents: grossCents,
          status: 'paid',
          idempotencyKey: `legacy-${circle.id}-${cycle}`,
          paypalBatchId: null,
        },
      });
      payoutsCreated++;
    }

    circlesBackfilled++;
    console.log(
      `Backfilled circle "${circle.name}" (${circle.id}): ${circle.memberLimit} cycles → winner by turnPosition`,
    );
  }

  console.log(
    `\nDone. Circles backfilled: ${circlesBackfilled}, payout rows created: ${payoutsCreated}, cycles skipped (no matching membership): ${cyclesSkipped}`,
  );

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
