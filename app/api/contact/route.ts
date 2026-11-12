import { fail, ok } from '@/lib/server';

const TOPICS = new Set(['general', 'circles', 'payments', 'safety', 'other']);

type ContactBody = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
  consent?: unknown;
  website?: unknown;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return fail('VALIDATION', 'We could not read that request.', 400);
  }

  if (clean(body.website)) {
    return ok({ delivered: false });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const topic = clean(body.topic);
  const message = clean(body.message);
  const consent = body.consent === true;

  if (name.length < 2 || name.length > 80) {
    return fail('VALIDATION', 'Please enter your name.', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return fail('VALIDATION', 'Please enter a valid email address.', 400);
  }

  if (!TOPICS.has(topic)) {
    return fail('VALIDATION', 'Please choose a topic.', 400);
  }

  if (message.length < 20 || message.length > 2000) {
    return fail('VALIDATION', 'Please write a message between 20 and 2,000 characters.', 400);
  }

  if (!consent) {
    return fail('VALIDATION', 'Please confirm that we can reply to your email.', 400);
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;

  if (!webhook) {
    return ok({ delivered: false });
  }

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, topic, message, source: 'darjo-contact' }),
    });

    if (!response.ok) {
      return fail('CONTACT_UNAVAILABLE', 'We could not send your message. Please try again.', 502);
    }
  } catch {
    return fail('CONTACT_UNAVAILABLE', 'We could not send your message. Please try again.', 502);
  }

  return ok({ delivered: true });
}
