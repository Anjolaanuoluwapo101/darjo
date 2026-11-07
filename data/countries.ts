// Source of truth for nationality, currency and PayPal availability.
// Keep this list in sync with the signup form and the payout rules.
export type Country = {
  code: string;
  name: string;
  currency: string;
  paypalSupported: boolean;
};

// PayPal cannot be used for contributions from these countries.
const NOT_SUPPORTED = ['CU', 'IR', 'KP', 'SD', 'SY'];

const raw: [code: string, name: string, currency: string][] = [
  ['AR', 'Argentina', 'ARS'],
  ['AU', 'Australia', 'AUD'],
  ['BR', 'Brazil', 'BRL'],
  ['CA', 'Canada', 'CAD'],
  ['CU', 'Cuba', 'CUP'],
  ['EG', 'Egypt', 'EGP'],
  ['FR', 'France', 'EUR'],
  ['DE', 'Germany', 'EUR'],
  ['GH', 'Ghana', 'GHS'],
  ['IN', 'India', 'INR'],
  ['IR', 'Iran', 'IRR'],
  ['IT', 'Italy', 'EUR'],
  ['JP', 'Japan', 'JPY'],
  ['KE', 'Kenya', 'KES'],
  ['MX', 'Mexico', 'MXN'],
  ['NG', 'Nigeria', 'NGN'],
  ['KP', 'North Korea', 'KPW'],
  ['SG', 'Singapore', 'SGD'],
  ['ZA', 'South Africa', 'ZAR'],
  ['ES', 'Spain', 'EUR'],
  ['SD', 'Sudan', 'SDG'],
  ['CH', 'Switzerland', 'CHF'],
  ['SY', 'Syria', 'SYP'],
  ['TR', 'Türkiye', 'TRY'],
  ['GB', 'United Kingdom', 'GBP'],
  ['US', 'United States', 'USD'],
];

export const COUNTRIES: Country[] = raw.map(([code, name, currency]) => ({
  code,
  name,
  currency,
  paypalSupported: !NOT_SUPPORTED.includes(code),
}));

export const countryByCode = (code: string): Country | undefined => {
  const normalized = code.trim().toUpperCase();
  return COUNTRIES.find((country) => country.code === normalized);
};

// Helper function: get country by ISO code
export function getCountry(code: string): Country | undefined {
  return countryByCode(code);
}

// Helper function: get currency by country ISO code
export function currencyFor(code: string): string | undefined {
  return getCountry(code)?.currency;
}

export const DISCLAIMER =
  'Payments are currently available for PayPal-supported countries only.';
export const DISCLAIMER =
  'PayPal availability and exchange rates vary by country. Amounts shown are estimates; the final charge is set by PayPal at checkout.';


