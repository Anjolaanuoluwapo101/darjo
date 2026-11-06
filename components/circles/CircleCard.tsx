import Link from "next/link";
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
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#0070e0]">
      <Link
        href={`/circles/${circle.id}`}
        aria-label={`Open ${circle.name}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
      />

      <div className="pointer-events-none relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {circle.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Created by {circle.creatorName}
            </p>
          </div>
          <TierBadge tier={circle.tier} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-[#001c64]">
            {formatUsd(circle.contributionCents)}{" "}
            <span className="font-normal text-gray-500">
              {circle.frequency}
            </span>
          </span>
          <span className="text-gray-500">
            {circle.memberCount} of {circle.memberLimit} members
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" aria-label="Countries in this circle">
            {circle.nationalitiesInCircle.map((code) => (
              <span
                key={code}
                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600"
              >
                {code}
              </span>
            ))}
          </div>
          <div className="pointer-events-auto">
            <RiskTag risk={circle.risk} reason={circle.riskReason} />
          </div>
        </div>
      </div>
    </div>
  );
}
