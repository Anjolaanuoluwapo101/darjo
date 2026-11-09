// FX helpers: how steady a currency is against the US dollar, and a rough
// local-currency estimate for a payout.
//
// We always charge and pay out in US dollars. PayPal converts the payout into
// the receiver's own currency, so the numbers here are only for the risk label
// on a circle and for the estimate we show next to a payout.
import type { VolatilityLabel } from '@/types/api';

export interface Volatility {
  currency: string; // e.g. 'NGN'
  score: number; // 0 (very steady) to 100 (very volatile) against USD
  label: VolatilityLabel;
  asOf: string; // ISO date string
  source: 'live' | 'fallback';
}

// Fallback table used when the live rate history cannot be reached.
const FALLBACK_VOLATILITY: Record<string, { score: number; label: VolatilityLabel }> = {
  USD: { score: 0, label: 'low' },
  EUR: { score: 10, label: 'low' },
  GBP: { score: 12, label: 'low' },
  CAD: { score: 15, label: 'low' },
  AUD: { score: 18, label: 'low' },
  CHF: { score: 10, label: 'low' },
  JPY: { score: 15, label: 'low' },
  SGD: { score: 12, label: 'low' },
  HKD: { score: 14, label: 'low' },
  NZD: { score: 18, label: 'low' },
  SEK: { score: 16, label: 'low' },
  NOK: { score: 17, label: 'low' },
  DKK: { score: 12, label: 'low' },
  PLN: { score: 20, label: 'low' },
  CZK: { score: 18, label: 'low' },
  HUF: { score: 26, label: 'low' },
  ILS: { score: 22, label: 'low' },
  PHP: { score: 24, label: 'low' },
  IDR: { score: 28, label: 'low' },
  MXN: { score: 48, label: 'medium' },
  INR: { score: 45, label: 'medium' },
  BRL: { score: 50, label: 'medium' },
  ZAR: { score: 55, label: 'medium' },
  KES: { score: 52, label: 'medium' },
  ARS: { score: 95, label: 'high' },
  TRY: { score: 90, label: 'high' },
  NGN: { score: 85, label: 'high' },
  GHS: { score: 80, label: 'high' },
  EGP: { score: 88, label: 'high' },
};

const FALLBACK_SCORE = 50;

// Rough rates against one US dollar, used for the payout estimate only.
// Only the currencies PayPal lists for automatic conversion are here.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  AUD: 1.52,
  CAD: 1.36,
  EUR: 0.92,
  MXN: 17,
  GBP: 0.79,
  CHF: 0.88,
  SEK: 10.5,
  PLN: 4,
  NOK: 10.7,
  HUF: 360,
  DKK: 6.9,
  CZK: 23,
  ILS: 3.7,
  HKD: 7.8,
  NZD: 1.65,
  IDR: 15800,
  PHP: 58,
  JPY: 150,
  SGD: 1.34,
};

// Countries where PayPal cannot convert a payout into the local currency.
// The payout is still sent in US dollars and the receiver withdraws locally.
const NO_LOCAL_CONVERSION = new Set([
  'CN', 'IN', 'KR', 'TW', 'TH', 'TR',
  'AR', 'BO', 'CL', 'CO', 'CR', 'DO', 'EC', 'SV', 'GT', 'GY', 'HN', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE',
  'AG', 'AI', 'AW', 'BS', 'BB', 'BM', 'VG', 'KY', 'FK', 'GD', 'JM', 'MS', 'AN', 'VC', 'SR',
]);

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { data: Volatility; timestamp: number }>();

const normalize = (currency: string) => currency.trim().toUpperCase();

// The sync label the circle risk rules use. It never waits for the network.
export const volatilityLabel = (currency: string): VolatilityLabel => {
  const fallback = FALLBACK_VOLATILITY[normalize(currency)];
  if (fallback) return fallback.label;
  return FALLBACK_SCORE >= 50 ? 'medium' : 'low';
};

export const volatilityScore = (currency: string): number =>
  FALLBACK_VOLATILITY[normalize(currency)]?.score ?? FALLBACK_SCORE;

