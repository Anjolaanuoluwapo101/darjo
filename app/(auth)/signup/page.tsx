"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signup } from "@/lib/api-client";
import { COUNTRIES, DISCLAIMER, countryByCode } from "@/data/countries";
import Field from "@/components/forms/Field";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/studio";
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("US");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const country = countryByCode(nationality);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signup({ name, email, password, nationality });
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
      <h1 className="text-xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Save together, take turns.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field
          label="Name"
          htmlFor="name"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div>
          <label htmlFor="nationality" className="text-sm font-medium text-ink">
            Nationality
          </label>
          <select
            id="nationality"
            value={nationality}
            onChange={(event) => setNationality(event.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code}) — {item.currency}
              </option>
            ))}
          </select>
          {country ? (
            <p className="mt-1 text-xs text-muted">
              Contributions are charged in {country.currency}.
            </p>
          ) : null}
        </div>

        {country && !country.paypalSupported ? (
          <p className="rounded-lg bg-risky-soft px-3 py-2 text-sm text-risky-ink">
            PayPal cannot collect contributions from {country.name} yet. You can browse,
            but paying into a circle will fail.
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>

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
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={next === "/studio" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-accent hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
