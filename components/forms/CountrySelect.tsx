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

type CountrySelectProps = {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  error?: string;
};

// A searchable list of countries. Shows the chosen country's currency underneath.
export default function CountrySelect({
  value,
  onChange,
  label = "Nationality",
  error,
}: CountrySelectProps) {
  const baseId = useId();
  const inputId = `${baseId}-country`;
  const listId = `${baseId}-country-list`;
  const errorId = `${baseId}-country-error`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = COUNTRIES.find((country) => country.code === value);
  const currency = selected?.currency;

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return SORTED_COUNTRIES;
    return SORTED_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase().includes(search)
    );
  }, [query]);

  function choose(country: Country) {
    onChange(country.code);
    setQuery("");
    setOpen(false);
  }

  // Close only when focus leaves the whole field, so keyboard users can tab into the list.
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
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="country-name"
          placeholder="Search countries"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          spellCheck={false}
          value={open ? query : selected ? `${selected.name} (${selected.code})` : ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${inputClass} ${
            error ? inputErrorClass : inputNormalClass
          }`}
        />
        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-[min(16rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">
                No countries found
              </li>
            ) : (
              filtered.map((country) => (
                <li
                  key={country.code}
                  role="option"
                  aria-selected={country.code === value}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(country)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-base text-gray-900 hover:bg-indigo-50 focus-visible:bg-indigo-50 focus-visible:outline-none"
                  >
                    <span>{country.name}</span>
                    <span className="text-sm text-gray-500">{country.code}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {currency ? (
        <p className={hintClass}>Currency: {currency}</p>
      ) : (
        <p className={hintClass}>Choose the country you are from.</p>
      )}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
