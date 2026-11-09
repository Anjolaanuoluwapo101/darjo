// Country rules now live in /data/countries.ts so the signup form and the API share one list.
import { countryByCode } from '@/data/countries';

export const currencyFor = (code: string): string | undefined =>
  countryByCode(code)?.currency;

// A country we do not know about is not treated as supported: PayPal cannot pay
// out to a country that is missing from our list, so the payment is refused early.
export const isPaypalSupported = (nationality: string): boolean =>
  countryByCode(nationality)?.paypalSupported ?? false;
