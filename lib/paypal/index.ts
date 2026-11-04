// Thin PayPal REST helpers (server only). Only Anjola edits this folder.
const BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export class PayPalError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`PayPal request failed (${status})`);
  }
}

let cached: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json();
  if (!res.ok) throw new PayPalError(res.status, json);
  cached = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

export async function paypal<T>(
  path: string, init: { method?: string; body?: unknown; requestId?: string } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
      ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError(res.status, json);
  return json as T;
}

// Integer cents -> '100.00' (no floating point)
export const centsToValue = (cents: number) =>
  `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;

export async function createOrder(p: {
  amountCents: number; customId: string; description: string; requestId: string;
}): Promise<string> {
  const order = await paypal<{ id: string }>('/v2/checkout/orders', {
    method: 'POST', requestId: p.requestId,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: centsToValue(p.amountCents) },
        custom_id: p.customId, description: p.description,
      }],
    },
  });
  return order.id;
}

interface CaptureResponse {
  status: string;
  purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[];
}
export async function captureOrder(orderId: string) {
  const r = await paypal<CaptureResponse>(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST', requestId: `capture-${orderId}`, body: {},
  });
  const capture = r.purchase_units?.[0]?.payments?.captures?.[0];
  return { status: capture?.status ?? r.status, captureId: capture?.id ?? null };
}

// Ask PayPal whether a webhook call is genuine
export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error('PAYPAL_WEBHOOK_ID is not set');

  const authAlgo = headers.get('paypal-auth-algo');
  const certUrl = headers.get('paypal-cert-url');
  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionSig = headers.get('paypal-transmission-sig');
  const transmissionTime = headers.get('paypal-transmission-time');

  // Not a PayPal call at all (or a stripped proxy) — treat as unsigned, not a server error.
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime)
    return false;

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const r = await paypal<{ verification_status: string }>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    },
  });
  return r.verification_status === 'SUCCESS';
}
