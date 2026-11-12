'use client';

import { useState, type FormEvent } from 'react';
import { friendlyError } from '@/components/forms/errorMessages';
import { inputClass, inputNormalClass, labelClass } from '@/components/forms/fieldStyles';
import { cn } from '@/components/ui/cn';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LinkButton from '@/components/ui/LinkButton';
import Notice from '@/components/ui/Notice';
import RiskTag from '@/components/ui/RiskTag';
import Skeleton from '@/components/ui/Skeleton';
import { formatUsd } from '@/components/ui/formatUsd';
import { getMatches } from '@/lib/api-client';
import type { MatchData } from '@/types/api';

function parseDollarsToCents(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [wholePart, fractionPart = ''] = value.split('.');
  const whole = Number(wholePart);
  const fraction = Number((fractionPart + '00').slice(0, 2));
  return whole * 100 + fraction;
}

type Frequency = 'weekly' | 'monthly';
type Risk = 'safe' | 'risky';
type MatchPanelProps = {
  initialAmount?: string;
  initialFrequency?: Frequency | '';
  initialRisk?: Risk | '';
};

export default function MatchPanel({
  initialAmount = '',
  initialFrequency = '',
  initialRisk = '',
}: MatchPanelProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [frequency, setFrequency] = useState<Frequency | ''>(initialFrequency);
  const [risk, setRisk] = useState<Risk | ''>(initialRisk);
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
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Tell us what fits
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              We only show open circles you are eligible to join. The assistant
              explains the matches.
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
                className={cn(inputClass, inputNormalClass)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>How often</span>
              <select
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as Frequency | '')
                }
                className={cn(inputClass, inputNormalClass)}
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
                className={cn(inputClass, inputNormalClass)}
              >
                <option value="">Any</option>
                <option value="safe">Safe</option>
                <option value="risky">Risky</option>
              </select>
            </label>
          </div>

          {formError ? <Notice variant="error">{formError}</Notice> : null}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full sm:w-auto sm:self-start"
          >
            {loading ? 'Finding matches...' : 'Find my circle'}
          </Button>
        </form>
      </Card>

      {error ? <Notice variant="error">{error}</Notice> : null}

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-3">
          <span className="sr-only">Finding matches...</span>
          {[0, 1].map((item) => (
            <Card key={item}>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : result ? (
        <section className="flex flex-col gap-3">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Assistant
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {result.summary}
            </p>
          </Card>

          {result.candidates.length > 0 ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {result.candidates.map((candidate) => {
                const circle = candidate.circle;
                return (
                  <li key={circle.id}>
                    <Card className="flex h-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
                            {circle.name}
                          </h3>
                          <p className="text-sm text-muted">
                            {formatUsd(circle.contributionCents)} ·{' '}
                            {circle.frequency} · {circle.memberCount}/
                            {circle.memberLimit} members
                          </p>
                        </div>
                        <Badge variant="brand">{candidate.score}% fit</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <RiskTag risk={circle.risk} reason={circle.riskReason} />
                        <Badge variant="neutral">
                          {candidate.seatsLeft}{' '}
                          {candidate.seatsLeft === 1 ? 'seat' : 'seats'} left
                        </Badge>
                      </div>

                      <ul className="flex flex-1 flex-col gap-1 text-sm text-muted">
                        {candidate.reasons.map((reason) => (
                          <li key={reason} className="flex gap-1.5">
                            <span aria-hidden="true">·</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        <LinkButton href={candidate.joinPath} size="sm">
                          Join circle
                        </LinkButton>
                        <LinkButton
                          href={`/circles/${circle.id}`}
                          variant="outline"
                          size="sm"
                        >
                          View details
                        </LinkButton>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {result.createSuggestion ? (
            <Card className="flex flex-col gap-3">
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Nothing fits yet? Create one
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {result.createSuggestion.reason}
              </p>
              <p className="text-sm text-ink">
                Suggested:{' '}
                <strong className="font-semibold">
                  {result.createSuggestion.name}
                </strong>{' '}
                · {formatUsd(result.createSuggestion.contributionCents)}{' '}
                {result.createSuggestion.frequency} ·{' '}
                {result.createSuggestion.memberLimit} members
              </p>
              <LinkButton
                href={`/circles/new?${new URLSearchParams({
                  name: result.createSuggestion.name,
                  amount: (result.createSuggestion.contributionCents / 100).toFixed(2),
                  frequency: result.createSuggestion.frequency,
                  members: String(result.createSuggestion.memberLimit),
                }).toString()}`}
                size="sm"
                className="self-start"
              >
                Create this circle
              </LinkButton>
            </Card>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
