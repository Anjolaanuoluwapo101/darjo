'use client';

import { useId, useState, type FormEvent } from 'react';
import {
  errorClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from '@/components/forms/fieldStyles';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'circles', label: 'Circles and invites' },
  { value: 'payments', label: 'Payments and payouts' },
  { value: 'safety', label: 'Safety or account issue' },
  { value: 'other', label: 'Something else' },
];

type Errors = {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  consent?: string;
};

type Result =
  | { kind: 'success'; delivered: boolean }
  | { kind: 'error'; message: string }
  | null;

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<Result>(null);
  const [submitting, setSubmitting] = useState(false);

  const messageId = useId();
  const topicId = useId();
  const consentId = useId();

  function validate(): boolean {
    const next: Errors = {};

    if (name.trim().length < 2) next.name = 'Please enter your name.';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Please enter a valid email address.';
    }

    if (!TOPICS.some((item) => item.value === topic)) {
      next.topic = 'Please choose a topic.';
    }

    if (message.trim().length < 20) {
      next.message = 'Please write at least 20 characters so we can help.';
    }

    if (message.trim().length > 2000) {
      next.message = 'Please keep the message under 2,000 characters.';
    }

    if (!consent) {
      next.consent = 'Please confirm that we can reply to your email.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          consent,
          website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { delivered: boolean } }
        | { ok: false; error: { message: string } }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        setResult({
          kind: 'error',
          message:
            payload && !payload.ok
              ? payload.error.message
              : 'We could not send your message. Please try again.',
        });
        return;
      }

      setResult({ kind: 'success', delivered: payload.data.delivered });
      setName('');
      setEmail('');
      setTopic('general');
      setMessage('');
      setConsent(false);
      setErrors({});
    } catch {
      setResult({
        kind: 'error',
        message: 'We could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.kind === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <Notice
          variant={result.delivered ? 'success' : 'info'}
          title={result.delivered ? 'Message sent' : 'Form preview complete'}
        >
          {result.delivered
            ? 'Thanks for reaching out. We will reply to the email address you provided.'
            : 'Your message passed validation, but this demo is not connected to an inbox yet, so nothing was delivered.'}
        </Notice>
        <Button type="button" variant="outline" onClick={() => setResult(null)}>
          Write another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {result?.kind === 'error' ? (
        <Notice variant="error" title="Could not send your message">
          {result.message}
        </Notice>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
            }}
            aria-invalid={errors.name ? true : undefined}
            className={`${inputClass} ${errors.name ? inputErrorClass : inputNormalClass}`}
            placeholder="Amara K."
          />
          {errors.name ? <p className={errorClass}>{errors.name}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className={labelClass}>
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
            }}
            aria-invalid={errors.email ? true : undefined}
            className={`${inputClass} ${errors.email ? inputErrorClass : inputNormalClass}`}
            placeholder="you@example.com"
          />
          {errors.email ? <p className={errorClass}>{errors.email}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={topicId} className={labelClass}>
          Topic
        </label>
        <select
          id={topicId}
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={`${inputClass} ${errors.topic ? inputErrorClass : inputNormalClass}`}
        >
          {TOPICS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {errors.topic ? <p className={errorClass}>{errors.topic}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={messageId} className={labelClass}>
          How can we help?
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={6}
          maxLength={2000}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (errors.message) setErrors((current) => ({ ...current, message: undefined }));
          }}
          aria-invalid={errors.message ? true : undefined}
          className={`${inputClass} min-h-32 py-3 ${errors.message ? inputErrorClass : inputNormalClass}`}
          placeholder="Tell us what is going on. Do not include passwords or full payment details."
        />
        <div className="flex items-center justify-between gap-3">
          {errors.message ? (
            <p className={errorClass}>{errors.message}</p>
          ) : (
            <p className="text-sm text-muted">At least 20 characters.</p>
          )}
          <span className="text-xs text-muted-soft">{message.length}/2000</span>
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor={consentId} className="flex items-start gap-3 text-sm text-muted">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (errors.consent) {
                setErrors((current) => ({ ...current, consent: undefined }));
              }
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          />
          <span>You can reply to me at this email address.</span>
        </label>
        {errors.consent ? <p className={`mt-1.5 ${errorClass}`}>{errors.consent}</p> : null}
      </div>

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {submitting ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}
