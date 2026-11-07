#!/usr/bin/env node
// Smoke test for the real API (not the mocks).
// Covers: non-member visibility, the 404 branch, joining, unpaid, late,
// failed and paid contribution states.
//
//   node scripts/smoke-api.mjs                 starts next dev on port 3100
//   node scripts/smoke-api.mjs --port=3200    uses another port
//   node scripts/smoke-api.mjs --base=http://localhost:3000   uses a running server
//   node scripts/smoke-api.mjs --skip-db      skips the direct database probes
//
// Rows are kept on purpose. The circles created by the run are set to
// "completed" at the end so they stay out of Studio and join lists.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const PORT = flag('port') ?? '3100';
const BASE = (flag('base') ?? `http://127.0.0.1:${PORT}`).replace(/\/+$/, '');
const SPAWN_SERVER = !flag('base');
const SKIP_DB = process.argv.includes('--skip-db');
const PASSWORD = 'secret123';

class SkipError extends Error {}

const results = [];
let server;
const created = { users: [], circles: [] };

async function step(name, fn) {
  try {
    await fn();
    results.push(['ok', name]);
    console.log(`ok    ${name}`);
  } catch (err) {
    if (err instanceof SkipError) {
      results.push(['skip', name]);
      console.log(`skip  ${name} (${err.message})`);
      return;
    }
    results.push(['not ok', name]);
    console.log(`FAIL  ${name}\n      ${err.message}`);
    throw err;
  }
}

function newSession() {
  return { cookie: '' };
}

