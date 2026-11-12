"use client";

import {
  useId,
  useMemo,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { COUNTRIES, type Country } from "@/data/countries";
import {
  errorClass,
  hintClass,
  inputClass,
  inputErrorClass,
  inputNormalClass,
  labelClass,
} from "./fieldStyles";

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

type CountryMultiSelectProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  error?: string;
  blockedCodes?: string[];
  blockedLabel?: string;
};

export default function CountryMultiSelect({
  label,
  value,
  onChange,
  hint,
  error,
  blockedCodes = [],
  blockedLabel = "In other list",
}: CountryMultiSelectProps) {
  const baseId = useId();
  const inputId = `${baseId}-search`;
  const listId = `${baseId}-list`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = COUNTRIES.filter((country) =>
    value.includes(country.code)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return SORTED_COUNTRIES;
    return SORTED_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase().includes(search)
    );
  }, [query]);

  function toggle(country: Country) {
    if (value.includes(country.code)) {
      onChange(value.filter((code) => code !== country.code));
      return;
    }
    onChange([...value, country.code]);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(next)) setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
    }
  }

  return (
    <div className="flex flex-col gap-1.5" onBlur={handleBlur}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>

      {selected.length > 0 ? (
        <ul
          aria-label={`${label} selected`}
          className="flex flex-wrap gap-2"
        >
          {selected.map((country) => (
            <li key={country.code} className="max-w-full">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-3 py-1 pl-3 pr-1 text-sm text-ink">
                <span className="truncate">{country.name}</span>
                <button
                  type="button"
                  onClick={() => toggle(country)}
                  aria-label={`Remove ${country.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="m4 4 8 8M12 4l-8 8" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          placeholder="Search countries"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`${inputClass} ${
            error ? inputErrorClass : inputNormalClass
          }`}
        />

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-20 mt-1 max-h-[min(16rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-muted">
                No countries found
              </li>
            ) : (
              filtered.map((country) => {
                const isSelected = value.includes(country.code);
                const isBlocked = blockedCodes.includes(country.code);

                return (
                  <li
                    key={country.code}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => toggle(country)}
                      className="flex min-h-12 w-full items-center justify-between gap-2 px-4 py-2 text-left text-base text-ink hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-surface"
                              : "border-line-strong bg-surface"
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected ? (
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M3 8.5 6.5 12 13 4.5" />
                            </svg>
                          ) : null}
                        </span>
                        <span className="truncate">{country.name}</span>
                      </span>

                      {isBlocked ? (
                        <span className="shrink-0 text-xs font-medium text-risky-ink">
                          {blockedLabel}
                        </span>
                      ) : isSelected ? (
                        <span className="shrink-0 text-xs font-medium text-accent">
                          Added
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-soft">
                          {country.code}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
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
