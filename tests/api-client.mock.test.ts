import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ApiClient = typeof import('@/lib/api-client');

async function loadClient(useMocks: boolean): Promise<ApiClient> {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_USE_MOCKS', useMocks ? 'true' : 'false');
  return import('@/lib/api-client');
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('mock mode', () => {
  it('returns the mock user for getMe, signup and login', async () => {
    const client = await loadClient(true);

    const me = await client.getMe();
    expect(me).toEqual({
      ok: true,
      data: { user: { id: 'u1', name: 'Ada', email: 'ada@example.com', nationality: 'US', currency: 'USD', tier: 2, rank: null, score: 38 } },
    });

    const signedUp = await client.signup({ name: 'Ada', email: 'ada@example.com', password: 'secret123', nationality: 'US' });
    expect(signedUp.ok).toBe(true);

    const loggedIn = await client.login({ email: 'ada@example.com', password: 'secret123' });
    expect(loggedIn.ok).toBe(true);
  });

  it('lists both mock circles and filters by risk', async () => {
    const client = await loadClient(true);

    const all = await client.listCircles();
    expect(all.ok).toBe(true);
    if (!all.ok) return;
    expect(all.data.circles.map((c) => c.name)).toEqual(['Weekend Savers', 'Starter Circle']);

    const safe = await client.listCircles({ risk: 'safe' });
    if (!safe.ok) throw new Error('expected safe circles');
    expect(safe.data.circles.map((c) => c.id)).toEqual(['c1']);
    expect(safe.data.circles.every((c) => c.risk === 'safe')).toBe(true);

    const risky = await client.listCircles({ risk: 'risky' });
    if (!risky.ok) throw new Error('expected risky circles');
    expect(risky.data.circles.map((c) => c.id)).toEqual(['c2']);
    expect(risky.data.circles.every((c) => c.risk === 'risky')).toBe(true);
  });

  it('returns the paid member view for the default circle', async () => {
    const client = await loadClient(true);

    const detail = await client.getCircle('c1');
    if (!detail.ok) throw new Error('expected circle detail');
    const circle = detail.data.circle;
    expect(circle.id).toBe('c1');
    expect(circle.viewerPaidThisCycle).toBe(true);
    expect(circle.viewerIsCurrentWinner).toBe(true);
    expect(circle.members.every((m) => m.currentCycleStatus === 'paid')).toBe(true);
    expect(circle.payout?.status).toBe('prepared');
  });

  it('returns a non-member view for circle c3', async () => {
    const client = await loadClient(true);

    const detail = await client.getCircle('c3');
    if (!detail.ok) throw new Error('expected circle detail');
    const circle = detail.data.circle;
    expect(circle.id).toBe('c3');
    expect(circle.viewerPaidThisCycle).toBe(false);
    expect(circle.viewerIsCurrentWinner).toBe(false);
    expect(circle.currentWinnerId).toBeNull();
    expect(circle.payout).toBeNull();
    expect(circle.members.some((m) => m.userId === 'u1')).toBe(false);
  });

  it('returns an unpaid member view for circle c4', async () => {
    const client = await loadClient(true);

    const detail = await client.getCircle('c4');
    if (!detail.ok) throw new Error('expected circle detail');
    const circle = detail.data.circle;
    expect(circle.id).toBe('c4');
    expect(circle.viewerPaidThisCycle).toBe(false);
    expect(circle.viewerIsCurrentWinner).toBe(false);
    expect(circle.paidThisCycleCents).toBe(15000);
    expect(circle.members.filter((m) => m.currentCycleStatus === 'pending')).toHaveLength(1);
  });

  it('keeps the default detail for unknown circle ids', async () => {
    const client = await loadClient(true);

    const detail = await client.getCircle('anything-else');
    if (!detail.ok) throw new Error('expected circle detail');
    expect(detail.data.circle.id).toBe('c1');
  });

  it('returns the mock profile, chat, payment and payout shapes', async () => {
    const client = await loadClient(true);

    const profile = await client.getProfile();
    if (!profile.ok) throw new Error('expected profile');
    expect(profile.data.user.email).toBe('ada@example.com');
    expect(profile.data.events).toHaveLength(2);
    expect(profile.data.circles[0].id).toBe('c1');

    const chat = await client.chatWithAgent({ message: 'who is late?' });
    if (!chat.ok) throw new Error('expected chat');
    expect(chat.data.reply).toContain('nudge');
    expect(chat.data.actions[0].type).toBe('nudge_drafted');

    const started = await client.startPayment('c1');
    if (!started.ok) throw new Error('expected order');
    expect(started.data).toEqual({ orderId: 'MOCK-ORDER-1', amountCents: 10000, currency: 'USD' });

    const captured = await client.capturePayment('c1', 'MOCK-ORDER-1');
    if (!captured.ok) throw new Error('expected payment');
    expect(captured.data.payment.status).toBe('paid');

    const released = await client.releasePayout('c1');
    if (!released.ok) throw new Error('expected payout');
    expect(released.data.payout.status).toBe('released');
  });
});

describe('real mode', () => {
  it('fails loudly when called during a server render', async () => {
    const client = await loadClient(false);

    await expect(client.getMe()).rejects.toThrow(/client-only/);
  });

  it('calls the API with credentials and returns the parsed result', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { user: { id: 'x' } } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', fetchMock);
    const client = await loadClient(false);

    const result = await client.getMe();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/api/me');
    expect(init.credentials).toBe('same-origin');
    expect(result.ok).toBe(true);
  });

  it('reports a network error instead of throwing', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const client = await loadClient(false);

    const result = await client.getMe();

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK', message: 'Could not reach the server' } });
  });
});
