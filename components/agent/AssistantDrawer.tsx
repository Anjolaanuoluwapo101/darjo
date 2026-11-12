"use client";

import { useEffect, useState } from "react";
import ChatPanel from "@/components/agent/ChatPanel";
import Button from "@/components/ui/Button";

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
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 2a8 8 0 0 0-8 8c0 1.5.4 2.9 1.2 4.1L2 18l4.1-1.1A8 8 0 1 0 10 2Zm0 14a6 6 0 0 1-3.1-.9l-.3-.2-2.4.6.6-2.3-.2-.3A6 6 0 1 1 10 16Z" />
        </svg>
        Ask the assistant
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="D'arjo assistant"
            className="flex max-h-[85dvh] w-full max-w-md flex-col gap-3 rounded-t-2xl border border-line bg-surface p-4 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {circleName ? `Ask about ${circleName}` : "Ask the assistant"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close the assistant"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
