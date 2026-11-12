'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AssistantDrawer from '@/components/agent/AssistantDrawer';
import PayButton from '@/components/circles/PayButton';
import PayoutCard from '@/components/circles/PayoutCard';
import { friendlyError } from '@/components/forms/errorMessages';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import InfoNote from '@/components/ui/InfoNote';
import LinkButton from '@/components/ui/LinkButton';
import Notice from '@/components/ui/Notice';
import RiskTag from '@/components/ui/RiskTag';
import Skeleton from '@/components/ui/Skeleton';
import TierBadge from '@/components/ui/TierBadge';
import { formatUsd } from '@/components/ui/formatUsd';
import { getCircle, getMe, joinCircle } from '@/lib/api-client';
import type { CircleDetail, Member } from '@/types/api';

const STATUS_LABEL: Record<CircleDetail['status'], string> = {
  open: 'Open',
  active: 'Active',
  completed: 'Completed',
};

const STATUS_VARIANT: Record<
  CircleDetail['status'],
  'neutral' | 'safe' | 'brand'
> = {
  open: 'brand',
  active: 'safe',
  completed: 'neutral',
};

function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [circleResult, meResult] = await Promise.all([
        getCircle(id),
        getMe(),
      ]);

      if (!active) return;

      const failed = !circleResult.ok
        ? circleResult
        : !meResult.ok
          ? meResult
          : null;

      if (failed) {
        if (failed.error.code === 'UNAUTHENTICATED') {
          router.replace('/login');
          return;
        }
        setError(friendlyError(failed.error.code, failed.error.message));
        setLoading(false);
        return;
      }

      if (meResult.ok) setViewerId(meResult.data.user.id);
      if (circleResult.ok) setCircle(circleResult.data.circle);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [id, reloadKey, router]);

  const isMember = circle
    ? circle.members.some((member) => member.userId === viewerId)
    : false;

  return (
    <PageContainer>
      {loading ? (
        <CircleSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : circle ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-6">
            <CircleHeader circle={circle} />

            <InfoNote>
              A payout depends on every member paying this cycle. D&apos;arjo
              does not cover missed contributions or guarantee the pot.
            </InfoNote>

            <PotCard circle={circle} />

            <CircleActions
              circle={circle}
              isMember={isMember}
              onCircleChange={setCircle}
            />
          </div>

          <div className="flex flex-col gap-6">
            <MembersList circle={circle} viewerId={viewerId} />

            <AssistantDrawer circleId={circle.id} circleName={circle.name} />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}

function CircleHeader({ circle }: { circle: CircleDetail }) {
  const [copied, setCopied] = useState(false);

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(circle.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/studio"
        className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
      >
        <span aria-hidden="true">&larr;</span>
        Back to studio
      </Link>

      <PageHeader
        eyebrow="Circle"
        title={circle.name}
        description={`Created by ${circle.creatorName}`}
        action={<TierBadge tier={circle.tier} />}
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={STATUS_VARIANT[circle.status]}>
          {STATUS_LABEL[circle.status]}
        </Badge>
        <span className="text-muted">
          Cycle {circle.currentCycle} of {circle.totalCycles}
        </span>
        <span className="text-muted-soft" aria-hidden="true">
          &middot;
        </span>
        <span className="text-muted">
          {formatUsd(circle.contributionCents)} {circle.frequency}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RiskTag risk={circle.risk} reason={circle.riskReason} />
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Invite code
          </span>
          <span className="font-mono text-sm font-semibold text-primary">
            {circle.inviteCode}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyInviteCode}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
    </header>
  );
}

function PotCard({ circle }: { circle: CircleDetail }) {
  const progress =
    circle.potCents > 0
      ? Math.min(
          100,
          Math.round((circle.paidThisCycleCents / circle.potCents) * 100),
        )
      : 0;
  const remaining = Math.max(0, circle.potCents - circle.paidThisCycleCents);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          This cycle&apos;s pot
        </h2>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-ink">
        {formatUsd(circle.paidThisCycleCents)}
        <span className="ml-1 text-base font-normal text-muted">
          of {formatUsd(circle.potCents)}
        </span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pot collected this cycle"
        className="h-3 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-muted">
        {remaining > 0
          ? `${formatUsd(remaining)} still to collect`
          : "Everyone has paid into this cycle's pot."}
      </p>
    </Card>
  );
}

