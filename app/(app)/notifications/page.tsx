'use client';

import Link from 'next/link';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import PageContainer from '@/components/layout/PageContainer';
import type { AppNotification } from '@/types/api';

const typeStyles: Record<string, string> = {
  payout_ready: 'bg-safe-soft text-safe-ink',
  payout_sent: 'bg-safe-soft text-safe-ink',
  payout_paid: 'bg-safe-soft text-safe-ink',
  payout_failed: 'bg-risky-soft text-risky-ink',
  payment_paid: 'bg-safe-soft text-safe-ink',
  payment_failed: 'bg-risky-soft text-risky-ink',
  payment_overdue: 'bg-risky-soft text-risky-ink',
  nudge: 'bg-risky-soft text-risky-ink',
};

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: () => void;
}) {
  const tone = typeStyles[item.type] ?? 'bg-surface-2 text-muted';
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
      >
        {item.title.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className={`text-sm ${item.readAt ? 'font-medium text-ink' : 'font-semibold text-ink'}`}>
            {item.title}
          </span>
          <span className="text-xs text-muted">{relativeTime(item.createdAt)}</span>
        </span>
        <span className="mt-1 block text-sm text-muted">{item.body}</span>
      </span>
      {!item.readAt ? (
        <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
      ) : null}
    </>
  );

  const className = `flex w-full items-start gap-3 border-b border-line px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
    item.readAt ? 'bg-surface' : 'bg-surface-2/60'
  }`;

  if (!item.url) {
    return (
      <button type="button" className={className} onClick={onOpen}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.url} onClick={onOpen} className={className}>
      {content}
    </Link>
  );
}

export default function NotificationsPage() {
  const {
    items,
    unreadCount,
    loading,
    error,
    pushState,
    pushBusy,
    markRead,
    markAllRead,
    enableNotifications,
    disableNotifications,
    reload,
  } = useNotifications();

  const pushCopy =
    pushState === 'subscribed'
      ? 'Push notifications are on for this device.'
      : pushState === 'denied'
        ? 'Your browser has blocked notifications. Turn them back on in browser settings, then reload.'
        : pushState === 'unsupported'
          ? 'This browser cannot receive push notifications. In-app updates still appear here.'
          : 'Get a push notification when a contribution is due, a payout is ready, or someone nudges you.';

  return (
    <main className="min-h-screen bg-surface-2 font-sans text-ink">
      <PageContainer>
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Notifications</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Your updates</h1>
              <p className="mt-1 text-sm text-muted">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reload}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark all read
              </button>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Push notifications</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">{pushCopy}</p>
            </div>
            {pushState === 'subscribed' ? (
              <button
                type="button"
                onClick={disableNotifications}
                disabled={pushBusy}
                className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {pushBusy ? 'Working...' : 'Turn off'}
              </button>
            ) : (
              <button
                type="button"
                onClick={enableNotifications}
                disabled={pushBusy || pushState === 'denied' || pushState === 'unsupported'}
                className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pushBusy ? 'Turning on...' : 'Turn on push'}
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            On iPhone, add D&apos;arjo to your Home Screen first, then turn on push from there.
          </p>
        </section>

        {error ? (
          <p role="alert" className="rounded-xl bg-risky-soft px-4 py-3 text-sm text-risky-ink">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          {loading ? (
            <div role="status" aria-live="polite" className="flex flex-col">
              <span className="sr-only">Loading notifications...</span>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-start gap-3 border-b border-line px-4 py-4 last:border-b-0">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
                  <div className="flex-1">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-5 py-8">
              <h2 className="text-base font-semibold">Nothing yet</h2>
              <p className="text-sm text-muted">
                When a payment, payout, or nudge needs your attention, it will show up here.
              </p>
              <Link
                href="/studio"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Back to Studio
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    if (!item.readAt) void markRead([item.id]);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
