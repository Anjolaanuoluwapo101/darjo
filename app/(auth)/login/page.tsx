"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import PasswordField from "@/components/forms/PasswordField";
import TextField from "@/components/forms/TextField";
import { friendlyError } from "@/components/forms/errorMessages";
import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Welcome back
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Log in to D&apos;arjo
        </h1>
        <p className="text-sm text-muted">
          Pick up where your circle left off.
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

        {formError ? <Notice variant="error">{formError}</Notice> : null}

        <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
          {submitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        New to D&apos;arjo?{" "}
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
