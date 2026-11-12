"use client";

import { useState } from "react";
import { cn } from "./cn";

type RiskTagProps = {
  risk: "safe" | "risky";
  reason?: string;
};

const iconClass = "h-4 w-4 shrink-0";

// Pill that reveals the reason when tapped.
export default function RiskTag({ risk, reason }: RiskTagProps) {
  const [open, setOpen] = useState(false);
  const isSafe = risk === "safe";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 self-start rounded-full border px-3.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          isSafe
            ? "border-safe-line bg-safe-soft text-safe-ink"
            : "border-risky-line bg-risky-soft text-risky-ink"
        )}
      >
        {isSafe ? (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={iconClass}
            aria-hidden="true"
          >
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={iconClass}
            aria-hidden="true"
          >
            <path d="M8 2.5 14 13H2L8 2.5Z" />
            <path d="M8 6v3.5" />
            <path d="M8 11.5h.01" />
          </svg>
        )}
        {isSafe ? "Safe" : "Risky"}
      </button>
      {open && reason ? (
        <p
          className={cn(
            "max-w-full rounded-xl border px-3 py-2 text-sm leading-relaxed",
            isSafe
              ? "border-safe-line bg-safe-soft text-safe-ink"
              : "border-risky-line bg-risky-soft text-risky-ink"
          )}
        >
          {reason}
        </p>
      ) : null}
    </div>
  );
}
