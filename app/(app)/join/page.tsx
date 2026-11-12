"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import TextField from "@/components/forms/TextField";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { friendlyError } from "@/components/forms/errorMessages";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import InfoNote from "@/components/ui/InfoNote";
import Notice from "@/components/ui/Notice";
import Skeleton from "@/components/ui/Skeleton";
import { joinCircle } from "@/lib/api-client";

export default function JoinPage() {
  return (
    <PageContainer width="narrow">
      <div className="flex flex-col gap-6">
        <Link
          href="/studio"
          className="inline-flex w-fit items-center gap-1 rounded-lg text-sm font-medium text-accent outline-none hover:text-accent-hover hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Circle Studio
        </Link>

        <PageHeader
          eyebrow="Join a circle"
          title="Enter an invite code"
          description="Ask the circle's creator for the code, then join in one tap."
        />

        <InfoNote variant="warning" title="Check before you join">
          Joining commits you to the contribution schedule. Confirm the invite
          code and the circle rules with its creator first.
        </InfoNote>

        <Card>
          <Suspense fallback={<JoinFormLoading />}>
            <JoinForm />
          </Suspense>
        </Card>

        <p className="text-sm text-muted">
          Don&apos;t have a code?{" "}
          <Link
            href="/circles/new"
            className="font-medium text-accent hover:underline"
          >
            Start your own circle
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(() =>
    (searchParams.get("code") ?? "").trim().toUpperCase()
  );
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Keep the prefilled invite code in sync when navigating between circles
  // on the same join route (the page component is not remounted).
  useEffect(() => {
    const code = (searchParams.get("code") ?? "").trim().toUpperCase();
    if (code !== inviteCode) setInviteCode(code);
  }, [searchParams, inviteCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setErrorCode(null);

    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCodeError("Enter the invite code from your circle's creator.");
      return;
    }

    setCodeError(null);
    setSubmitting(true);

    const result = await joinCircle({ inviteCode: normalizedCode });

    setSubmitting(false);

    if (result.ok) {
      router.push(`/circles/${result.data.circle.id}`);
      return;
    }

    if (result.error.code === "UNAUTHENTICATED") {
      router.replace("/login");
      return;
    }

    setErrorCode(result.error.code);
    setFormError(
      result.error.code === "VALIDATION"
        ? result.error.message
        : friendlyError(result.error.code, result.error.message)
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Invite code"
        name="inviteCode"
        required
        value={inviteCode}
        onChange={(event) => {
          setInviteCode(event.target.value.toUpperCase());
          if (codeError) setCodeError(null);
        }}
        placeholder="AJO-7K2Q"
        hint="The invite code comes from the circle's creator."
        error={codeError ?? undefined}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        inputMode="text"
        className="font-mono tracking-[0.2em]"
      />

      {formError ? (
        <Notice variant="error" title="Could not join">
          <p>{formError}</p>
          {errorCode === "NOT_FOUND" ? (
            <p className="mt-1 text-xs opacity-80">
              Check the code with the person who invited you.
            </p>
          ) : null}
        </Notice>
      ) : null}

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {submitting ? "Joining..." : "Join circle"}
      </Button>
    </form>
  );
}

function JoinFormLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <span className="sr-only">Loading the join form...</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
