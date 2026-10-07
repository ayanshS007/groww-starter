import { describe, expect, it } from 'vitest';
import { goalProgress, goalShortfall, goalValue, goalWarnings, monthlyNeeded, monthsLeft } from './goals';
import type { Holding, Sip } from '../state/types';

const TODAY = '2026-10-07';

describe('monthlyNeeded', () => {
  it('divides the gap by months left', () => {
    // ₹45,000 laptop in 6 months with ₹3,000 saved → 7,000 a month
    expect(monthlyNeeded({ target: 45000, byDate: '2027-04-07' }, 3000, TODAY)).toBe(7000);
  });
  it('rounds up to ₹50', () => {
    // 10,000 / 3 = 3,333.33 → 3,350
    expect(monthlyNeeded({ target: 10000, byDate: '2027-01-07' }, 0, TODAY)).toBe(3350);
    // 1,001 / 1 → 1,050
    expect(monthlyNeeded({ target: 1001, byDate: '2026-10-20' }, 0, TODAY)).toBe(1050);
  });
  it('is 0 once the target is reached', () => {
    expect(monthlyNeeded({ target: 5000, byDate: '2027-04-07' }, 5200, TODAY)).toBe(0);
  });
  it('is null when the date has passed', () => {
    expect(monthlyNeeded({ target: 5000, byDate: '2026-09-01' }, 0, TODAY)).toBeNull();
    expect(monthlyNeeded({ target: 5000, byDate: TODAY }, 0, TODAY)).toBeNull();
    expect(monthsLeft(TODAY, '2026-09-01')).toBe(0);
  });
});

describe('goalWarnings', () => {
  it('warns about a goal under 1 year linked to an equity fund', () => {
    const w = goalWarnings({ byDate: '2027-06-01' }, TODAY, ['index50']);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ kind: 'short_equity', action: 'Switch to a steadier fund', fundId: 'index50' });
  });
  it('no warning for a short goal in a liquid fund, or a long goal in equity', () => {
    expect(goalWarnings({ byDate: '2027-06-01' }, TODAY, ['liquid1'])).toEqual([]);
    expect(goalWarnings({ byDate: '2028-06-01' }, TODAY, ['flexi1'])).toEqual([]);
  });
  it('asks to update a past date', () => {
    expect(goalWarnings({ byDate: '2026-01-01' }, TODAY, ['index50'])).toEqual([
      { kind: 'past_date', text: expect.stringContaining('date has passed') },
    ]);
  });
});

describe('progress, value and shortfall', () => {
  it('reports progress and thresholds reached', () => {
    expect(goalProgress(40000, 20000)).toEqual({ pct: 50, reached: [25, 50] });
    expect(goalProgress(40000, 50000)).toEqual({ pct: 100, reached: [25, 50, 75, 100] });
    expect(goalProgress(0, 10)).toEqual({ pct: 0, reached: [] });
  });
  it('values a goal from its linked SIPs’ funds', () => {
    const sips = [{ id: 'sip_1', fundId: 'liquid1' }, { id: 'sip_2', fundId: 'index50' }] as Sip[];
    const holdings = [
      { id: 'h_liquid1', kind: 'fund', assetId: 'liquid1', units: 3, invested: 3000, createdAt: TODAY, createdWeek: 0 },
      { id: 'h_index50', kind: 'fund', assetId: 'index50', units: 10, invested: 1500, createdAt: TODAY, createdWeek: 0 },
    ] as Holding[];
    const market = { scenario: 'normal' as const, week: 0, history: [], startDate: TODAY };
    expect(goalValue({ sips, holdings, market }, { sipIds: ['sip_1'] })).toBe(3000);
  });
  it('computes the monthly shortfall', () => {
    expect(goalShortfall(7000, 1500)).toBe(5500);
    expect(goalShortfall(1000, 1500)).toBe(0);
    expect(goalShortfall(null, 1500)).toBe(0);
  });
});
