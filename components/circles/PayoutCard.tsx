"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { friendlyError } from "@/components/forms/errorMessages";
import { formatUsd } from "@/components/ui/formatUsd";
import { releasePayout } from "@/lib/api-client";
import type { Payout } from "@/types/api";

type PayoutCardProps = {
  circleId: string;
  payout: Payout;
  onReleased: (payout: Payout) => void;
};

export default function PayoutCard({
  circleId,
  payout,
  onReleased,
}: PayoutCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRelease() {
    setError(null);
    setReleasing(true);

    const result = await releasePayout(circleId);

    if (!result.ok) {
      setReleasing(false);
      if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login");
        return;
      }
      setError(friendlyError(result.error.code, result.error.message));
      return;
    }

    onReleased(result.data.payout);
    setReleasing(false);
    setConfirming(false);
  }

  if (payout.status === "released" || payout.status === "paid") {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 p-5">
        <h2 className="text-base font-semibold text-green-800">
          {payout.status === "released" ? "Payout released" : "Payout paid"}
        </h2>
        <p className="text-sm text-green-800">
          You received {formatUsd(payout.netCents)}.
        </p>
      </section>
    );
  }

  if (payout.status === "failed") {
    return (
      <section className="flex flex-col gap-1 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-semibold text-red-700">Payout issue</h2>
        <p className="text-sm text-red-700">
          The payout could not be sent. Please contact support so we can help.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#ffd140] bg-amber-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#001c64]">
          Your payout is ready
        </h2>
        <span className="rounded-full bg-[#ffd140] px-2.5 py-1 text-xs font-semibold text-[#001c64]">
          Cycle {payout.cycle}
        </span>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Pot collected</dt>
          <dd className="font-medium">{formatUsd(payout.grossCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Service fee</dt>
          <dd className="font-medium">-{formatUsd(payout.feeCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#ffd140] pt-1.5">
          <dt className="font-semibold text-[#001c64]">You receive</dt>
          <dd className="text-base font-semibold text-[#001c64]">
            {formatUsd(payout.netCents)}
          </dd>
        </div>
      </dl>

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[#ffd140] bg-white p-3">
          <p className="text-sm text-gray-700">
            Send {formatUsd(payout.netCents)} to your account now? This cannot
            be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRelease}
              disabled={releasing}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {releasing ? "Sending..." : "Yes, release my payout"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={releasing}
              className="min-h-11 flex-1 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Release my payout
        </button>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