function CircleActions({
  circle,
  isMember,
  onCircleChange,
}: {
  circle: CircleDetail;
  isMember: boolean;
  onCircleChange: (circle: CircleDetail) => void;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  function handleAuthError(code: string): boolean {
    if (code === 'UNAUTHENTICATED') {
      router.replace('/login');
      return true;
    }
    return false;
  }

  async function handleJoin() {
    setJoinError(null);
    setJoining(true);

    const result = await joinCircle({ circleId: circle.id });

    if (!result.ok) {
      setJoining(false);
      if (handleAuthError(result.error.code)) return;
      setJoinError(friendlyError(result.error.code, result.error.message));
      return;
    }

    onCircleChange(result.data.circle);
    setJoining(false);
  }

  if (circle.status === 'completed') {
    return (
      <InfoPanel
        title="Circle complete"
        body="This circle has finished all of its cycles."
      />
    );
  }

  if (!isMember) {
    if (circle.status !== 'open') {
      return (
        <InfoPanel
          title="This circle is already active"
          body="You can only join a circle while it is still open."
        />
      );
    }

    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Join this circle
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Contribute {formatUsd(circle.contributionCents)} {circle.frequency}{' '}
          and take your turn in the payout order.
        </p>
        {joinError ? (
          <Notice variant="error">{joinError}</Notice>
        ) : null}
        <Button
          type="button"
          size="lg"
          fullWidth
          loading={joining}
          onClick={handleJoin}
        >
          {joining ? 'Joining...' : 'Join this circle'}
        </Button>
      </Card>
    );
  }

  if (circle.status === 'open') {
    return (
      <InfoPanel
        title="Waiting for the circle to fill"
        body="You can pay once the circle is full and the first cycle starts."
      />
    );
  }

  const payout = circle.payout;

  return (
    <section className="flex flex-col gap-4">
      {circle.viewerIsCurrentWinner && payout ? (
        <PayoutCard
          circleId={circle.id}
          payout={payout}
          onReleased={(releasedPayout) =>
            onCircleChange({ ...circle, payout: releasedPayout })
          }
        />
      ) : null}

      {!circle.viewerPaidThisCycle ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Your turn to pay
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Pay {formatUsd(circle.contributionCents)} to keep this cycle on
            track.
          </p>
          <PayButton circleId={circle.id} onPaid={onCircleChange} />
        </div>
      ) : (
        <InfoPanel
          title="You've paid this cycle"
          body="Thanks for paying. We will let you know when the next cycle starts."
        />
      )}
    </section>
  );
}

function MembersList({
  circle,
  viewerId,
}: {
  circle: CircleDetail;
  viewerId: string | null;
}) {
  const members = [...circle.members].sort(
    (a, b) => a.turnPosition - b.turnPosition,
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Members
        </h2>
        <span className="text-sm text-muted">
          {circle.memberCount} of {circle.memberLimit}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface-2 p-4 text-sm text-muted">
          No members have joined this circle yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              isViewer={member.userId === viewerId}
              isWinner={member.userId === circle.currentWinnerId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MemberRow({
  member,
  isViewer,
  isWinner,
}: {
  member: Member;
  isViewer: boolean;
  isWinner: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border p-3 ${
        isViewer
          ? 'border-accent bg-primary-soft/40'
          : 'border-line bg-surface'
      }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-muted"
        aria-label={`Turn ${member.turnPosition}`}
      >
        {member.turnPosition}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words font-medium text-ink">
            {member.name}
          </span>
          {isViewer ? <Badge variant="brand">You</Badge> : null}
          {isWinner ? (
            <Badge variant="risky" dot>
              Winner this cycle
            </Badge>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-xs font-medium text-muted">
            {member.nationality}
          </span>
          <TierBadge tier={member.tier} rank={member.rank} />
          <StatusPill status={member.currentCycleStatus} />
        </div>
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: Member['currentCycleStatus'] }) {
  const variant: Record<
    Member['currentCycleStatus'],
    'safe' | 'neutral' | 'error'
  > = {
    paid: 'safe',
    pending: 'neutral',
    late: 'error',
    failed: 'error',
  };

  const labels: Record<Member['currentCycleStatus'], string> = {
    paid: 'Paid',
    pending: 'Pending',
    late: 'Late',
    failed: 'Failed',
  };

  return <Badge variant={variant[status]}>{labels[status]}</Badge>;
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex flex-col gap-1 bg-surface-2">
      <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Notice variant="error" title="Could not load this circle" className="w-full">
        {message}
      </Notice>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
        <LinkButton href="/studio" variant="outline">
          Back to studio
        </LinkButton>
      </div>
    </div>
  );
}

function CircleSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <span className="sr-only">Loading circle...</span>
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export default function CircleDetailPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <p className="text-sm text-muted">Loading circle...</p>
        </PageContainer>
      }
    >
      <CircleDetail />
    </Suspense>
  );
}
