'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { friendlyError } from '@/components/forms/errorMessages';
import PageContainer from '@/components/layout/PageContainer';
import { formatUsd } from '@/components/ui/formatUsd';
import { getPayouts, releasePayoutById } from '@/lib/api-client';
import { getMe } from '@/lib/api-client';
import type { PayoutHubData, PayoutHubItem, User } from '@/types/api';
import TierBadge from '@/components/ui/TierBadge';

const statusCopy: Record<PayoutHubItem['status'], string> = {
  prepared: 'Ready to release',
  released: 'Releasing',
  paid: 'Paid',
  failed: 'Failed',
};

const statusTone: Record<PayoutHubItem['status'], string> = {
  prepared: 'bg-safe-soft text-safe-ink',
  released: 'bg-risky-soft text-risky-ink',
  paid: 'bg-safe-soft text-safe-ink',
  failed: 'bg-risky-soft text-risky-ink',
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
    <main className="min-h-screen bg-surface-2 font-sans text-ink">
      <PageContainer width="wide">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Payouts</p>
              <h1 className="text-2xl font-semibold tracking-tight">Your turn in the circle</h1>
              <p className="max-w-prose text-sm text-muted">
                Release a payout when the pot is ready. PayPal sends the money to your account.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                  <TierBadge tier={user.tier} rank={user.rank} />
                </>
              ) : null}
            </div>
          </div>

          {notice ? (
            <p role="status" className="rounded-xl bg-safe-soft px-4 py-3 text-sm text-safe-ink">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-xl bg-risky-soft px-4 py-3 text-sm text-risky-ink">
              {error}
            </p>
          ) : null}
        </header>

        {loading ? (
          <PayoutSkeleton />
        ) : data ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Ready to release</p>
                <p className="mt-2 text-2xl font-bold">{formatUsd(data.totals.readyNetCents)}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Received</p>
                <p className="mt-2 text-2xl font-bold">{formatUsd(data.totals.paidNetCents)}</p>
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-base font-semibold">Ready now</h2>
              {data.ready.length === 0 ? (
                <PayoutEmptyState
                  message="No payout is ready yet."
                  action={{ href: '/studio', label: 'Back to studio' }}
                />
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-base font-semibold">History</h2>
              {data.history.length === 0 ? (
                <PayoutEmptyState
                  message="Completed payouts will appear here."
                  action={{ href: '/studio', label: 'Back to studio' }}
                />
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.history.map((item) => (
                    <li key={item.id}>
                      <PayoutHistoryItem item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <Link
          href="/studio"
          className="self-start rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Back to Studio
        </Link>
      </PageContainer>
    </main>
  );
}

function PayoutEmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-sm text-muted">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {action.label}
        </Link>
      )}
    </div>
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
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{item.circleName}</h3>
          <p className="text-sm text-muted">
            Cycle {item.cycle} · {isWinner ? 'Your payout' : `Winner: ${item.winnerName}`}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[item.status]}`}>
          {statusCopy[item.status]}
        </span>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
          <dt className="text-muted">Pot</dt>
          <dd className="font-medium">{formatUsd(item.grossCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Fee</dt>
          <dd className="font-medium text-muted">-{formatUsd(item.feeCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
          <dt className="font-semibold">{isWinner ? 'You receive' : 'They receive'}</dt>
          <dd className="text-lg font-bold">
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
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-sm">
              Send {formatUsd(item.netCents)} to your account now? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRelease}
                disabled={releasing}
                className="min-h-11 flex-1 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {releasing ? 'Sending...' : 'Yes, release it'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={releasing}
                className="min-h-11 flex-1 rounded-xl border border-line px-4 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={!item.canRelease}
            className="min-h-12 w-full rounded-xl bg-accent px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Release my payout
          </button>
        )
      ) : (
        <p className="text-sm text-muted">
          {item.status === 'released'
            ? 'PayPal is sending the money to the winner.'
            : `Waiting for ${item.winnerName || 'the winner'} to release this payout.`}
        </p>
      )}

      {item.releaseBlockedReason && isWinner && item.status === 'prepared' ? (
        <p className="text-xs text-muted">{item.releaseBlockedReason}</p>
      ) : null}

      <Link
        href={`/circles/${item.circleId}`}
        className="mt-2 inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        View circle
      </Link>
    </article>
  );
}

function PayoutHistoryItem({ item }: { item: PayoutHubItem }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{item.circleName}</h3>
          <p className="text-sm text-muted">
            Cycle {item.cycle} · {item.winnerName}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[item.status]}`}>
          {statusCopy[item.status]}
        </span>
      </div>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Amount</dt>
          <dd className="text-lg font-bold">{formatUsd(item.netCents)}</dd>
        </div>
        {item.localFormatted && item.localCurrency !== 'USD' ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">In local currency</dt>
            <dd className="text-sm text-muted">{item.localFormatted} {item.localCurrency}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/circles/${item.circleId}`}
        className="mt-2 inline-flex min-h-10 items-center justify-center self-start rounded-xl border border-line px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        View circle
      </Link>
    </article>
  );
}

function PayoutSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading payouts...</span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((card) => (
          <div key={card} className="rounded-2xl border border-line bg-surface p-5 animate-pulse">
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-8 w-full animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((card) => (
          <div key={card} className="rounded-2xl border border-line bg-surface p-5 animate-pulse">
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-6 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
