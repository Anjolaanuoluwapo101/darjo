'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { friendlyError } from '@/components/forms/errorMessages';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ScoreRing from '@/components/profile/ScoreRing';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import InfoNote from '@/components/ui/InfoNote';
import LinkButton from '@/components/ui/LinkButton';
import Notice from '@/components/ui/Notice';
import Section from '@/components/ui/Section';
import Skeleton from '@/components/ui/Skeleton';
import TierBadge from '@/components/ui/TierBadge';
import { getProfile, getVolatility, type VolatilityReading } from '@/lib/api-client';
import type { ProfileData } from '@/types/api';

const VOLATILITY_TEXT: Record<VolatilityReading['label'], string> = {
  low: 'Your currency is steady against the US dollar, so your payments hold their value.',
  medium:
    'Your currency moves a little against the US dollar, so the real cost can change.',
  high: 'Your currency swings against the US dollar, so payments can cost you more than you expect.',
};

const VOLATILITY_VARIANT: Record<
  VolatilityReading['label'],
  'safe' | 'risky' | 'error'
> = {
  low: 'safe',
  medium: 'risky',
  high: 'error',
};

const EVENT_TEXT: Record<ProfileData['events'][number]['type'], string> = {
  on_time: 'Paid on time',
  recovered: 'Caught up after being late',
  late: 'Paid late',
  failed: 'Missed a payment',
};

const CIRCLE_STATUS: Record<ProfileData['circles'][number]['status'], string> = {
  open: 'Open',
  active: 'Active',
  completed: 'Completed',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [volatility, setVolatility] = useState<VolatilityReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await getProfile();
      if (!active) return;

      if (!result.ok) {
        if (result.error.code === 'UNAUTHENTICATED') {
          router.replace('/login');
          return;
        }
        setError(friendlyError(result.error.code, result.error.message));
        setLoading(false);
        return;
      }

      setProfile(result.data);
      setLoading(false);

      // The volatility reading is a nice-to-have, so a failure here must not
      // take the whole page down.
      const reading = await getVolatility(result.data.user.currency);
      if (active && reading.ok) setVolatility(reading.data);
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Profile"
          title={profile?.user.name ?? 'Your profile'}
          description={
            profile
              ? `${profile.user.currency} · ${profile.user.nationality}`
              : undefined
          }
          action={
            profile ? (
              <TierBadge tier={profile.user.tier} rank={profile.user.rank} />
            ) : undefined
          }
        />

        <InfoNote>
          Your score is a record of behaviour inside D&apos;arjo circles. It is
          not a credit score, and it does not predict whether a circle will pay.
        </InfoNote>

        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="flex flex-col items-start gap-4">
            <Notice
              variant="error"
              title="Could not load your profile"
              className="w-full"
            >
              {error}
            </Notice>
            <Button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          </div>
        ) : profile ? (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col items-center gap-4 p-6">
                <ScoreRing score={profile.user.score} />
                <p className="text-center text-sm leading-relaxed text-muted">
                  {profile.nextTier.requirement}
                </p>
              </Card>

              {volatility ? (
                <Card className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                      {volatility.currency} risk
                    </h2>
                    <Badge variant={VOLATILITY_VARIANT[volatility.label]} dot>
                      {volatility.label} volatility
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    {VOLATILITY_TEXT[volatility.label]}
                  </p>
                  <p className="text-xs text-muted-soft">
                    {volatility.source === 'live'
                      ? 'Live reading from the market'
                      : 'Our own reference table'}
                  </p>
                </Card>
              ) : null}
            </div>

            <div className="flex flex-col gap-6">
              <Section title="Your circles">
                {profile.circles.length === 0 ? (
                  <EmptyState
                    title="No circles yet"
                    description="Join a circle to start building your score."
                    action={
                      <LinkButton href="/studio" variant="outline" size="sm">
                        Find one in the Studio
                      </LinkButton>
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {profile.circles.map((circle) => (
                      <li key={circle.id}>
                        <Link
                          href={`/circles/${circle.id}`}
                          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
                        >
                          <span className="min-w-0 truncate font-medium text-ink">
                            {circle.name}
                          </span>
                          <span className="shrink-0 text-sm text-muted">
                            {CIRCLE_STATUS[circle.status]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <LinkButton href="/assistant" variant="outline" fullWidth>
                Ask the assistant to explain my score
              </LinkButton>

              <Section title="Score history">
                {profile.events.length === 0 ? (
                  <EmptyState
                    title="No score history yet"
                    description="Your score history will appear here once you pay a cycle."
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {profile.events.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium text-ink">
                            {EVENT_TEXT[event.type]}
                          </span>
                          <span className="truncate text-sm text-muted">
                            {event.circleName} · {formatDate(event.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold ${
                            event.points >= 0 ? 'text-safe-ink' : 'text-risky-ink'
                          }`}
                        >
                          {event.points >= 0 ? '+' : ''}
                          {event.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3"
      aria-label="Loading profile"
    >
      <span className="sr-only">Loading profile...</span>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
