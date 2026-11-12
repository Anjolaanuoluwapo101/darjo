import type { Tier } from "@/types/api";

type TierBadgeProps = {
  tier: Tier;
  rank?: string | null;
};

// Small pill showing the member's tier, with an optional rank.
export default function TierBadge({ tier, rank }: TierBadgeProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ffd140] px-3 py-1.5 text-[13px] font-medium text-[#001c64]">
      <span
        className="h-2 w-2 rounded-full bg-[#001c64]"
        aria-hidden="true"
      />
      <span>Tier {tier}</span>
      {rank ? <span className="font-semibold">{rank}</span> : null}
    </span>
  );
}
