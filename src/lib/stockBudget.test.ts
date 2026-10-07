import { describe, expect, it } from 'vitest';
import { checkStockBuy } from './stockBudget';

describe('checkStockBuy', () => {
  it('first buy with no other holdings is 100% stocks and exceeds the budget', () => {
    const r = checkStockBuy({ stockValue: 0, portfolioValue: 0, buyAmount: 1240, pct: 10 });
    expect(r.afterPct).toBe(100);
    expect(r.exceeds).toBe(true);
    expect(r.maxBuyWithin).toBe(0);
  });
  it('first buy that stays within the budget alongside funds', () => {
    const r = checkStockBuy({ stockValue: 0, portfolioValue: 20000, buyAmount: 1000, pct: 10 });
    expect(r.afterPct).toBeCloseTo(4.76, 2);
    expect(r.exceeds).toBe(false);
  });
  it('detects a buy that would push stocks over the budget', () => {
    const r = checkStockBuy({ stockValue: 1500, portfolioValue: 20000, buyAmount: 1000, pct: 10 });
    expect(r.afterPct).toBeCloseTo(11.9, 2); // 2,500 ÷ 21,000
    expect(r.exceeds).toBe(true);
    // (0.1 × 20000 − 1500) / 0.9 = 555.5 → 555
    expect(r.maxBuyWithin).toBe(555);
  });
  it('exactly at the budget does not exceed', () => {
    const r = checkStockBuy({ stockValue: 0, portfolioValue: 9000, buyAmount: 1000, pct: 10 });
    expect(r.afterPct).toBeCloseTo(10, 6);
    expect(r.exceeds).toBe(false);
  });
  it('respects a user-set budget', () => {
    expect(checkStockBuy({ stockValue: 1500, portfolioValue: 20000, buyAmount: 1000, pct: 25 }).exceeds).toBe(false);
  });
});
