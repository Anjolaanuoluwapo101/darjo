"use client";

import { useEffect } from "react";
import { DISCLAIMER } from "@/data/countries";
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

  const riskLabel = circle.risk === "safe" ? "Low volatility" : "High volatility";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${circle.name} details`}
        className="flex max-h-[85dvh] w-full max-w-md flex-col gap-4 rounded-t-2xl border border-gray-200 bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold tracking-tight text-[#001c64]">
              {circle.name}
            </h2>
            <p className="text-sm text-gray-500">Circle details and risk</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the circle details"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <span className="block text-xs text-gray-500">Contribution</span>
            <span className="text-lg font-semibold text-[#001c64]">
              {formatUsd(circle.contributionCents)}
            </span>
            <span className="block text-xs text-gray-500">{circle.frequency}</span>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <span className="block text-xs text-gray-500">Members</span>
            <span className="text-lg font-semibold text-[#001c64]">
              {circle.memberCount} of {circle.memberLimit}
            </span>
            <span className="block text-xs text-gray-500">
              Created by {circle.creatorName}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d6e4ff] bg-[#f2f7ff] p-3">
          <span className="text-xs font-semibold text-[#001c64]">
            Currency volatility rating
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              circle.risk === "safe"
                ? "bg-safe-soft text-safe-ink"
                : "bg-risky-soft text-risky-ink"
            }`}
          >
            {riskLabel}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-gray-600">{circle.riskReason}</p>

        <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs italic text-gray-500">
          {DISCLAIMER}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="min-h-11 w-full rounded-xl bg-[#003087] text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
