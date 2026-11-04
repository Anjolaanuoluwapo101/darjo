// PLACEHOLDER numbers. Change them here only; nothing else hard-codes them.
export const FEE_RATE = 0.015; // 1.5% of the pot
export const MIN_CONTRIBUTION_CENTS = 100;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 12;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const SCORE_POINTS = { on_time: 5, recovered: 2, late: -5, failed: -10 } as const;
// A tier starts at this score
export const TIER_MIN_SCORE = { 1: 0, 2: 25, 3: 50, 4: 75 } as const;
// Cosmetic ranks at tier 4, by completed circles (checked from highest)
export const RANKS = [
  { minCompleted: 10, name: 'Ruby' },
  { minCompleted: 6, name: 'Gold' },
  { minCompleted: 3, name: 'Silver' },
  { minCompleted: 1, name: 'Bronze' },
] as const;
// A circle is risky if this share of members use high-volatility currencies
export const RISKY_MEMBER_SHARE = 0.4;
