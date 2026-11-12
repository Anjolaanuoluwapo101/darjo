"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import {
  errorClass,
  hintClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from "./fieldStyles";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  hint?: string;
  error?: string;
};

// A password input with a Show / Hide toggle.
export default function PasswordField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${
            error ? inputErrorClass : inputNormalClass
          } pr-16 ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-1 my-1 flex min-w-12 items-center justify-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
