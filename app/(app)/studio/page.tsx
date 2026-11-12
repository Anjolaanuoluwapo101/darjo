"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CircleCard from "@/components/circles/CircleCard";
import MatchPanel from "@/components/match/MatchPanel";
import { friendlyError } from "@/components/forms/errorMessages";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import InfoNote from "@/components/ui/InfoNote";
import LinkButton from "@/components/ui/LinkButton";
import Notice from "@/components/ui/Notice";
import Section from "@/components/ui/Section";
import Skeleton from "@/components/ui/Skeleton";
import ToggleGroup from "@/components/ui/ToggleGroup";
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

const VIEW_OPTIONS = [
  { value: "browse", label: "Browse" },
  { value: "match", label: "Find my circle" },
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
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Circle Studio"
          title={user ? user.name : "Circle Studio"}
          description="Save with people you trust, on a rhythm that fits. Your tier decides how much you can take on."
          action={user ? <TierBadge tier={user.tier} rank={user.rank} /> : undefined}
        />

        <InfoNote>
          Risk tags reflect currency volatility and member mix, not a guarantee
          that everyone will pay. Your tier limits how much you can take on.
        </InfoNote>

        <div className="grid grid-cols-2 gap-3">
          <LinkButton href="/circles/new" size="lg">
            Create circle
          </LinkButton>
          <LinkButton href="/join" variant="outline" size="lg">
            Join with code
          </LinkButton>
        </div>

        <ToggleGroup
          label="Studio view"
          options={VIEW_OPTIONS}
          value={view}
          onChange={(value) => setView(value as "browse" | "match")}
        />

        {view === "match" ? (
          <MatchPanel
            initialAmount={qAmount ?? ""}
            initialFrequency={(qFrequency ?? "") as Frequency | ""}
            initialRisk={(qRisk ?? "") as Risk | ""}
          />
        ) : (
          <>
            <div
              role="group"
              aria-label="Filter circles"
              className="flex flex-wrap gap-2"
            >
              {FILTERS.map((option) => {
                const selected = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    aria-pressed={selected}
                    className={`min-h-9 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      selected
                        ? "border-primary bg-primary text-surface"
                        : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
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
              <Notice variant="error" title="Could not load circles">
                <p>{error}</p>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    Try again
                  </Button>
                </div>
              </Notice>
            ) : circles.length === 0 ? (
              <EmptyState
                title="No circles here yet"
                description={
                  filter === "all"
                    ? "Create a circle to start saving with people you trust."
                    : `There are no ${filter} circles right now. Try another filter or start your own.`
                }
                action={
                  <LinkButton href="/circles/new" size="sm">
                    Create circle
                  </LinkButton>
                }
              />
            ) : (
              <div className="flex flex-col gap-6">
                {ownTier.length > 0 ? (
                  <Section title="Your tier">
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {ownTier.map((circle) => (
                        <li key={circle.id}>
                          <CircleCard circle={circle} />
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}

                {lowerTiers.length > 0 ? (
                  <Section
                    title="Lower tiers"
                    description="Circles you can join as your score grows."
                  >
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {lowerTiers.map((circle) => (
                        <li key={circle.id}>
                          <CircleCard circle={circle} />
                        </li>
                      ))}
                    </ul>
                  </Section>
                ) : null}
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-soft">
          Invite-only by design. Share a code, keep the circle tight.
        </p>
      </div>
    </PageContainer>
  );
}

function LoadingCircles() {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading circles...</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
