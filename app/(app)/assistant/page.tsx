"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/agent/ChatPanel";
import CircleDetailsDrawer from "@/components/agent/CircleDetailsDrawer";
import { friendlyError } from "@/components/forms/errorMessages";
import PageContainer from "@/components/layout/PageContainer";
import { listCircles } from "@/lib/api-client";
import type { CircleSummary } from "@/types/api";

export default function AssistantPage() {
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await listCircles({ mine: true });
      if (!active) return;

      if (!result.ok) {
        setError(friendlyError(result.error.code, result.error.message));
        setLoading(false);
        return;
      }

      setCircles(result.data.circles);
      setSelectedId((current) => current || result.data.circles[0]?.id || "");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selected = circles.find((circle) => circle.id === selectedId);

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <PageContainer>
        <header className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Assistant
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ask about your money circle
          </h1>
          <p className="text-sm text-gray-600">
            The assistant reads your circles, payments and payouts for you.
          </p>
        </header>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="h-11 animate-pulse rounded-xl bg-gray-100"
          >
            <span className="sr-only">Loading circles...</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {circles.length === 0 ? (
              <p className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                You are not in a circle yet.{" "}
                <Link
                  href="/studio"
                  className="font-semibold text-[#0070e0] underline"
                >
                  Find one in the Studio
                </Link>
                , then come back to ask about it.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="assistant-circle"
                    className="text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Circle
                  </label>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    disabled={!selected}
                    className="min-h-10 rounded-full border border-gray-200 px-3.5 text-sm text-gray-700 transition hover:border-[#0070e0] hover:text-[#0070e0] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
                  >
                    Circle details
                  </button>
                </div>
                <select
                  id="assistant-circle"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus-visible:border-[#0070e0] focus-visible:ring-2 focus-visible:ring-[#0070e0]"
                >
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ChatPanel
              circleId={selectedId || undefined}
              circleName={selected?.name}
            />

            <CircleDetailsDrawer
              circle={detailsOpen ? selected ?? null : null}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        )}
      </PageContainer>
    </main>
  );
}
