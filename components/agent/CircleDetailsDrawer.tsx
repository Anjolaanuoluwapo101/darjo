"use client";

import { useEffect } from "react";
import { DISCLAIMER } from "@/data/countries";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatUsd } from "@/components/ui/formatUsd";
import type { CircleSummary } from "@/types/api";

type CircleDetailsDrawerProps = {
  circle: CircleSummary | null;
  onClose: () => void;
};

// Slide-over with the details of one circle: what it costs, who is in it and
// how risky the currency mix is.
export default function CircleDetailsDrawer({
  circle,
  onClose,
}: CircleDetailsDrawerProps) {
  useEffect(() => {
    if (!circle) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [circle, onClose]);

  if (!circle) return null;

  const riskLabel =
    circle.risk === "safe" ? "Low volatility" : "High volatility";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${circle.name} details`}
        className="flex max-h-[85dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold tracking-tight text-ink">
              {circle.name}
            </h2>
            <p className="text-sm text-muted">Circle details and risk</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the circle details"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-2 p-3">
            <span className="block text-xs text-muted">Contribution</span>
            <span className="text-lg font-semibold text-ink">
              {formatUsd(circle.contributionCents)}
            </span>
            <span className="block text-xs capitalize text-muted">
              {circle.frequency}
            </span>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <span className="block text-xs text-muted">Members</span>
            <span className="text-lg font-semibold text-ink">
              {circle.memberCount} of {circle.memberLimit}
            </span>
            <span className="block text-xs text-muted">
              Created by {circle.creatorName}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3">
          <span className="text-xs font-semibold text-ink">
            Currency volatility rating
          </span>
          <Badge variant={circle.risk === "safe" ? "safe" : "risky"} dot>
            {riskLabel}
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-muted">{circle.riskReason}</p>

        <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs italic text-muted">
          {DISCLAIMER}
        </p>

        <Button type="button" fullWidth onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
