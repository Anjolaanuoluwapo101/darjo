import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const circles = await db.circle.findMany({
    include: { memberships: { include: { user: true } }, payouts: true },
  });
  console.log('Total circles:', circles.length);
  for (const c of circles) {
    console.log(
      `Circle: ${c.id} ${c.name} status=${c.status} memberLimit=${c.memberLimit} currentCycle=${c.currentCycle} payouts=${c.payouts.length} members=${c.memberships.length}`,
    );
    for (const m of c.memberships) {
      console.log(`  member: ${m.userId} turnPosition=${m.turnPosition}`);
    }
    for (const p of c.payouts) {
      console.log(`  payout: ${p.id} cycle=${p.cycle} winnerId=${p.winnerId} status=${p.status}`);
    }
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
