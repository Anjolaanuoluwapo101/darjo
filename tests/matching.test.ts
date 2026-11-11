import { describe, expect, it } from 'vitest';
import { scoreCircle } from '@/lib/matching';
import type { ScorableCircle } from '@/lib/matching';

const base: ScorableCircle = {
  tier: 2,
  contributionCents: 5000,
  frequency: 'monthly',
  memberLimit: 6,
  memberCount: 4,
  risk: 'safe',
  ownTier: true,
};

describe('scoreCircle', () => {
  it('stays within 0..100', () => {
    const perfect = scoreCircle(base, {
      contributionCents: 5000,
      frequency: 'monthly',
      risk: 'safe',
    });
    expect(perfect.score).toBeGreaterThan(0);
    expect(perfect.score).toBeLessThanOrEqual(100);
  });

  it('rewards an exact contribution and frequency match', () => {
    const exact = scoreCircle(base, {
      contributionCents: 5000,
      frequency: 'monthly',
      risk: 'safe',
    });
    const far = scoreCircle(base, {
      contributionCents: 50_000,
      frequency: 'weekly',
      risk: 'risky',
    });
    expect(exact.score).toBeGreaterThan(far.score);
    expect(exact.reasons).toContain('Matches your $50 contribution');
    expect(exact.reasons).toContain('monthly contributions');
  });

  it('explains a contribution outside the budget', () => {
    const scored = scoreCircle(base, { contributionCents: 20_000 });
    expect(scored.reasons).toContain('$50 is outside your budget');
  });

  it('notes seat scarcity', () => {
    const oneSeat = scoreCircle({ ...base, memberCount: 5 }, {});
    expect(oneSeat.reasons).toContain('1 seat left');
    const twoSeats = scoreCircle({ ...base, memberCount: 4 }, {});
    expect(twoSeats.reasons).toContain('2 seats left');
  });

  it('mentions higher risk when that is what was requested', () => {
    const scored = scoreCircle({ ...base, risk: 'risky' }, { risk: 'risky' });
    expect(scored.reasons).toContain('Higher risk as requested');
  });
});
