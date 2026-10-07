import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { run, startSip, fresh, TODAY, withCheckin } from '../test/fixtures';

const mixed = () =>
  run(startSip(withCheckin(fresh()), 'index50', 2000), { type: 'buyStock', stockId: 'stk_pinecrest', shares: 2, orderType: 'market' });
import { categoryMix, illustrativeYearlyReturn } from './analytics';

describe('Pro portfolio analytics', () => {
  it('has nothing for an empty portfolio', () => {
    expect(categoryMix(fresh())).toEqual([]);
    expect(illustrativeYearlyReturn(fresh())).toBeNull();
  });
  it('category mix sums to 100% and is sorted largest first', () => {
    const mix = categoryMix(mixed());
    expect(mix.length).toBeGreaterThan(1);
    expect(mix.reduce((a, m) => a + m.pct, 0)).toBeCloseTo(100, 6);
    mix.slice(1).forEach((m, i) => expect(m.value).toBeLessThanOrEqual(mix[i].value));
    expect(mix.map((m) => m.label)).toContain('Stocks');
  });
  it('the yearly figure is a weighted average of the funds’ sample 1-year returns', () => {
    const riya = buildPersona('riya', TODAY);
    const r = illustrativeYearlyReturn(riya)!;
    expect(r.coverage).toBe(1); // Riya holds one index fund (sample 1-year 13.5%)
    expect(r.pct).toBeCloseTo(13.5, 6);
  });
  it('stocks are left out of the figure and shrink the coverage', () => {
    const r = illustrativeYearlyReturn(mixed())!;
    expect(r.coverage).toBeGreaterThan(0);
    expect(r.coverage).toBeLessThan(1);
  });
});
