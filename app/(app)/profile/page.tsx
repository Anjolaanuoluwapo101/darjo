"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ScoreRing from "@/components/profile/ScoreRing";
import TierBadge from "@/components/ui/TierBadge";
import { friendlyError } from "@/components/forms/errorMessages";
import { getProfile, getVolatility, type VolatilityReading } from "@/lib/api-client";
import type { ProfileData } from "@/types/api";

const VOLATILITY_TEXT: Record<VolatilityReading["label"], string> = {
  low: "Your currency is steady against the US dollar, so your payments hold their value.",
  medium: "Your currency moves a little against the US dollar, so the real cost can change.",
  high: "Your currency swings against the US dollar, so payments can cost you more than you expect.",
};

const EVENT_TEXT: Record<ProfileData["events"][number]["type"], string> = {
  on_time: "Paid on time",
  recovered: "Caught up after being late",
  late: "Paid late",
  failed: "Missed a payment",
};

const CIRCLE_STATUS: Record<ProfileData["circles"][number]["status"], string> = {
  open: "Open",
  active: "Active",
  completed: "Completed",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [volatility, setVolatility] = useState<VolatilityReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await getProfile();
      if (!active) return;

      if (!result.ok) {
        if (result.error.code === "UNAUTHENTICATED") {
          router.replace("/login");
          return;
        }
        setError(friendlyError(result.error.code, result.error.message));
        setLoading(false);
        return;
      }

      setProfile(result.data);
      setLoading(false);

      // The volatility reading is a nice-to-have, so a failure here must not
      // take the whole page down.
      const reading = await getVolatility(result.data.user.currency);
      if (active && reading.ok) setVolatility(reading.data);
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Profile
          </p>

          {profile ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {profile.user.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile.user.currency} · {profile.user.nationality}
                </p>
              </div>
              <TierBadge tier={profile.user.tier} rank={profile.user.rank} />
            </div>
          ) : (
            <div
              className="h-9 w-40 animate-pulse rounded-lg bg-gray-100"
              aria-hidden="true"
            />
          )}
        </header>

        {loading ? (
          <div role="status" aria-live="polite" className="flex flex-col gap-3">
            <span className="sr-only">Loading profile...</span>
            <div className="h-44 animate-pulse rounded-2xl border border-gray-200" />
            <div className="h-24 animate-pulse rounded-2xl border border-gray-200" />
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
        ) : profile ? (
          <>
            <section className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 p-6">
              <ScoreRing score={profile.user.score} />
              <p className="text-center text-sm text-gray-600">
                {profile.nextTier.requirement}
              </p>
            </section>

            {volatility ? (
              <section className="flex flex-col gap-2 rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {volatility.currency} risk
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      volatility.label === "low"
                        ? "bg-safe-soft text-safe-ink"
                        : volatility.label === "medium"
                          ? "bg-[#fff4d6] text-[#7a5200]"
                          : "bg-risky-soft text-risky-ink"
                    }`}
                  >
                    {volatility.label} volatility
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">
                  {VOLATILITY_TEXT[volatility.label]}
                </p>
                <p className="text-xs text-gray-500">
                  {volatility.source === "live"
                    ? "Live reading from the market"
                    : "Our own reference table"}
                </p>
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Your circles
              </h2>
              {profile.circles.length === 0 ? (
                <p className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  You are not in a circle yet.{" "}
                  <Link
                    href="/studio"
                    className="font-semibold text-[#0070e0] underline"
                  >
                    Find one in the Studio
                  </Link>
                  .
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.circles.map((circle) => (
                    <li key={circle.id}>
                      <Link
                        href={`/circles/${circle.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4 transition hover:border-[#0070e0]"
                      >
                        <span className="font-medium">{circle.name}</span>
                        <span className="text-sm text-gray-500">
                          {CIRCLE_STATUS[circle.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Link
              href="/assistant"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#003087] px-4 text-sm font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
            >
              Ask the assistant to explain my score
            </Link>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Score history
              </h2>
              {profile.events.length === 0 ? (
                <p className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  Your score history will appear here once you pay a cycle.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{EVENT_TEXT[event.type]}</span>
                        <span className="text-sm text-gray-500">
                          {event.circleName} · {formatDate(event.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          event.points >= 0 ? "text-safe-ink" : "text-risky-ink"
                        }`}
                      >
                        {event.points >= 0 ? "+" : ""}
                        {event.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
