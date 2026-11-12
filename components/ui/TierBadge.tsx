import type { Tier } from "@/types/api";
import Badge from "./Badge";

type TierBadgeProps = {
  tier: Tier;
  rank?: string | null;
};

// Small pill showing the member's tier, with an optional rank.
export default function TierBadge({ tier, rank }: TierBadgeProps) {
  return (
    <Badge variant="tier" dot tier={tier}>
      <span>Tier {tier}</span>
      {rank ? <span className="font-semibold text-ink">{rank}</span> : null}
    </Badge>
  );
}
