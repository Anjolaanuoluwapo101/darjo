import type { InputHTMLAttributes } from "react";
import { inputClass, inputNormalClass, labelClass } from "./fieldStyles";

type FieldProps = {
  label: string;
  htmlFor: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, htmlFor, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <input
        id={htmlFor}
        className={`${inputClass} ${inputNormalClass}`}
        {...props}
      />
    </div>
  );
}