const labelForScore = (score: number): VolatilityLabel =>
  score < 25 ? 'low' : score < 60 ? 'medium' : 'high';

const isoDate = (daysBack: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
};

// Live daily rates against USD, used to measure how much a currency moves.
async function liveVolatility(currency: string): Promise<Volatility | null> {
  const from = isoDate(30);
  const to = isoDate(0);
  const res = await fetch(`https://api.frankfurter.app/${from}..${to}?from=USD&to=${currency}`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { rates?: Record<string, Record<string, number>> };
  const series = Object.values(body.rates ?? {})
    .map((row) => row[currency])
    .filter((value): value is number => typeof value === 'number');
  if (series.length < 5) return null;

  const changes: number[] = [];
  for (let i = 1; i < series.length; i++) changes.push((series[i] - series[i - 1]) / series[i - 1]);
  const mean = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const variance = changes.reduce((sum, c) => sum + (c - mean) ** 2, 0) / changes.length;
  const spread = Math.sqrt(variance) * 100; // daily standard deviation in percent

  const score = Math.min(100, Math.round(spread * 12));
  return {
    currency,
    score,
    label: labelForScore(score),
    asOf: new Date().toISOString(),
    source: 'live',
  };
}

// The live reading when we can get one, the fallback table otherwise.
export async function getVolatility(currency: string): Promise<Volatility> {
  const normalized = normalize(currency);
  if (normalized === 'USD') {
    return { currency: 'USD', score: 0, label: 'low', asOf: new Date().toISOString(), source: 'live' };
  }

  const cached = cache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;

  let result: Volatility;
  try {
    result = (await liveVolatility(normalized)) ?? {
      currency: normalized,
      score: volatilityScore(normalized),
      label: volatilityLabel(normalized),
      asOf: new Date().toISOString(),
      source: 'fallback',
    };
  } catch {
    result = {
      currency: normalized,
      score: volatilityScore(normalized),
      label: volatilityLabel(normalized),
      asOf: new Date().toISOString(),
      source: 'fallback',
    };
  }

  cache.set(normalized, { data: result, timestamp: Date.now() });
  return result;
}

export interface LocalEstimate {
  currency: string;
  amount: number;
  formatted: string;
  rate: number;
}

// What the payout is roughly worth in the receiver's own currency.
// PayPal does the real conversion, so this is only a guide.
export function estimateLocalAmount(
  usdCents: number,
  currency: string,
  countryCode?: string,
): LocalEstimate | null {
  const normalized = normalize(currency);
  if (normalized === 'USD') {
    return { currency: 'USD', amount: usdCents / 100, formatted: `$${(usdCents / 100).toFixed(2)}`, rate: 1 };
  }
  if (countryCode && NO_LOCAL_CONVERSION.has(countryCode.toUpperCase())) return null;
  const rate = FALLBACK_RATES[normalized];
  if (!rate) return null;

  const amount = (usdCents / 100) * rate;
  return {
    currency: normalized,
    amount,
    formatted: formatLocal(amount, normalized),
    rate,
  };
}

const SYMBOLS: Record<string, string> = {
  AUD: 'A$', BRL: 'R$', CAD: 'C$', CHF: 'CHF ', CNY: '¥', DKK: 'kr ', EUR: '€', GBP: '£',
  HKD: 'HK$', HUF: 'Ft ', IDR: 'Rp ', ILS: '₪', JPY: '¥', MXN: 'MX$', NOK: 'kr ', NZD: 'NZ$',
  PHP: '₱', PLN: 'zł ', SEK: 'kr ', SGD: 'S$',
};

const ZERO_DECIMAL = new Set(['HUF', 'JPY']);

export function formatLocal(amount: number, currency: string): string {
  const symbol = SYMBOLS[normalize(currency)] ?? `${normalize(currency)} `;
  const digits = ZERO_DECIMAL.has(normalize(currency)) ? 0 : 2;
  const fixed = amount.toFixed(digits);
  const [whole, part] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${grouped}${part ? `.${part}` : ''}`;
}
