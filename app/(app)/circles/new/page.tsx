"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import CountryMultiSelect from "@/components/forms/CountryMultiSelect";
import TextField from "@/components/forms/TextField";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { friendlyError } from "@/components/forms/errorMessages";
import {
  errorClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from "@/components/forms/fieldStyles";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import InfoNote from "@/components/ui/InfoNote";
import Notice from "@/components/ui/Notice";
import Skeleton from "@/components/ui/Skeleton";
import ToggleGroup from "@/components/ui/ToggleGroup";
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

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

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
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Link
          href="/studio"
          className="inline-flex w-fit items-center gap-1 rounded-lg text-sm font-medium text-accent outline-none hover:text-accent-hover hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span aria-hidden="true">&larr;</span>
          Back to studio
        </Link>

        <PageHeader
          eyebrow="Create a circle"
          title="Start a savings circle"
          description="Set the amount, rhythm and who can join."
        />

        <InfoNote variant="warning" title="Set the rules carefully">
          Contribution size, rhythm and member limit are fixed once members
          join. Changing them means starting a new circle.
        </InfoNote>

        {userLoading ? (
          <PageLoading />
        ) : userError ? (
          <Notice variant="error" title="Could not load your account">
            <p>{userError}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setUserReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
              <Link
                href="/studio"
                className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-medium underline-offset-2 hover:underline"
              >
                Back to studio
              </Link>
            </div>
          </Notice>
        ) : user ? (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Card className="flex flex-col gap-5">
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

              <ToggleGroup
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                value={frequency}
                onChange={(value) => setFrequency(value as Frequency)}
              />

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
            </Card>

            <Card className="flex flex-col gap-5">
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
            </Card>

            {countryError ? (
              <Notice variant="error">{countryError}</Notice>
            ) : null}

            <Card className="flex flex-col gap-4 bg-surface-2">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Circle summary
              </h2>

              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Contribution</dt>
                  <dd className="font-medium text-ink">
                    {formatUsd(contributionCents ?? 0)}{" "}
                    <span className="font-normal capitalize text-muted">
                      {frequency}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Pot size</dt>
                  <dd className="font-semibold text-ink">{formatUsd(potCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Number of cycles</dt>
                  <dd className="font-medium text-ink">{memberLimit}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-sm text-muted">D&apos;arjo keeps 1.5% of each payout.</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>Your tier</span>
                  <TierBadge tier={user.tier} rank={user.rank} />
                </div>
              </div>
            </Card>

            {formError ? (
              <Notice variant="error" title="Could not create circle">
                {formError}
              </Notice>
            ) : null}

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              {submitting ? "Creating circle..." : "Create circle"}
            </Button>
          </form>
        ) : null}
      </div>
    </PageContainer>
  );
}

function PageLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <span className="sr-only">Loading the create-circle form...</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}
