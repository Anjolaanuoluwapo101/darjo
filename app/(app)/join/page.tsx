"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import TextField from "@/components/forms/TextField";
import { friendlyError } from "@/components/forms/errorMessages";
import { joinCircle } from "@/lib/api-client";

export default function JoinPage() {
  return (
    <div className="min-h-full bg-white font-sans text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-8">
        <header className="flex flex-col gap-2">
          <Link
            href="/studio"
            className="inline-flex w-fit items-center gap-1 rounded-lg text-sm font-medium text-[#0070e0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Circle Studio
          </Link>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            Join a circle
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Enter an invite code
          </h1>
          <p className="text-sm text-gray-600">
            Ask the circle&apos;s creator for the code, then join in one tap.
          </p>
        </header>

        <Suspense fallback={<JoinFormLoading />}>
          <JoinForm />
        </Suspense>
      </div>
    </div>
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
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
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
      />

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{formError}</p>
          {errorCode === "NOT_FOUND" ? (
            <p className="mt-1 text-xs text-red-600">
              Check the code with the person who invited you.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Joining..." : "Join"}
      </button>
    </form>
  );
}

function JoinFormLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <span className="sr-only">Loading the join form...</span>
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}
