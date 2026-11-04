// TEMPORARY FX volatility. Teammate C owns /lib/fx (getVolatility()), the source of truth.
// Swap volatilityLabel() for C's getVolatility() once it lands.
import type { VolatilityLabel } from '@/types/api';

const HIGH = ['NGN', 'GHS', 'EGP', 'TRY', 'ARS'];
const MEDIUM = ['INR', 'BRL', 'MXN', 'ZAR', 'KES'];

export const volatilityLabel = (currency: string): VolatilityLabel =>
  HIGH.includes(currency) ? 'high' : MEDIUM.includes(currency) ? 'medium' : 'low';
