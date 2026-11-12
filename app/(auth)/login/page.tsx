"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import PasswordField from "@/components/forms/PasswordField";
import TextField from "@/components/forms/TextField";
import { friendlyError } from "@/components/forms/errorMessages";
import PageContainer from "@/components/layout/PageContainer";
import { login } from "@/lib/api-client";
import { nextPath, redirectAfterAuth } from "@/lib/redirect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);

    if (result.ok) {
      redirectAfterAuth(router, nextPath());
      return;
    }

    // Already on /login, so show the error instead of redirecting to the same page.
    if (result.error.code === "UNAUTHENTICATED") {
      setFormError("Email or password is incorrect.");
      return;
    }

    setFormError(
      result.error.code === "VALIDATION"
        ? result.error.message
        : friendlyError(result.error.code, result.error.message)
    );
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <PageContainer width="narrow" className="py-10">
        <header className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0070e0]">
            D&apos;arjo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-600">
            Log in to see your circle and keep saving.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ada@example.com"
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

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
            className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#003087] px-5 text-base font-semibold text-white transition hover:bg-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          New to D&apos;arjo?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#0070e0] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </PageContainer>
    </main>
  );
}
