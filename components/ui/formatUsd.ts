// Format whole integer US cents as a dollar string, e.g. 50000 -> "$500.00".
export function formatUsd(cents: number): string {
  // Round to the nearest cent so non-integer input still works.
  const total = Math.round(cents);
  const negative = total < 0;
  const abs = Math.abs(total);

  // Split using whole-number maths only.
  const dollars = Math.trunc(abs / 100);
  const remainder = abs % 100;
  const centsPart = String(remainder).padStart(2, "0");

  // Add thousands separators to the dollar part.
  const dollarsPart = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "-" : ""}$${dollarsPart}.${centsPart}`;
}
