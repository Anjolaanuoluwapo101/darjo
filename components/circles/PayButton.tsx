"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { friendlyError } from "@/components/forms/errorMessages";
import { capturePayment, getCircle, startPayment } from "@/lib/api-client";
import type { CircleDetail } from "@/types/api";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
const POLL_INTERVAL_MS = 3000;
const POLL_ATTEMPTS = 10;

type PayButtonProps = {
  circleId: string;
  onPaid: (circle: CircleDetail) => void;
};

type Stage = "idle" | "starting" | "capturing" | "confirming";

export default function PayButton({ circleId, onPaid }: PayButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stillPending, setStillPending] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function showError(code: string, message: string) {
    if (code === "UNAUTHENTICATED") {
      router.replace("/login");
      return;
    }
    setError(friendlyError(code, message));
  }

  async function waitForPaid() {
    // Check once immediately, then every 3 seconds for about 30 seconds.
    for (let attempt = 0; attempt <= POLL_ATTEMPTS; attempt += 1) {
      const result = await getCircle(circleId);
      if (!mountedRef.current) return;

      if (result.ok) {
        if (result.data.circle.viewerPaidThisCycle) {
          onPaid(result.data.circle);
          setBusy(false);
          setStage("idle");
          return;
        }
      } else if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login");
        return;
      }

      if (attempt === POLL_ATTEMPTS) break;

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (!mountedRef.current) return;
    }

    // PayPal's webhook can take longer than 30 seconds.
    setStillPending(true);
    setBusy(false);
    setStage("idle");
  }

  async function createOrder(): Promise<string | null> {
    setError(null);
    setStillPending(false);
    setBusy(true);
    setStage("starting");

    const started = await startPayment(circleId);
    if (!mountedRef.current) return null;

    if (!started.ok) {
      setBusy(false);
      setStage("idle");
      showError(started.error.code, started.error.message);
      return null;
    }

    return started.data.orderId;
  }

  async function approveOrder(orderId: string) {
    setStage("capturing");
    const captured = await capturePayment(circleId, orderId);
    if (!mountedRef.current) return;

    if (!captured.ok) {
      setBusy(false);
      setStage("idle");
      showError(captured.error.code, captured.error.message);
      return;
    }

    setStage("confirming");
    await waitForPaid();
  }

  async function handleTestPay() {
    const orderId = await createOrder();
    if (orderId) await approveOrder(orderId);
  }

  if (!USE_MOCKS) {
    return (
      <div className="flex flex-col gap-2">
        {/*
          PAYPAL SPOT
          Replace this placeholder with Anjola's checkout component once she
          shares its name. Wire it to:
            createOrder={createOrder}
            onApprove={(data) => approveOrder(data.orderID)}
          The capture + refetch loop lives in approveOrder / waitForPaid.
        */}
        <button
          type="button"
          disabled
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white opacity-60"
        >
          Pay
        </button>
        <p className="text-xs text-gray-500">Checkout will be connected here.</p>
      </div>
    );
  }

  const label =
    stage === "idle"
      ? "Pay (test)"
      : stage === "starting"
        ? "Starting payment..."
        : "Confirming payment...";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleTestPay}
        disabled={busy}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {stillPending ? (
        <p className="text-sm text-amber-800">
          Payment sent. It is still being confirmed, so this can take a little
          longer.
        </p>
      ) : null}
    </div>
  );
}
