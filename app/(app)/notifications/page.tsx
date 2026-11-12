'use client';

import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LinkButton from '@/components/ui/LinkButton';
import Notice from '@/components/ui/Notice';
import Skeleton from '@/components/ui/Skeleton';
import type { AppNotification } from '@/types/api';

const typeTone: Record<string, string> = {
  payout_ready: 'safe',
  payout_sent: 'safe',
  payout_paid: 'safe',
  payout_failed: 'risky',
  payment_paid: 'safe',
  payment_failed: 'risky',
  payment_overdue: 'risky',
  nudge: 'risky',
};

const toneClasses: Record<string, string> = {
  safe: 'bg-safe-soft text-safe-ink',
  risky: 'bg-risky-soft text-risky-ink',
  neutral: 'bg-surface-2 text-muted',
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
  const tone = typeTone[item.type] ?? 'neutral';
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${toneClasses[tone]}`}
      >
        {item.title.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span
            className={`text-sm text-ink ${
              item.readAt ? 'font-medium' : 'font-semibold'
            }`}
          >
            {item.title}
          </span>
          <span className="text-xs text-muted-soft">
            {relativeTime(item.createdAt)}
          </span>
        </span>
        <span className="mt-1 block text-sm text-muted">{item.body}</span>
      </span>
      {!item.readAt ? (
        <span
          aria-label="Unread"
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
        />
      ) : null}
    </>
  );

  const className = `flex w-full items-start gap-3 border-b border-line px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
    item.readAt ? 'bg-surface' : 'bg-primary-soft/30'
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

  const pushDisabled =
    pushBusy || pushState === 'denied' || pushState === 'unsupported';

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Notifications"
          title="Your updates"
          description={
            unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={reload}>
                Refresh
              </Button>
              <Button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
            </div>
          }
        />

        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Push notifications
              </h2>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                {pushCopy}
              </p>
            </div>
            {pushState === 'subscribed' ? (
              <Button
                type="button"
                variant="outline"
                onClick={disableNotifications}
                disabled={pushBusy}
              >
                {pushBusy ? 'Working...' : 'Turn off'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={enableNotifications}
                disabled={pushDisabled}
              >
                {pushBusy ? 'Turning on...' : 'Turn on push'}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-soft">
            On iPhone, add D&apos;arjo to your Home Screen first, then turn on
            push from there.
          </p>
        </Card>

        {error ? <Notice variant="error">{error}</Notice> : null}

        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          {loading ? (
            <div role="status" aria-live="polite" className="flex flex-col">
              <span className="sr-only">Loading notifications...</span>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-start gap-3 border-b border-line px-4 py-4 last:border-b-0"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6">
              <EmptyState
                title="Nothing yet"
                description="When a payment, payout, or nudge needs your attention, it will show up here."
                action={
                  <LinkButton href="/studio" size="sm">
                    Back to Studio
                  </LinkButton>
                }
              />
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
      </div>
    </PageContainer>
  );
}
