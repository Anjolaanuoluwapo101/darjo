"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import CountrySelect from "@/components/forms/CountrySelect";
import PasswordField from "@/components/forms/PasswordField";
import TextField from "@/components/forms/TextField";
import { friendlyError } from "@/components/forms/errorMessages";
import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Get started
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="text-sm text-muted">
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
          <Notice variant="warning">
            You can browse D&apos;arjo from your country, but payments are not
            available there yet.
          </Notice>
        ) : null}

        <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>

        {formError ? <Notice variant="error">{formError}</Notice> : null}

        <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
