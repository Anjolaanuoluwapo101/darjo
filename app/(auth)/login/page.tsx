"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { login } from "@/lib/api-client";
import Field from "@/components/forms/Field";

// Only allow same-origin paths as a post-login destination.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/studio";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login({ email, password });
    if (result.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setError(result.error.message);
    setBusy(false);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to see your circles.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field
          label="Email"
          htmlFor="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          htmlFor="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-risky-soft px-3 py-2 text-sm text-risky-ink">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        New here?{" "}
        <Link
          href={next === "/studio" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-accent hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
