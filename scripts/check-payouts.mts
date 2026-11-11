import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const circle = await db.circle.findUnique({
    where: { id: 'cmw982ua60003tylclnkrw6rd' },
    include: {
      memberships: { include: { user: true }, orderBy: { turnPosition: 'asc' } },
      payouts: true,
      payments: true,
    },
  });
  if (!circle) {
    console.log('Circle not found');
    await db.$disconnect();
    return;
  }
  console.log(`Circle: ${circle.id} ${circle.name}`);
  console.log(`  status=${circle.status} memberLimit=${circle.memberLimit} currentCycle=${circle.currentCycle}`);
  console.log(`  contributionCents=${circle.contributionCents} frequency=${circle.frequency}`);
  console.log('');
  console.log('Members:');
  for (const m of circle.memberships) {
    console.log(`  ${m.turnPosition}: ${m.userId} ${m.user.name} (${m.user.email})`);
  }
  console.log('');
  console.log('Payouts:');
  for (const p of circle.payouts) {
    console.log(`  cycle=${p.cycle} winnerId=${p.winnerId} gross=${p.grossCents} fee=${p.feeCents} net=${p.netCents} status=${p.status} idempotencyKey=${p.idempotencyKey}`);
  }
  console.log('');
  console.log('Payments:');
  for (const p of circle.payments) {
    console.log(`  cycle=${p.cycle} userId=${p.userId} amount=${p.amountCents} status=${p.status}`);
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
