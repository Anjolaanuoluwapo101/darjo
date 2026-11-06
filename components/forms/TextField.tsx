import { useId, type InputHTMLAttributes } from "react";
import {
  errorClass,
  hintClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from "./fieldStyles";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

// A labelled text input with an optional hint and error message.
export default function TextField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`${inputClass} ${
          error ? inputErrorClass : inputNormalClass
        } ${className ?? ""}`}
      />
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
