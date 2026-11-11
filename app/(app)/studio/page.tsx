"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CircleCard from "@/components/circles/CircleCard";
import MatchPanel from "@/components/match/MatchPanel";
import { friendlyError } from "@/components/forms/errorMessages";
import TierBadge from "@/components/ui/TierBadge";
import { getMe, listCircles } from "@/lib/api-client";
import type { CircleSummary, User } from "@/types/api";

type Filter = "all" | "safe" | "risky";
type Frequency = "weekly" | "monthly";
type Risk = "safe" | "risky";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "safe", label: "Safe" },
  { value: "risky", label: "Risky" },
];

export default function StudioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"browse" | "match">("browse");
  const urlParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const qAmount = urlParams.get("amount");
  const qFrequency = urlParams.get("frequency");
  const qRisk = urlParams.get("risk");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [meResult, circlesResult] = await Promise.all([
        getMe(),
        filter === "all" ? listCircles() : listCircles({ risk: filter }),
      ]);

      if (!active) return;

      const failed = !meResult.ok
        ? meResult
        : !circlesResult.ok
          ? circlesResult
          : null;

      if (failed) {
        if (failed.error.code === "UNAUTHENTICATED") {
          router.replace("/login");
          return;
        }
        setError(friendlyError(failed.error.code, failed.error.message));
        setLoading(false);
        return;
      }

      if (meResult.ok) setUser(meResult.data.user);
      if (circlesResult.ok) {
        // Mocks ignore the { risk } param, so filter again on the client.
        const risk = filter === "all" ? null : filter;
        setCircles(
          risk
            ? circlesResult.data.circles.filter(
                (circle) => circle.risk === risk
              )
            : circlesResult.data.circles
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [filter, reloadKey, router]);

  const ownTier = circles.filter((circle) => circle.ownTier);
  const lowerTiers = circles.filter((circle) => !circle.ownTier);

  return (
    <div className="min-h-dvh bg-white font-sans text-gray-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Circle Studio
          </p>

          <div className="flex items-center justify-between gap-3">
            {user ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {user.name}
                </h1>
                <TierBadge tier={user.tier} rank={user.rank} />
              </>
            ) : (
              <div
                className="h-9 w-40 animate-pulse rounded-lg bg-gray-100"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/circles/new"
              className="flex min-h-12 items-center justify-center rounded-xl bg-[#003087] px-4 text-center text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 sm:max-w-56"
            >
              Create circle
            </Link>
            <Link
              href="/join"
              className="flex min-h-12 items-center justify-center rounded-xl border border-[#003087] px-4 text-center text-base font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 sm:max-w-56"
            >
              Join with code
            </Link>
          </div>
        </header>

        <div role="tablist" aria-label="Studio view" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={view === "browse"}
            onClick={() => setView("browse")}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003087] focus-visible:ring-offset-2 ${
              view === "browse"
                ? "bg-[#ffd140] text-[#001c64]"
                : "text-gray-500 hover:text-[#001c64]"
            }`}
          >
            Browse circles
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "match"}
            onClick={() => setView("match")}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003087] focus-visible:ring-offset-2 ${
              view === "match"
                ? "bg-[#ffd140] text-[#001c64]"
                : "text-gray-500 hover:text-[#001c64]"
            }`}
          >
            Find my circle
          </button>
        </div>

        {view === "match" ? <MatchPanel initialAmount={qAmount ?? ''} initialFrequency={(qFrequency ?? '') as Frequency | ''} initialRisk={(qRisk ?? '') as Risk | ''} /> : (
        <>
        <div role="group" aria-label="Filter circles" className="flex gap-2">
          {FILTERS.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={selected}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 ${
                  selected
                    ? "bg-[#0070e0] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:border-[#0070e0]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <LoadingCircles />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : circles.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col gap-6">
            {ownTier.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1 rounded-full bg-[#ffd140]"
                    aria-hidden="true"
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Your tier
                  </h2>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {ownTier.map((circle) => (
                    <li key={circle.id}>
                      <CircleCard circle={circle} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {lowerTiers.length > 0 ? (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Lower tiers
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {lowerTiers.map((circle) => (
                    <li key={circle.id}>
                      <CircleCard circle={circle} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

function LoadingCircles() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
      <span className="sr-only">Loading circles...</span>
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-gray-200 p-4">
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <p className="text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const message =
    filter === "all"
      ? "No circles to show yet. Create one to start saving with your circle."
      : `No ${filter} circles right now. Try another filter or create a circle.`;

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <p className="text-sm text-gray-600">{message}</p>
      <Link
        href="/circles/new"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
      >
        Create circle
      </Link>
    </div>
  );
}
