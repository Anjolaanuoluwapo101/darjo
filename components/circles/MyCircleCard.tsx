"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatUsd } from "@/components/ui/formatUsd";
import type { CircleSummary } from "@/types/api";

type MyCircleCardProps = { circle: CircleSummary };

function paymentStatusLabel(status: CircleSummary['viewerPaymentStatus'] | undefined) {
  switch (status) {
    case 'paid': return "Paid this cycle";
    case 'pending': return "Not paid yet";
    case 'late': return "Late";
    case 'failed': return "Failed";
    default: return "Open";
  }
}

function paymentStatusVariant(status: CircleSummary['viewerPaymentStatus'] | undefined) {
  switch (status) {
    case 'paid': return "safe";
    case 'late': return "error";
    case 'failed': return "error";
    default: return "neutral";
  }
}

export default function MyCircleCard({ circle }: MyCircleCardProps) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="group relative rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong block outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-ink">
              {circle.name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">
              Created by {circle.creatorName}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={paymentStatusVariant(circle.viewerPaymentStatus)}>
              {paymentStatusLabel(circle.viewerPaymentStatus)}
            </Badge>
            <p className="mt-1 text-sm text-muted">
              {formatUsd(circle.contributionCents)}{" "}
              <span className="font-normal capitalize text-muted">
                {circle.frequency}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-ink">
            {circle.memberCount} of {circle.memberLimit} members
          </span>
        </div>
      </div>
    </Link>
  );
}
