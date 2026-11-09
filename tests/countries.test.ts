import { describe, expect, it } from 'vitest';
import { COUNTRIES, countryByCode } from '@/data/countries';
import { currencyFor, isPaypalSupported } from '@/lib/rules/countries';

describe('country list', () => {
  it('covers every country PayPal can pay out to', () => {
    const eligible = COUNTRIES.filter((c) => c.paypalSupported);
    expect(eligible.length).toBeGreaterThanOrEqual(90);
    expect(eligible.map((c) => c.code)).toContain('JP');
    expect(eligible.map((c) => c.code)).toContain('US');
    expect(eligible.map((c) => c.code)).toContain('GB');
  });

  it('keeps the countries PayPal cannot pay out to, but marks them unsupported', () => {
    for (const code of ['CU', 'EG', 'GH', 'IR', 'KP', 'NG', 'SD', 'SY']) {
      expect(countryByCode(code)).toBeDefined();
      expect(isPaypalSupported(code)).toBe(false);
    }
  });

  it('refuses a country that is not on the list', () => {
    expect(isPaypalSupported('ZZ')).toBe(false);
    expect(currencyFor('ZZ')).toBeUndefined();
  });

  it('gives every listed country a currency', () => {
    for (const country of COUNTRIES) {
      expect(currencyFor(country.code)).toBe(country.currency);
    }
    expect(currencyFor('JP')).toBe('JPY');
    expect(currencyFor('GB')).toBe('GBP');
  });
});
