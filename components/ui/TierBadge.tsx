import type { Tier } from "@/types/api";

type TierBadgeProps = {
  tier: Tier;
  rank?: string | null;
};

// Dot colour for each tier.
const dotColor: Record<Tier, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
  4: "bg-tier-4",
};

// Small pill showing the member's tier, with an optional rank.
export default function TierBadge({ tier, rank }: TierBadgeProps) {
  if (tier === 4 || rank) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ffd140] px-3 py-1.5 text-[13px] text-[#001c64]">
        <span
          className="h-2 w-2 rounded-full bg-[#001c64]"
          aria-hidden="true"
        />
        <span>Tier {tier}</span>
        {rank ? <span className="font-semibold">{rank}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-muted">
      <span
        className={`h-2 w-2 rounded-full ${dotColor[tier]}`}
        aria-hidden="true"
      />
      <span>Tier {tier}</span>
      {rank ? (
        <span className="font-semibold text-ink">{rank}</span>
      ) : null}
    </span>
  );
}
