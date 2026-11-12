'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { friendlyError } from '@/components/forms/errorMessages';
import { inputClass, labelClass } from '@/components/forms/fieldStyles';
import { formatUsd } from '@/components/ui/formatUsd';
import RiskTag from '@/components/ui/RiskTag';
import { getMatches } from '@/lib/api-client';
import type { MatchData } from '@/types/api';

function parseDollarsToCents(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = Number(wholePart);
  const fraction = Number((fractionPart + "00").slice(0, 2));
  return whole * 100 + fraction;
}

type Frequency = 'weekly' | 'monthly';
type Risk = 'safe' | 'risky';
type MatchPanelProps = {
  initialAmount?: string;
  initialFrequency?: Frequency | '';
  initialRisk?: Risk | '';
};

export default function MatchPanel({ initialAmount = '', initialFrequency = '', initialRisk = '' }: MatchPanelProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [frequency, setFrequency] = useState(initialFrequency as Frequency | '');
  const [risk, setRisk] = useState(initialRisk as Risk | '');
  const [result, setResult] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setError(null);
    let contributionCents: number | undefined;
    if (amount.trim()) {
      const parsed = parseDollarsToCents(amount);
      if (!parsed || parsed <= 0) {
        setFormError('Enter a contribution like 50 or 50.00.');
        return;
      }
      contributionCents = parsed;
    }

    setLoading(true);
    const response = await getMatches({
      ...(contributionCents ? { contributionCents } : {}),
      ...(frequency ? { frequency } : {}),
      ...(risk ? { risk } : {}),
    });
    setLoading(false);
    if (!response.ok) {
      setError(friendlyError(response.error.code, response.error.message));
      return;
    }
    setResult(response.data);
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Tell us what fits
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            We only show open circles you are eligible to join. The assistant explains the matches.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Contribution (USD)</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="Any"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>How often</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency | '')}
              className={inputClass}
            >
              <option value="">Any</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Risk</span>
            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value as Risk | '')}
              className={inputClass}
            >
              <option value="">Any</option>
              <option value="safe">Safe</option>
              <option value="risky">Risky</option>
            </select>
          </label>
        </div>

        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {loading ? 'Finding matches...' : 'Find my circle'}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-3">
          <span className="sr-only">Finding matches...</span>
          {[0, 1].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-8 w-full animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : result ? (
        <section className="flex flex-col gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
              Assistant
            </p>
            <p className="mt-2 text-sm text-gray-900">{result.summary}</p>
          </div>

          {result.candidates.length > 0 ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {result.candidates.map((candidate) => {
                const circle = candidate.circle;
                return (
                  <li key={circle.id}>
                    <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">{circle.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatUsd(circle.contributionCents)} · {circle.frequency} ·{' '}
                            {circle.memberCount}/{circle.memberLimit} members
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-900">
                          {candidate.score}% fit
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <RiskTag risk={circle.risk} reason={circle.riskReason} />
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {candidate.seatsLeft} {candidate.seatsLeft === 1 ? 'seat' : 'seats'} left
                        </span>
                      </div>

                      <ul className="flex flex-1 flex-col gap-1 text-sm text-gray-600">
                        {candidate.reasons.map((reason) => (
                          <li key={reason}>· {reason}</li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={candidate.joinPath}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
                        >
                          Join circle
                        </Link>
                        <Link
                          href={`/circles/${circle.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#003087] px-4 text-sm font-medium text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {result.createSuggestion ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold">Nothing fits yet? Create one</h3>
              <p className="text-sm text-gray-600">{result.createSuggestion.reason}</p>
              <p className="text-sm">
                Suggested: <strong>{result.createSuggestion.name}</strong> ·{' '}
                {formatUsd(result.createSuggestion.contributionCents)} {result.createSuggestion.frequency} ·{' '}
                {result.createSuggestion.memberLimit} members
              </p>
              <Link
                href={`/circles/new?${new URLSearchParams({
                  name: result.createSuggestion.name,
                  amount: (result.createSuggestion.contributionCents / 100).toFixed(2),
                  frequency: result.createSuggestion.frequency,
                  members: String(result.createSuggestion.memberLimit),
                }).toString()}`}
                className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
              >
                Create this circle
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
