// Country rules now live in /data/countries.ts so the signup form and the API share one list.
import { countryByCode } from '@/data/countries';

export const currencyFor = (code: string): string | undefined =>
  countryByCode(code)?.currency;

// Unknown codes are treated as supported so existing members are never locked out.
export const isPaypalSupported = (nationality: string): boolean =>
  countryByCode(nationality)?.paypalSupported ?? true;
