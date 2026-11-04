// TEMPORARY country data. Teammate C owns /data/countries.ts (the source of truth).
// Swap the lookups here for C's file once it lands; nothing else needs to change.
const CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', EG: 'EGP', IN: 'INR', BR: 'BRL', MX: 'MXN',
  TR: 'TRY', AR: 'ARS', JP: 'JPY', SG: 'SGD', CH: 'CHF',
  CU: 'CUP', IR: 'IRR', KP: 'KPW', SD: 'SDG', SY: 'SYP',
};

// Countries where PayPal cannot be used for a contribution.
const NOT_SUPPORTED = ['CU', 'IR', 'KP', 'SD', 'SY'];

export const currencyFor = (code: string): string | undefined => CURRENCY[code.toUpperCase()];

export const isPaypalSupported = (nationality: string): boolean =>
  !NOT_SUPPORTED.includes(nationality.toUpperCase());