async function request(session, method, path, body) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (session?.cookie) headers.cookie = session.cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (setCookies.length && session) {
    session.cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function startServer() {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', PORT], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_USE_MOCKS: 'false', DEMO_TOOLS: 'true' },
  });
  for (let i = 0; i < 180; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/me`);
      if (res.status) return;
    } catch {
      /* server not up yet */
    }
    await sleep(500);
  }
  throw new Error(`dev server did not come up on ${BASE}`);
}

async function stopServer() {
  if (!server?.pid) return;
  await new Promise((resolve) => {
    const killer = spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    killer.on('exit', resolve);
    killer.on('error', () => {
      try {
        server.kill();
      } catch {
        /* already gone */
      }
      resolve();
    });
  });
}

async function signup(session, name, email, nationality) {
  const res = await request(session, 'POST', '/api/auth/signup', {
    name,
    email,
    password: PASSWORD,
    nationality,
  });
  assert.equal(res.status, 200, `signup failed for ${email}: ${res.text}`);
  assert.ok(res.json?.data?.user?.id, `signup returned no user id for ${email}`);
  created.users.push({ id: res.json.data.user.id, email });
  return res.json.data.user;
}

async function main() {
  const stamp = Date.now();
  const email = (who) => `smoke+${stamp}-${who}@darjo.test`;
  const circleName = `Smoke Circle ${stamp}`;
  const sessionA = newSession();
  const sessionB = newSession();
  const sessionC = newSession();
  let userA;
  let userB;
  let circle1;
  let circle2;

  await step('anonymous /api/me is rejected', async () => {
    const res = await request(newSession(), 'GET', '/api/me');
    assert.equal(res.status, 401);
    assert.equal(res.json?.error?.code, 'UNAUTHENTICATED');
  });

  await step('three users sign up and get a session', async () => {
    userA = await signup(sessionA, 'Smoke A', email('a'), 'US');
    userB = await signup(sessionB, 'Smoke B', email('b'), 'US');
    await signup(sessionC, 'Smoke C', email('c'), 'GB');
    assert.ok(sessionA.cookie.includes('darjo_session'));
    const me = await request(sessionA, 'GET', '/api/me');
    assert.equal(me.status, 200);
    assert.equal(me.json?.data?.user?.id, userA.id);
  });

  await step('owner creates an open circle with one member', async () => {
    const res = await request(sessionA, 'POST', '/api/circles', {
      name: circleName,
      contributionCents: 1000,
      memberLimit: 2,
      frequency: 'monthly',
      includedNationalities: [],
      excludedNationalities: [],
    });
    assert.equal(res.status, 200, res.text);
    const circle = res.json.data.circle;
    created.circles.push(circle.id);
    circle1 = circle;
    assert.equal(circle.status, 'open');
    assert.equal(circle.memberCount, 1);
    assert.equal(circle.potCents, 2000);
    assert.equal(circle.viewerPaidThisCycle, false);
    assert.equal(circle.members.length, 1);
    assert.equal(circle.members[0].currentCycleStatus, 'pending');
  });

  await step('non-member can open the circle but is not in it', async () => {
    const res = await request(sessionB, 'GET', `/api/circles/${circle1.id}`);
    assert.equal(res.status, 200, res.text);
    const circle = res.json.data.circle;
    assert.equal(circle.memberCount, 1);
    assert.equal(circle.members.some((m) => m.userId === userA.id), true);
    assert.equal(circle.members.some((m) => m.userId === userB.id), false);
    assert.equal(circle.viewerPaidThisCycle, false);
    assert.equal(circle.viewerIsCurrentWinner, false);
    assert.equal(circle.currentWinnerId, null);
  });

  await step('studio hides a circle you are in', async () => {
    const res = await request(sessionA, 'GET', '/api/circles');
    assert.equal(res.status, 200, res.text);
    assert.equal(res.json.data.circles.some((c) => c.id === circle1.id), false);
  });

  await step('studio shows an open circle to another member', async () => {
    const res = await request(sessionB, 'GET', '/api/circles');
    assert.equal(res.status, 200, res.text);
    assert.equal(res.json.data.circles.some((c) => c.id === circle1.id), true);
  });

  await step('a circle that excludes your nationality is hidden', async () => {
    const createdRes = await request(sessionC, 'POST', '/api/circles', {
      name: `${circleName} (excludes US)`,
      contributionCents: 1000,
      memberLimit: 2,
      frequency: 'monthly',
      includedNationalities: [],
      excludedNationalities: ['US'],
    });
    assert.equal(createdRes.status, 200, createdRes.text);
    circle2 = createdRes.json.data.circle;
    created.circles.push(circle2.id);

    const detail = await request(sessionB, 'GET', `/api/circles/${circle2.id}`);
    assert.equal(detail.status, 404);
    assert.equal(detail.json?.error?.code, 'NOT_FOUND');

    const list = await request(sessionB, 'GET', '/api/circles');
    assert.equal(list.json.data.circles.some((c) => c.id === circle2.id), false);
  });

  await step('joining the last seat activates the circle with unpaid contributions', async () => {
    const res = await request(sessionB, 'POST', '/api/circles/join', { inviteCode: circle1.inviteCode });
    assert.equal(res.status, 200, res.text);
    const circle = res.json.data.circle;
    assert.equal(circle.status, 'active');
    assert.equal(circle.memberCount, 2);
    assert.equal(circle.potCents, 2000);
    assert.equal(circle.paidThisCycleCents, 0);
    assert.equal(circle.viewerPaidThisCycle, false);
    assert.equal(circle.viewerIsCurrentWinner, false);
    assert.equal(circle.currentWinnerId, userA.id);
    assert.equal(circle.members.every((m) => m.currentCycleStatus === 'pending'), true);

    const ownerView = await request(sessionA, 'GET', `/api/circles/${circle1.id}`);
    assert.equal(ownerView.json.data.circle.viewerIsCurrentWinner, true);
  });

  await step('a circle you joined is hidden from studio', async () => {
    const res = await request(sessionB, 'GET', '/api/circles');
    assert.equal(res.status, 200, res.text);
    assert.equal(res.json.data.circles.some((c) => c.id === circle1.id), false);
  });

  await step('joining twice is rejected', async () => {
    const res = await request(sessionB, 'POST', '/api/circles/join', { inviteCode: circle1.inviteCode });
    assert.equal(res.status, 403);
    assert.equal(res.json?.error?.code, 'ALREADY_MEMBER');
  });

  await step('a missed contribution shows as late', async () => {
    const res = await request(sessionA, 'POST', '/api/dev/mark-late', {
      circleId: circle1.id,
      userId: userB.id,
    });
    if (res.status === 404) {
      throw new SkipError('DEMO_TOOLS is off, so /api/dev/mark-late is unavailable');
    }
    assert.equal(res.status, 200, res.text);
    assert.equal(res.json?.data?.payment?.status, 'late');

    const view = await request(sessionA, 'GET', `/api/circles/${circle1.id}`);
    const lateMember = view.json.data.circle.members.find((m) => m.userId === userB.id);
    assert.equal(lateMember.currentCycleStatus, 'late');
  });

  if (SKIP_DB) {
    results.push(['skip', 'database probes for failed and paid contributions']);
    console.log('skip  database probes for failed and paid contributions (--skip-db)');
  } else {
    await step('a failed contribution shows as failed', async () => {
      const prisma = new PrismaClient();
      try {
        const cycle = (await request(sessionA, 'GET', `/api/circles/${circle1.id}`)).json.data.circle.currentCycle;
        await prisma.payment.update({
          where: { circleId_cycle_userId: { circleId: circle1.id, cycle, userId: userB.id } },
          data: { status: 'failed' },
        });
        const view = await request(sessionA, 'GET', `/api/circles/${circle1.id}`);
        const member = view.json.data.circle.members.find((m) => m.userId === userB.id);
        assert.equal(member.currentCycleStatus, 'failed');
      } finally {
        await prisma.$disconnect();
      }
    });

    await step('a paid contribution counts towards the cycle pot', async () => {
      const prisma = new PrismaClient();
      try {
        const cycle = (await request(sessionA, 'GET', `/api/circles/${circle1.id}`)).json.data.circle.currentCycle;
        await prisma.payment.update({
          where: { circleId_cycle_userId: { circleId: circle1.id, cycle, userId: userA.id } },
          data: { status: 'paid', paidAt: new Date() },
        });
        const view = await request(sessionA, 'GET', `/api/circles/${circle1.id}`);
        const circle = view.json.data.circle;
        assert.equal(circle.paidThisCycleCents, 1000);
        assert.equal(circle.viewerPaidThisCycle, true);
        assert.equal(circle.members.find((m) => m.userId === userA.id).currentCycleStatus, 'paid');

        const other = await request(sessionB, 'GET', `/api/circles/${circle1.id}`);
        assert.equal(other.json.data.circle.viewerPaidThisCycle, false);
      } finally {
        await prisma.$disconnect();
      }
    });
  }
}

async function cleanup() {
  if (SKIP_DB || !created.circles.length) return;
  const prisma = new PrismaClient();
  try {
    await prisma.circle.updateMany({
      where: { id: { in: created.circles } },
      data: { status: 'completed' },
    });
    console.log(`\nkept ${created.users.length} users and ${created.circles.length} circles (circles marked completed)`);
  } catch (err) {
    console.log(`\ncould not mark the test circles as completed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

let exitCode = 0;
try {
  if (SPAWN_SERVER) await startServer();
  await main();
} catch {
  exitCode = 1;
} finally {
  await cleanup();
  if (SPAWN_SERVER) await stopServer();
}

const failed = results.filter(([state]) => state === 'not ok').length;
const skipped = results.filter(([state]) => state === 'skip').length;
console.log(`\n${results.length - failed - skipped} passed, ${failed} failed, ${skipped} skipped`);
if (created.users.length) console.log(`test users: ${created.users.map((u) => u.email).join(', ')}`);
process.exit(exitCode);
