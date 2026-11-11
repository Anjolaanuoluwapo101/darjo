"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import CountryMultiSelect from "@/components/forms/CountryMultiSelect";
import TextField from "@/components/forms/TextField";
import PageContainer from "@/components/layout/PageContainer";
import { friendlyError } from "@/components/forms/errorMessages";
import {
  errorClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from "@/components/forms/fieldStyles";
import TierBadge from "@/components/ui/TierBadge";
import { formatUsd } from "@/components/ui/formatUsd";
import { countryByCode } from "@/data/countries";
import { createCircle, getMe } from "@/lib/api-client";
import type { User } from "@/types/api";

type Frequency = "weekly" | "monthly";

type FormErrors = {
  name?: string;
  contribution?: string;
  memberLimit?: string;
};

const MEMBER_LIMITS = Array.from({ length: 11 }, (_, index) => index + 2);

function parseDollarsToCents(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = Number(wholePart);
  const fraction = Number((fractionPart + "00").slice(0, 2));

  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) {
    return null;
  }

  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) ? cents : null;
}

function countryName(code: string): string {
  return countryByCode(code)?.name ?? code;
}

export default function NewCirclePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userReloadKey, setUserReloadKey] = useState(0);

  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [memberLimit, setMemberLimit] = useState(5);
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [countryError, setCountryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const memberLimitId = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const suggestedName = params.get("name");
    const suggestedAmount = params.get("amount");
    const suggestedFrequency = params.get("frequency");
    const suggestedMembers = Number(params.get("members"));

    if (suggestedName) setName(suggestedName.slice(0, 60));
    if (suggestedAmount && /^\d+(\.\d{1,2})?$/.test(suggestedAmount)) {
      setContribution(suggestedAmount);
    }
    if (suggestedFrequency === "weekly" || suggestedFrequency === "monthly") {
      setFrequency(suggestedFrequency);
    }
    if (Number.isInteger(suggestedMembers) && suggestedMembers >= 2 && suggestedMembers <= 12) {
      setMemberLimit(suggestedMembers);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setUserLoading(true);
      setUserError(null);

      const result = await getMe();
      if (!active) return;

      if (result.ok) {
        setUser(result.data.user);
        setUserLoading(false);
        return;
      }

      if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login");
        return;
      }

      setUserError(friendlyError(result.error.code, result.error.message));
      setUserLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [userReloadKey, router]);

  const parsedContribution = parseDollarsToCents(contribution);
  const contributionCents =
    parsedContribution !== null && parsedContribution > 0
      ? parsedContribution
      : null;
  const potCents =
    contributionCents === null ? 0 : contributionCents * memberLimit;

  function updateIncluded(next: string[]) {
    const conflict = next.find((code) => excluded.includes(code));
    if (conflict) {
      setCountryError(
        `${countryName(conflict)} is already in Exclude. Remove it there first.`
      );
      return;
    }
    setCountryError(null);
    setIncluded(next);
  }

  function updateExcluded(next: string[]) {
    const conflict = next.find((code) => included.includes(code));
    if (conflict) {
      setCountryError(
        `${countryName(conflict)} is already in Include. Remove it there first.`
      );
      return;
    }
    setCountryError(null);
    setExcluded(next);
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Give your circle a name.";
    }

    const cents = parseDollarsToCents(contribution);
    if (cents === null) {
      nextErrors.contribution =
        "Enter a valid dollar amount, for example 100 or 100.50.";
    } else if (cents <= 0) {
      nextErrors.contribution = "The contribution must be greater than $0.00.";
    } else if (!Number.isSafeInteger(cents * memberLimit)) {
      nextErrors.contribution = "That amount is too large.";
    }

    if (memberLimit < 2 || memberLimit > 12) {
      nextErrors.memberLimit = "Choose between 2 and 12 members.";
    }

    setErrors(nextErrors);

    const overlap = included.filter((code) => excluded.includes(code));
    if (overlap.length > 0) {
      setCountryError(
        `${overlap.map(countryName).join(", ")} cannot be in both Include and Exclude.`
      );
    } else {
      setCountryError(null);
    }

    return Object.keys(nextErrors).length === 0 && overlap.length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    const cents = parseDollarsToCents(contribution);
    if (cents === null || cents <= 0) return;

    setSubmitting(true);

    const result = await createCircle({
      name: name.trim(),
      contributionCents: cents,
      frequency,
      memberLimit,
      includedNationalities: included,
      excludedNationalities: excluded,
    });

    if (!result.ok) {
      setSubmitting(false);
      if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login");
        return;
      }
      setFormError(
        result.error.code === "VALIDATION"
          ? result.error.message
          : friendlyError(result.error.code, result.error.message)
      );
      return;
    }

    router.push(`/circles/${result.data.circle.id}`);
  }

  return (
    <div className="min-h-full bg-white font-sans text-gray-900">
      <PageContainer>
        <header className="flex flex-col gap-2">
          <Link
            href="/studio"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-[#0070e0] hover:underline"
          >
            <span aria-hidden="true">&larr;</span>
            Back to studio
          </Link>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Create a circle
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Start a savings circle
          </h1>
          <p className="text-sm text-gray-600">
            Set the amount, rhythm and who can join.
          </p>
        </header>

        {userLoading ? (
          <PageLoading />
        ) : userError ? (
          <PageError
            message={userError}
            onRetry={() => setUserReloadKey((key) => key + 1)}
          />
        ) : user ? (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <TextField
              label="Circle name"
              name="name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              placeholder="Weekend Savers"
              error={errors.name}
            />

            <TextField
              label="Contribution (USD)"
              name="contribution"
              required
              inputMode="decimal"
              autoComplete="off"
              value={contribution}
              onChange={(event) => {
                setContribution(event.target.value);
                if (errors.contribution) {
                  setErrors((current) => ({
                    ...current,
                    contribution: undefined,
                  }));
                }
              }}
              placeholder="100"
              hint="Enter dollars, for example 100 or 100.50."
              error={errors.contribution}
            />

            <fieldset className="flex flex-col gap-1.5">
              <legend className={labelClass}>Frequency</legend>
              <div role="group" className="grid grid-cols-2 gap-2">
                {(["weekly", "monthly"] as const).map((option) => {
                  const selected = frequency === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFrequency(option)}
                      aria-pressed={selected}
                      className={`min-h-12 rounded-xl px-4 text-base font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 ${
                        selected
                          ? "bg-[#003087] text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:border-[#0070e0]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={memberLimitId} className={labelClass}>
                Member limit
              </label>
              <select
                id={memberLimitId}
                value={memberLimit}
                onChange={(event) => {
                  setMemberLimit(Number(event.target.value));
                  if (errors.memberLimit) {
                    setErrors((current) => ({
                      ...current,
                      memberLimit: undefined,
                    }));
                  }
                }}
                className={`${inputClass} ${
                  errors.memberLimit ? inputErrorClass : inputNormalClass
                }`}
              >
                {MEMBER_LIMITS.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit} members
                  </option>
                ))}
              </select>
              {errors.memberLimit ? (
                <p className={errorClass}>{errors.memberLimit}</p>
              ) : null}
            </div>

            <CountryMultiSelect
              label="Include nationalities"
              value={included}
              onChange={updateIncluded}
              hint="Leave empty to include everyone."
              blockedCodes={excluded}
              blockedLabel="In exclude"
            />

            <CountryMultiSelect
              label="Exclude nationalities"
              value={excluded}
              onChange={updateExcluded}
              hint="People from excluded nationalities will not see this circle."
              blockedCodes={included}
              blockedLabel="In include"
            />

            {countryError ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {countryError}
              </p>
            ) : null}

            <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-base font-semibold">Circle summary</h2>

              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-600">Contribution</dt>
                  <dd className="font-medium text-[#001c64]">
                    {formatUsd(contributionCents ?? 0)}{" "}
                    <span className="font-normal text-gray-500">
                      {frequency}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-600">Pot size</dt>
                  <dd className="font-semibold text-[#001c64]">
                    {formatUsd(potCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-600">Number of cycles</dt>
                  <dd className="font-medium">{memberLimit}</dd>
                </div>
              </dl>

              <p className="text-sm text-gray-600">
                D&apos;arjo keeps 1.5% of each payout.
              </p>

              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 text-sm text-gray-600">
                <span>This circle will take your tier</span>
                <TierBadge tier={user.tier} rank={user.rank} />
              </div>
            </section>

            {formError ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating circle..." : "Create circle"}
            </button>
          </form>
        ) : null}
      </PageContainer>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <span className="sr-only">Loading the create-circle form...</span>
      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}

function PageError({
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003087] px-4 text-sm font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/studio"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#003087] px-4 text-sm font-semibold text-[#003087] transition hover:bg-[#003087] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
        >
          Back to studio
        </Link>
      </div>
    </div>
  );
}
