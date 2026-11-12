import type { ReactNode } from "react";
import type { Tier } from "@/types/api";
import { cn } from "./cn";

type Variant = "neutral" | "safe" | "risky" | "error" | "brand" | "tier";

const variants: Record<Exclude<Variant, "tier">, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  safe: "border-safe-line bg-safe-soft text-safe-ink",
  risky: "border-risky-line bg-risky-soft text-risky-ink",
  error: "border-error-line bg-error-soft text-error-ink",
  brand: "border-primary/20 bg-primary-soft text-primary",
};

const tierDot: Record<Tier, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
  4: "bg-tier-4",
};

type BadgeProps = {
  variant?: Variant;
  tier?: Tier;
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Badge({
  variant = "neutral",
  tier,
  dot,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        variant === "tier"
          ? "border-line bg-surface text-muted"
          : variants[variant],
        className
      )}
    >
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tier ? tierDot[tier] : "bg-current"
          )}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
