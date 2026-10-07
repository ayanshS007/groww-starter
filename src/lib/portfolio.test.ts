import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { assetSplit, checkWithdraw, holdingRows } from './portfolio';
import { fresh, oneTime, startSip, TODAY, withCheckin } from '../test/fixtures';

describe('holdingRows and assetSplit', () => {
  it('empty portfolio → no rows, no slices', () => {
    expect(holdingRows(fresh())).toEqual([]);
    expect(assetSplit(fresh())).toEqual([]);
  });
  it('average NAV is invested ÷ units; rows are biggest first', () => {
    let s = startSip(withCheckin(fresh()), 'liquid1', 500);
    s = startSip(s, 'index50', 2000);
    const rows = holdingRows(s);
    expect(rows[0].name).toBe('Nifty 50 Index Fund');
    expect(rows[0].avgNav).toBeCloseTo(rows[0].invested / rows[0].holding.units, 6);
  });
  it('splits liquid funds (cushion) from other funds (grow); percentages add to 100', () => {
    let s = startSip(withCheckin(fresh()), 'liquid1', 500);
    s = startSip(s, 'index50', 500);
    const slices = assetSplit(s);
    expect(slices.map((x) => x.id)).toEqual(['cushion', 'grow']);
    expect(slices.reduce((t, x) => t + x.pct, 0)).toBeCloseTo(100, 6);
  });
  it('Riya is all grow', () => {
    expect(assetSplit(buildPersona('riya', TODAY)).map((x) => x.id)).toEqual(['grow']);
  });
});

describe('checkWithdraw', () => {
  const h = { kind: 'fund' as const, units: 10, nav: 100 }; // worth ₹1,000
  it('partial amount converts to units', () => {
    expect(checkWithdraw('250', h, false)).toEqual({ ok: true, units: 2.5, amount: 250, all: false });
  });
  it('the full value counts as all', () => {
    expect(checkWithdraw('1,000', h, false)).toMatchObject({ ok: true, all: true, units: 10 });
    expect(checkWithdraw('', h, true)).toMatchObject({ ok: true, all: true, amount: 1000 });
  });
  it('rejects empty, zero, decimals and more than held', () => {
    expect(checkWithdraw('', h, false)).toMatchObject({ ok: false, error: 'Enter an amount.' });
    expect(checkWithdraw('0', h, false)).toMatchObject({ ok: false });
    expect(checkWithdraw('10.5', h, false)).toMatchObject({ ok: false, error: 'Use whole rupees.' });
    expect(checkWithdraw('1001', h, false)).toMatchObject({ ok: false, error: 'You hold ₹1,000 here. Enter that or less.' });
  });
  it('stocks sell whole shares', () => {
    const st = { kind: 'stock' as const, units: 3, nav: 500 };
    expect(checkWithdraw('2', st, false)).toMatchObject({ ok: true, units: 2, amount: 1000, all: false });
    expect(checkWithdraw('4', st, false)).toMatchObject({ ok: false });
    expect(checkWithdraw('3', st, false)).toMatchObject({ ok: true, all: true });
  });
});

describe('withdraw through the reducer', () => {
  it('partial withdraw keeps the holding; units drop right away; a redeem order is recorded', async () => {
    const { run } = await import('../test/fixtures');
    const s0 = oneTime(withCheckin(fresh()), 'liquid1', 1000);
    const h = s0.holdings[0];
    const s1 = run(s0, { type: 'withdraw', holdingId: h.id, amount: 400 });
    expect(s1.holdings[0].units).toBeLessThan(h.units);
    expect(s1.orders.at(-1)).toMatchObject({ type: 'redeem', status: 'processing' });
    const s2 = run(s1, { type: 'withdraw', holdingId: h.id, all: true });
    expect(s2.holdings).toHaveLength(0);
  });
});
