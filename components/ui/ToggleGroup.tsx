"use client";

import { cn } from "./cn";

export type ToggleOption = {
  value: string;
  label: string;
  description?: string;
};

type ToggleGroupProps = {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export default function ToggleGroup({
  options,
  value,
  onChange,
  label,
  className,
}: ToggleGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <span className="text-sm font-medium text-ink">{label}</span>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              )}
            >
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-xs font-normal text-muted">
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
