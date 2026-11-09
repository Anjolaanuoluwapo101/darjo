import { describe, expect, it } from 'vitest';
import {
  estimateLocalAmount,
  formatLocal,
  getVolatility,
  volatilityLabel,
} from '@/lib/fx';

describe('volatility', () => {
  it('labels a steady currency without waiting for the network', () => {
    expect(volatilityLabel('USD')).toBe('low');
    expect(volatilityLabel('JPY')).toBe('low');
    expect(volatilityLabel('NGN')).toBe('high');
    expect(volatilityLabel('USD')).toBe(volatilityLabel('usd'));
  });

  it('falls back to the table when the live rates cannot be reached', async () => {
    const volatility = await getVolatility('ZZZ');
    expect(volatility.source).toBe('fallback');
    expect(volatility.label).toBe('medium');
  });

  it('treats the US dollar as steady', async () => {
    const volatility = await getVolatility('USD');
    expect(volatility.score).toBe(0);
    expect(volatility.label).toBe('low');
  });
});

describe('local payout estimate', () => {
  it('converts a payout into the winner currency', () => {
    const estimate = estimateLocalAmount(49250, 'JPY', 'JP');
    expect(estimate).not.toBeNull();
    expect(estimate?.currency).toBe('JPY');
    expect(estimate?.amount).toBeGreaterThan(0);
    expect(estimate?.formatted).toContain('¥');
  });

  it('leaves a dollar payout in dollars', () => {
    const estimate = estimateLocalAmount(49250, 'USD', 'US');
    expect(estimate?.currency).toBe('USD');
    expect(estimate?.amount).toBe(492.5);
  });

  it('gives no estimate where PayPal cannot convert', () => {
    expect(estimateLocalAmount(49250, 'INR', 'IN')).toBeNull();
    expect(estimateLocalAmount(49250, 'CNY', 'CN')).toBeNull();
  });

  it('gives no estimate for a currency it does not know', () => {
    expect(estimateLocalAmount(49250, 'ZZZ', 'ZZ')).toBeNull();
  });

  it('formats a local amount with its symbol', () => {
    expect(formatLocal(1500, 'JPY')).toBe('¥1,500');
    expect(formatLocal(12.5, 'EUR')).toBe('€12.50');
  });
});
