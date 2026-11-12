import Link from "next/link";
import Badge from "@/components/ui/Badge";
import RiskTag from "@/components/ui/RiskTag";
import TierBadge from "@/components/ui/TierBadge";
import { formatUsd } from "@/components/ui/formatUsd";
import type { CircleSummary } from "@/types/api";

type CircleCardProps = {
  circle: CircleSummary;
};

// One circle in Circle Studio. The whole card opens the circle; RiskTag stays tappable.
export default function CircleCard({ circle }: CircleCardProps) {
  return (
    <div className="group relative rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <Link
        href={`/circles/${circle.id}`}
        aria-label={`Open ${circle.name}`}
        className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      />

      <div className="pointer-events-none relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-ink">
              {circle.name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">
              Created by {circle.creatorName}
            </p>
          </div>
          <TierBadge tier={circle.tier} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-ink">
            {formatUsd(circle.contributionCents)}{" "}
            <span className="font-normal capitalize text-muted">
              {circle.frequency}
            </span>
          </span>
          <span className="text-muted">
            {circle.memberCount} of {circle.memberLimit} members
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div
            className="flex flex-wrap gap-1.5"
            aria-label="Countries in this circle"
          >
            {circle.nationalitiesInCircle.length === 0 ? (
              <Badge>Open to all</Badge>
            ) : (
              circle.nationalitiesInCircle.map((code) => (
                <Badge key={code}>{code}</Badge>
              ))
            )}
          </div>
          <div className="pointer-events-auto">
            <RiskTag risk={circle.risk} reason={circle.riskReason} />
          </div>
        </div>
      </div>
    </div>
  );
}
