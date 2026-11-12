"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import CountrySelect from "@/components/forms/CountrySelect";
import PasswordField from "@/components/forms/PasswordField";
import TextField from "@/components/forms/TextField";
import { friendlyError } from "@/components/forms/errorMessages";
import PageContainer from "@/components/layout/PageContainer";
import { DISCLAIMER } from "@/data/countries";
import { signup } from "@/lib/api-client";
import { nextPath, redirectAfterAuth } from "@/lib/redirect";
import { isPaypalSupported } from "@/lib/rules/countries";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalityError, setNationalityError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const countryNotSupported = nationality
    ? !isPaypalSupported(nationality)
    : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNationalityError(null);

    if (!nationality) {
      setNationalityError("Please choose your nationality.");
      return;
    }

    setSubmitting(true);
    const result = await signup({ name, email, password, nationality });
    setSubmitting(false);

    if (result.ok) {
      redirectAfterAuth(router, nextPath());
      return;
    }

    if (result.error.code === "UNAUTHENTICATED") {
      router.push("/login");
      return;
    }

    // VALIDATION shows the server's own message; other codes get friendly text.
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-600">
            Join a savings circle and start building your D&apos;arjo score.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Okafor"
          />
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <CountrySelect
            value={nationality}
            onChange={setNationality}
            error={nationalityError ?? undefined}
          />

          {countryNotSupported ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can browse D&apos;arjo from your country, but payments are not
              available for your country yet.
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-gray-500">
            {DISCLAIMER}
          </p>

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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#0070e0] hover:underline"
          >
            Log in
          </Link>
        </p>
      </PageContainer>
    </main>
  );
}
