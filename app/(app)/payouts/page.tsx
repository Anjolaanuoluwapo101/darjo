'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { friendlyError } from '@/components/forms/errorMessages';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import InfoNote from '@/components/ui/InfoNote';
import Notice from '@/components/ui/Notice';
import Section from '@/components/ui/Section';
import Skeleton from '@/components/ui/Skeleton';
import TierBadge from '@/components/ui/TierBadge';
import { formatUsd } from '@/components/ui/formatUsd';
import { getMe, getPayouts, releasePayoutById } from '@/lib/api-client';
import type { PayoutHubData, PayoutHubItem, User } from '@/types/api';

const statusCopy: Record<PayoutHubItem['status'], string> = {
  prepared: 'Ready to release',
  released: 'Releasing',
  paid: 'Paid',
  failed: 'Failed',
};

const statusVariant: Record<
  PayoutHubItem['status'],
  'safe' | 'risky' | 'error'
> = {
  prepared: 'safe',
  released: 'risky',
  paid: 'safe',
  failed: 'error',
};

export default function PayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<PayoutHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      const result = await getMe();
      if (!active) return;
      if (result.ok) setUser(result.data.user);
    }
    loadUser();
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const result = await getPayouts();
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
      setData(result.data);
      setError(null);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  const handleRelease = useCallback(
    async (item: PayoutHubItem) => {
      setError(null);
      setNotice(null);
      setReleasingId(item.id);
      const result = await releasePayoutById(item.id);
      setReleasingId(null);
      setConfirmingId(null);
      if (!result.ok) {
        if (result.error.code === 'UNAUTHENTICATED') {
          router.replace('/login');
          return;
        }
        setError(friendlyError(result.error.code, result.error.message));
        return;
      }
      setNotice(`Release started for ${formatUsd(item.netCents)}.`);
      setReloadKey((key) => key + 1);
    },
    [router],
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Payouts"
          title="Your turn in the circle"
          description="Release a payout when the pot is ready. The money goes straight to your account."
          action={user ? <TierBadge tier={user.tier} rank={user.rank} /> : undefined}
        />

        <InfoNote>
          The platform fee is taken from the pot before release. Local-currency
          amounts are estimates and are not locked at today&apos;s rate.
        </InfoNote>

        {notice ? (
          <Notice variant="success" title="Release started">
            {notice}
          </Notice>
        ) : null}
        {error ? (
          <Notice variant="error" title="Something went wrong">
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <PayoutSkeleton />
        ) : data ? (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Ready to release
                </p>
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  {formatUsd(data.totals.readyNetCents)}
                </p>
              </Card>
              <Card className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Received
                </p>
                <p className="text-2xl font-semibold tracking-tight text-safe-ink">
                  {formatUsd(data.totals.paidNetCents)}
                </p>
              </Card>
            </section>

            <Section
              title="Ready now"
              description="Only the cycle's winner can release a payout."
            >
              {data.ready.length === 0 ? (
                <EmptyState
                  title="No payout ready yet"
                  description="When your turn comes and the pot is full, the release button appears here."
                  action={
                    <Link
                      href="/studio"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Back to studio
                    </Link>
                  }
                />
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.ready.map((item) => (
                    <li key={item.id}>
                      <PayoutReadyCard
                        item={item}
                        confirming={confirmingId === item.id}
                        releasing={releasingId === item.id}
                        onConfirm={() => setConfirmingId(item.id)}
                        onCancel={() => setConfirmingId(null)}
                        onRelease={() => void handleRelease(item)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="History">
              {data.history.length === 0 ? (
                <EmptyState
                  title="No payouts yet"
                  description="Completed payouts will appear here once your circles start paying out."
                  action={
                    <Link
                      href="/studio"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Back to studio
                    </Link>
                  }
                />
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.history.map((item) => (
                    <li key={item.id}>
                      <PayoutHistoryItem item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        ) : null}

        <Link
          href="/studio"
          className="self-start text-sm font-medium text-accent hover:underline"
        >
          Back to Studio
        </Link>
      </div>
    </PageContainer>
  );
}

function PayoutReadyCard({
  item,
  confirming,
  releasing,
  onConfirm,
  onCancel,
  onRelease,
}: {
  item: PayoutHubItem;
  confirming: boolean;
  releasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onRelease: () => void;
}) {
  const isWinner = item.viewerRole === 'winner';
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            {item.circleName}
          </h3>
          <p className="text-sm text-muted">
            Cycle {item.cycle} · {isWinner ? 'Your payout' : `Winner: ${item.winnerName}`}
          </p>
        </div>
        <Badge variant={statusVariant[item.status]} dot>
          {statusCopy[item.status]}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
          <dt className="text-muted">Pot</dt>
          <dd className="font-medium text-ink">{formatUsd(item.grossCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Fee</dt>
          <dd className="font-medium text-muted">-{formatUsd(item.feeCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
          <dt className="font-semibold text-ink">
            {isWinner ? 'You receive' : 'They receive'}
          </dt>
          <dd className="text-lg font-semibold text-ink">
            {formatUsd(item.netCents)}
            {item.localFormatted && item.localCurrency !== 'USD' ? (
              <span className="ml-1 text-xs font-medium text-muted">
                about {item.localFormatted} {item.localCurrency}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {isWinner ? (
        confirming ? (
          <div className="flex flex-col gap-2 rounded-xl border border-risky-line bg-risky-soft p-3">
            <p className="text-sm text-risky-ink">
              Send {formatUsd(item.netCents)} to your account now? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onRelease}
                loading={releasing}
                className="flex-1"
              >
                {releasing ? 'Sending...' : 'Yes, release it'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={releasing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={!item.canRelease}
          >
            Release my payout
          </Button>
        )
      ) : (
        <p className="text-sm text-muted">
          {item.status === 'released'
            ? 'The money is on its way to the winner.'
            : `Waiting for ${item.winnerName || 'the winner'} to release this payout.`}
        </p>
      )}

      {item.releaseBlockedReason && isWinner && item.status === 'prepared' ? (
        <p className="text-xs text-muted">{item.releaseBlockedReason}</p>
      ) : null}

      <Link
        href={`/circles/${item.circleId}`}
        className="inline-flex min-h-10 items-center justify-center self-start rounded-xl border border-line-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
      >
        View circle
      </Link>
    </Card>
  );
}

function PayoutHistoryItem({ item }: { item: PayoutHubItem }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            {item.circleName}
          </h3>
          <p className="text-sm text-muted">
            Cycle {item.cycle} · {item.winnerName}
          </p>
        </div>
        <Badge variant={statusVariant[item.status]} dot>
          {statusCopy[item.status]}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Amount</dt>
          <dd className="text-lg font-semibold text-ink">{formatUsd(item.netCents)}</dd>
        </div>
        {item.localFormatted && item.localCurrency !== 'USD' ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">In local currency</dt>
            <dd className="text-sm text-muted">
              {item.localFormatted} {item.localCurrency}
            </dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/circles/${item.circleId}`}
        className="inline-flex min-h-10 items-center justify-center self-start rounded-xl px-3 text-sm font-medium text-accent transition-colors hover:bg-surface-2"
      >
        View circle
      </Link>
    </Card>
  );
}

function PayoutSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading payouts...</span>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((card) => (
          <Card key={card}>
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-7 w-2/3" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <Card key={card}>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-6 w-1/2" />
            <Skeleton className="mt-4 h-10 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
