"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { friendlyError } from "@/components/forms/errorMessages";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
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
      <Card className="flex flex-col gap-2 border-safe-line bg-safe-soft">
        <h2 className="text-base font-semibold tracking-tight text-safe-ink">
          {payout.status === "released" ? "Payout released" : "Payout paid"}
        </h2>
        <p className="text-sm text-safe-ink">
          You received {formatUsd(payout.netCents)}.
        </p>
      </Card>
    );
  }

  if (payout.status === "failed") {
    return (
      <Card className="flex flex-col gap-1 border-error-line bg-error-soft">
        <h2 className="text-base font-semibold tracking-tight text-error-ink">
          Payout issue
        </h2>
        <p className="text-sm text-error-ink">
          The payout could not be sent. Please contact support so we can help.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 border-risky-line bg-risky-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Your payout is ready
        </h2>
        <Badge variant="risky">Cycle {payout.cycle}</Badge>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Pot collected</dt>
          <dd className="font-medium text-ink">
            {formatUsd(payout.grossCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Service fee</dt>
          <dd className="font-medium text-ink">
            -{formatUsd(payout.feeCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-risky-line pt-1.5">
          <dt className="font-semibold text-ink">You receive</dt>
          <dd className="text-base font-semibold text-ink">
            {formatUsd(payout.netCents)}
            {payout.localFormatted && payout.localCurrency !== "USD" ? (
              <span className="block text-xs font-medium text-muted">
                about {payout.localFormatted} {payout.localCurrency}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {payout.localFormatted && payout.localCurrency !== "USD" ? (
        <p className="text-xs leading-relaxed text-muted">
          The money is sent in US dollars and converted into your own currency
          at the provider&apos;s rate, so the final amount can differ a little.
        </p>
      ) : null}

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-xl border border-risky-line bg-surface p-3">
          <p className="text-sm text-muted">
            Send {formatUsd(payout.netCents)} to your account now? This cannot
            be undone.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleRelease}
              loading={releasing}
              className="flex-1"
            >
              {releasing ? "Sending..." : "Yes, release my payout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={releasing}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="lg" fullWidth onClick={() => setConfirming(true)}>
          Release my payout
        </Button>
      )}

      {error ? <Notice variant="error">{error}</Notice> : null}
    </Card>
  );
}
