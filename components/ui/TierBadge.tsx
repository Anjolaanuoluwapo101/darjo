import type { Tier } from "@/types/api";

type TierBadgeProps = {
  tier: Tier;
  rank?: string | null;
};

// Dot colour for each tier.
const dotColor: Record<Tier, string> = {
  1: "bg-slate-400",
  2: "bg-sky-500",
  3: "bg-violet-500",
  4: "bg-amber-500",
};

// Small pill showing the member's tier, with an optional rank.
export default function TierBadge({ tier, rank }: TierBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-700">
      <span
        className={`h-2 w-2 rounded-full ${dotColor[tier]}`}
        aria-hidden="true"
      />
      <span>Tier {tier}</span>
      {rank ? (
        <span className="font-semibold text-zinc-900">{rank}</span>
      ) : null}
    </span>
  );
}
