"use client";

import { useEffect, useState } from "react";
import ChatPanel from "@/components/agent/ChatPanel";

type AssistantDrawerProps = {
  circleId: string;
  circleName?: string;
  onClose?: () => void;
};

// Slide-over that opens the assistant for one circle.
export default function AssistantDrawer({
  circleId,
  circleName,
  onClose,
}: AssistantDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    onClose?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffd140] px-4 text-sm font-bold text-[#001c64] transition hover:bg-[#f2c000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003087] focus-visible:ring-offset-2"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 2a8 8 0 0 0-8 8c0 1.5.4 2.9 1.2 4.1L2 18l4.1-1.1A8 8 0 1 0 10 2Zm0 14a6 6 0 0 1-3.1-.9l-.3-.2-2.4.6.6-2.3-.2-.3A6 6 0 1 1 10 16Z" />
        </svg>
        Ask the assistant
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="D'arjo assistant"
            className="flex max-h-[85dvh] w-full max-w-md flex-col gap-3 rounded-t-2xl border border-gray-200 bg-white p-4 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-[#001c64]">
                {circleName ? `Ask about ${circleName}` : "Ask the assistant"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close the assistant"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <ChatPanel circleId={circleId} circleName={circleName} />
          </div>
        </div>
      ) : null}
    </>
  );
}
