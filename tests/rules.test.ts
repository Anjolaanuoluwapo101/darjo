import { describe, expect, it } from 'vitest';
import { canSeeCircle, joinCheck, nationalityAllowed, sortForStudio } from '@/lib/rules';

const viewer = { tier: 2 as const, nationality: 'US' };
const rules = { tier: 1 as const, includedNationalities: [] as string[], excludedNationalities: [] as string[] };

describe('nationalityAllowed', () => {
  it('allows any nationality when no list is set', () => {
    expect(nationalityAllowed('NG', rules)).toBe(true);
  });

  it('rejects an excluded nationality', () => {
    expect(nationalityAllowed('US', { ...rules, excludedNationalities: ['US'] })).toBe(false);
  });

  it('allows a nationality on the included list', () => {
    expect(nationalityAllowed('US', { ...rules, includedNationalities: ['US', 'GB'] })).toBe(true);
  });

  it('rejects a nationality missing from a non-empty included list', () => {
    expect(nationalityAllowed('NG', { ...rules, includedNationalities: ['US'] })).toBe(false);
  });
});

describe('canSeeCircle', () => {
  it('lets a higher tier viewer see a lower tier circle', () => {
    expect(canSeeCircle(viewer, rules)).toBe(true);
  });

  it('hides a circle above the viewer tier', () => {
    expect(canSeeCircle(viewer, { ...rules, tier: 3 })).toBe(false);
  });

  it('hides a circle that excludes the viewer nationality', () => {
    expect(canSeeCircle(viewer, { ...rules, excludedNationalities: ['US'] })).toBe(false);
  });

  it('hides a circle that only includes other nationalities', () => {
    expect(canSeeCircle(viewer, { ...rules, includedNationalities: ['NG'] })).toBe(false);
  });
});

describe('joinCheck', () => {
  it('allows a join when the viewer qualifies and there is room', () => {
    expect(joinCheck(viewer, rules, 1, 3, false)).toEqual({ ok: true });
  });

  it('rejects a second join by the same member', () => {
    expect(joinCheck(viewer, rules, 1, 3, true)).toEqual({ ok: false, code: 'ALREADY_MEMBER' });
  });

  it('rejects a viewer below the circle tier', () => {
    expect(joinCheck(viewer, { ...rules, tier: 3 }, 1, 3, false)).toEqual({ ok: false, code: 'TIER_TOO_LOW' });
  });

  it('rejects an excluded nationality', () => {
    expect(joinCheck(viewer, { ...rules, excludedNationalities: ['US'] }, 1, 3, false)).toEqual({
      ok: false,
      code: 'NATIONALITY_EXCLUDED',
    });
  });

  it('rejects a full circle', () => {
    expect(joinCheck(viewer, rules, 3, 3, false)).toEqual({ ok: false, code: 'CIRCLE_FULL' });
  });
});

describe('sortForStudio', () => {
  it('puts the viewer tier first, then higher tiers', () => {
    const sorted = sortForStudio([{ tier: 1 as const }, { tier: 3 as const }, { tier: 2 as const }], 2);
    expect(sorted.map((c) => c.tier)).toEqual([2, 3, 1]);
  });
});
