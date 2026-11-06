"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PayButton from "@/components/circles/PayButton";
import PayoutCard from "@/components/circles/PayoutCard";
import { friendlyError } from "@/components/forms/errorMessages";
import RiskTag from "@/components/ui/RiskTag";
import TierBadge from "@/components/ui/TierBadge";
import { formatUsd } from "@/components/ui/formatUsd";
import { getCircle, getMe, joinCircle } from "@/lib/api-client";
import type { CircleDetail, Member } from "@/types/api";

const STATUS_LABEL: Record<CircleDetail["status"], string> = {
  open: "Open",
  active: "Active",
  completed: "Completed",
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
        if (failed.error.code === "UNAUTHENTICATED") {
          router.replace("/login");
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
    <div className="min-h-full bg-white font-sans text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-8">
        {loading ? (
          <CircleSkeleton />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : circle ? (
          <>
            <CircleHeader circle={circle} />

            <PotCard circle={circle} />

            <CircleActions
              circle={circle}
              isMember={isMember}
              onCircleChange={setCircle}
            />

            <MembersList
              circle={circle}
              viewerId={viewerId}
            />

            {/* Assistant drawer slot: Teammate C adds <AssistantDrawer circleId={circle.id} /> here. */}
          </>
        ) : null}
      </div>
    </div>
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
    <header className="flex flex-col gap-3">
      <Link
        href="/studio"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-[#0070e0] hover:underline"
      >
        <span aria-hidden="true">&larr;</span>
        Back to studio
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {circle.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Created by {circle.creatorName}
          </p>
        </div>
        <TierBadge tier={circle.tier} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
          {STATUS_LABEL[circle.status]}
        </span>
        <span className="text-gray-500">
          Cycle {circle.currentCycle} of {circle.totalCycles}
        </span>
        <span className="text-gray-300" aria-hidden="true">
          &middot;
        </span>
        <span className="text-gray-500">
          {formatUsd(circle.contributionCents)} {circle.frequency}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RiskTag risk={circle.risk} reason={circle.riskReason} />
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Invite code
          </span>
          <span className="font-mono text-sm font-semibold text-[#001c64]">
            {circle.inviteCode}
          </span>
          <button
            type="button"
            onClick={copyInviteCode}
            className="min-h-9 rounded-lg border border-[#003087] px-2.5 text-xs font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
          >
            {copied ? "Copied" : "Copy"}
          </button>
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
          Math.round((circle.paidThisCycleCents / circle.potCents) * 100)
        )
      : 0;
  const remaining = Math.max(0, circle.potCents - circle.paidThisCycleCents);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          This cycle&apos;s pot
        </h2>
        <span className="text-sm font-semibold text-[#0070e0]">
          {progress}%
        </span>
      </div>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#001c64]">
        {formatUsd(circle.paidThisCycleCents)}
        <span className="ml-1 text-base font-normal text-gray-500">
          of {formatUsd(circle.potCents)}
        </span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pot collected this cycle"
        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-[#0070e0] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-gray-500">
        {remaining > 0
          ? `${formatUsd(remaining)} still to collect`
          : "Everyone has paid into this cycle's pot."}
      </p>
    </section>
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
    if (code === "UNAUTHENTICATED") {
      router.replace("/login");
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

  if (circle.status === "completed") {
    return (
      <InfoPanel
        title="Circle complete"
        body="This circle has finished all of its cycles."
      />
    );
  }

  if (!isMember) {
    if (circle.status !== "open") {
      return (
        <InfoPanel
          title="This circle is already active"
          body="You can only join a circle while it is still open."
        />
      );
    }

    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-base font-semibold">Join this circle</h2>
        <p className="text-sm text-gray-600">
          Contribute {formatUsd(circle.contributionCents)} {circle.frequency}{" "}
          and take your turn in the payout order.
        </p>
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joining ? "Joining..." : "Join circle"}
        </button>
        {joinError ? (
          <p role="alert" className="text-sm text-red-700">
            {joinError}
          </p>
        ) : null}
      </section>
    );
  }

  if (circle.status === "open") {
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
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">Your turn to pay</h2>
          <p className="text-sm text-gray-600">
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
    (a, b) => a.turnPosition - b.turnPosition
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Members
        </h2>
        <span className="text-sm text-gray-500">
          {circle.memberCount} of {circle.memberLimit}
        </span>
      </div>

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
        isViewer ? "border-[#0070e0] bg-blue-50/40" : "border-gray-200"
      }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600"
        aria-label={`Turn ${member.turnPosition}`}
      >
        {member.turnPosition}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">{member.name}</span>
          {isViewer ? (
            <span className="rounded-full bg-[#0070e0] px-2 py-0.5 text-xs font-semibold text-white">
              You
            </span>
          ) : null}
          {isWinner ? (
            <span className="rounded-full bg-[#ffd140] px-2 py-0.5 text-xs font-semibold text-[#001c64]">
              Winner this cycle
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {member.nationality}
          </span>
          <TierBadge tier={member.tier} rank={member.rank} />
          <StatusPill status={member.currentCycleStatus} />
        </div>
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: Member["currentCycleStatus"] }) {
  const styles: Record<Member["currentCycleStatus"], string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-gray-100 text-gray-600",
    late: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<Member["currentCycleStatus"], string> = {
    paid: "Paid",
    pending: "Pending",
    late: "Late",
    failed: "Failed",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-gray-600">{body}</p>
    </section>
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
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <p className="text-sm text-red-700">{message}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/studio"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#003087] px-4 text-sm font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Back to studio
        </Link>
      </div>
    </div>
  );
}

function CircleSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <span className="sr-only">Loading circle...</span>
      <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}

export default function CircleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-white px-5 py-8">
          <p className="text-sm text-gray-500">Loading circle...</p>
        </div>
      }
    >
      <CircleDetail />
    </Suspense>
  );
}
