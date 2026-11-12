"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { friendlyError } from "@/components/forms/errorMessages";
import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";
import { capturePayment, getCircle, startPayment } from "@/lib/api-client";
import type { CircleDetail } from "@/types/api";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
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
  const [cancelled, setCancelled] = useState(false);
  const mountedRef = useRef(true);
  const errorShownRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function showError(code: string, message: string) {
    errorShownRef.current = true;
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

    // The provider's webhook can take longer than 30 seconds.
    setStillPending(true);
    setBusy(false);
    setStage("idle");
  }

  async function createOrder(): Promise<string | null> {
    errorShownRef.current = false;
    setError(null);
    setStillPending(false);
    setCancelled(false);
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

  async function createPayPalOrder(): Promise<string> {
    const orderId = await createOrder();
    if (!orderId) throw new Error("Could not start the payment");
    return orderId;
  }

  function handleCancel() {
    setBusy(false);
    setStage("idle");
    setError(null);
    setStillPending(false);
    setCancelled(true);
  }

  function handlePayPalError(paypalError: Record<string, unknown>) {
    setBusy(false);
    setStage("idle");

    if (errorShownRef.current) return;

    errorShownRef.current = true;
    const message =
      typeof paypalError.message === "string"
        ? paypalError.message
        : "The payment provider had a problem, please try again.";
    setError(friendlyError("PAYPAL_ERROR", message));
  }

  const showTestButton = USE_MOCKS || !PAYPAL_CLIENT_ID;

  const testLabel =
    stage === "idle"
      ? "Pay (test)"
      : stage === "starting"
        ? "Starting payment..."
        : "Confirming payment...";

  return (
    <div className="flex flex-col gap-2">
      {showTestButton ? (
        <Button
          type="button"
          size="lg"
          fullWidth
          onClick={handleTestPay}
          loading={busy}
        >
          {testLabel}
        </Button>
      ) : (
        <div className="w-full">
          <PayPalButtons
            className="w-full"
            disabled={busy}
            style={{
              layout: "vertical",
              shape: "rect",
              label: "pay",
              height: 48,
            }}
            createOrder={createPayPalOrder}
            onApprove={(data) => approveOrder(data.orderID)}
            onCancel={handleCancel}
            onError={handlePayPalError}
          />
        </div>
      )}

      {!showTestButton && stage === "confirming" ? (
        <p role="status" className="text-sm text-muted">
          Payment approved. Waiting for confirmation...
        </p>
      ) : null}

      {error ? <Notice variant="error">{error}</Notice> : null}

      {cancelled ? (
        <p className="text-sm text-muted">
          Payment cancelled. No money was taken.
        </p>
      ) : null}

      {stillPending ? (
        <Notice variant="warning">
          Payment sent. It is still being confirmed, so this can take a little
          longer.
        </Notice>
      ) : null}
    </div>
  );
}
