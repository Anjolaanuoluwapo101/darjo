import type { InputHTMLAttributes } from "react";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60 focus-visible:ring-2 focus-visible:ring-accent";

type FieldProps = {
  label: string;
  htmlFor: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, htmlFor, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input id={htmlFor} className={fieldClass} {...props} />
    </div>
  );
}
