import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { getStock } from '../data/stocks';
import { fresh, run, TODAY } from '../test/fixtures';
import { currentNav } from './market';
import {
  budgetCheck,
  buyPath,
  buysLine,
  draftShares,
  fillPrice,
  parseBuyQuery,
  sharesFor,
  sharesWithinBudget,
  validateLimit,
  ZERO_SHARES_NOTE,
} from './stockBuy';

describe('₹1,000 buys n shares (README 9 item 16)', () => {
  it('whole shares only; 0 is allowed', () => {
    expect(sharesFor(1000, 2450)).toBe(0);
    expect(sharesFor(1000, 860)).toBe(1);
    expect(sharesFor(5000, 1240)).toBe(4);
    expect(sharesFor(2450, 2450)).toBe(1);
    expect(sharesFor(0, 100)).toBe(0);
    expect(sharesFor(1000, 0)).toBe(0);
  });
  it('words it plainly, with the reason for 0', () => {
    expect(buysLine(1000, 2450)).toBe('₹1,000 buys 0 shares');
    expect(buysLine(1000, 860)).toBe('₹1,000 buys 1 share');
    expect(buysLine(1000, 300)).toBe('₹1,000 buys 3 shares');
    expect(ZERO_SHARES_NOTE).toBe('Indian exchanges don’t sell parts of a share.');
  });
  it('at least two sample companies cost more than ₹1,000 a share', () => {
    const s = fresh();
    const above = ['stk_voltara', 'stk_orbitly', 'stk_riverstone'].filter((id) => currentNav(id, s.market) > 1000);
    expect(above.length).toBeGreaterThanOrEqual(2);
    expect(getStock('stk_voltara')!.price).toBeGreaterThan(2000);
  });
});

describe('the order in the URL', () => {
  it('round-trips through buyPath and parseBuyQuery', () => {
    const d = { step: 'review', mode: 'amount', qty: 0, amount: 1000, orderType: 'limit', limit: 2400, reason: 'social', tipDone: true, budgetOk: true, riskAck: true } as const;
    const path = buyPath('stk_voltara', d);
    expect(path.startsWith('/stock/stk_voltara/buy?')).toBe(true);
    const q = Object.fromEntries(new URLSearchParams(path.split('?')[1]));
    expect(parseBuyQuery(q)).toEqual(d);
  });
  it('defaults to 1 share, market, order step; ignores junk', () => {
    expect(parseBuyQuery({})).toEqual({ step: 'order', mode: 'shares', qty: 1, amount: undefined, orderType: 'market', limit: undefined, reason: undefined, tipDone: false, budgetOk: false, riskAck: false });
    expect(parseBuyQuery({ qty: '-4', reason: 'tip', type: 'fno' })).toMatchObject({ qty: 1, reason: undefined, orderType: 'market' });
    expect(parseBuyQuery({ qty: '5000' }).qty).toBe(999);
  });
  it('keeps the risk tick in the URL so it survives KYC (QA #1)', () => {
    const d = parseBuyQuery({ step: 'review', qty: '2', ack: '1' });
    expect(d.riskAck).toBe(true);
    expect(buyPath('stk_voltara', d)).toContain('ack=1');
    expect(buyPath('stk_voltara', { ...d, riskAck: false })).not.toContain('ack=');
  });
});

describe('market and limit', () => {
  it('a limit must sit within 20% of the sample price', () => {
    expect(validateLimit('2400', 2450)).toEqual({ ok: true, value: 2400 });
    expect(validateLimit('1500', 2450)).toMatchObject({ ok: false });
    expect(validateLimit('', 2450)).toMatchObject({ ok: false });
  });
  it('limit orders fill at the limit price; market at the sample price', () => {
    expect(fillPrice({ orderType: 'limit', limit: 2400 }, 2450)).toBe(2400);
    expect(fillPrice({ orderType: 'market', limit: 2400 }, 2450)).toBe(2450);
    expect(draftShares({ mode: 'amount', qty: 0, amount: 5000, orderType: 'limit', limit: 2400 }, 2450)).toBe(2);
    expect(draftShares({ mode: 'shares', qty: 3, orderType: 'market' }, 2450)).toBe(3);
  });
});

describe('stock budget check (never blocks)', () => {
  it('Riya’s first stock buy goes over a 10% budget; the sheet can say how much fits', () => {
    const r = buildPersona('riya', TODAY);
    const price = currentNav('stk_pinecrest', r.market);
    const c = budgetCheck(r, price);
    expect(c.exceeds).toBe(true);
    expect(c.limitPct).toBe(10);
    expect(sharesWithinBudget(c, price)).toBe(0);
    expect(c.maxBuyWithin).toBeGreaterThan(0);
  });
  it('a bigger budget lets the same buy through', () => {
    const r = run(buildPersona('riya', TODAY), { type: 'setStockBudget', pct: 30 });
    const price = currentNav('stk_pinecrest', r.market);
    expect(budgetCheck(r, price).exceeds).toBe(false);
    expect(sharesWithinBudget(budgetCheck(r, price), price)).toBeGreaterThanOrEqual(1);
  });
  it('buying anyway still works: the reducer never blocks', () => {
    const r = buildPersona('riya', TODAY);
    const s = run(r, { type: 'buyStock', stockId: 'stk_voltara', shares: 1, orderType: 'market', pickReason: 'social' });
    expect(s.holdings.find((h) => h.assetId === 'stk_voltara')?.units).toBe(1);
    expect(s.orders[s.orders.length - 1]).toMatchObject({ type: 'buy', kind: 'stock', pickReason: 'social', units: 1 });
  });
});
