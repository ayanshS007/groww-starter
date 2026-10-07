import { describe, expect, it } from 'vitest';
import { fresh, holding, run, startSip, withCheckin } from '../test/fixtures';
import type { Holding, State } from '../state/types';
import { cushionCheck, horizonCheck, planHealth, sipCheck, STATUS_TEXT, stockCheck } from './planHealth';

// lt10k band → cushion target ₹15,000. Week 0 prices: liquid1 ₹1,000/unit, index50 ₹150, stk_greenfield ₹92.
const withHoldings = (holdings: Holding[], patch: Partial<State> = {}): State => ({
  ...withCheckin(fresh(), { incomeBand: 'lt10k', horizon: '1to3' }),
  holdings,
  ...patch,
});
const liquid = (value: number) => holding('liquid1', 'fund', value / 1000, value);

describe('cushion check', () => {
  it.each([
    [15000, 'good'],
    [20000, 'good'],
    [14990, 'watch'],
    [3750, 'watch'],
    [3740, 'todo'],
    [0, 'todo'],
  ] as const)('₹%i of ₹15,000 → %s', (value, status) => {
    expect(cushionCheck(withHoldings(value ? [liquid(value)] : [])).status).toBe(status);
  });
  it('without a check-in it asks for one', () => {
    expect(cushionCheck(fresh())).toMatchObject({ status: 'todo', fixRoute: '/checkin/1' });
  });
});

describe('horizon match', () => {
  it('good when every grow fund fits the time frame', () => {
    expect(horizonCheck(withHoldings([holding('shortdebt1', 'fund', 10), liquid(1000)])).status).toBe('good');
  });
  it('watch, naming the fund, when a grow fund needs longer', () => {
    const c = horizonCheck(withHoldings([holding('index50', 'fund', 10)]));
    expect(c.status).toBe('watch');
    expect(c.detail).toContain('Nifty 50 Index Fund');
  });
  it('ignores liquid funds and stocks', () => {
    expect(horizonCheck(withHoldings([liquid(1000), holding('stk_greenfield', 'stock', 5)])).status).toBe('good');
  });
});

describe('stock budget', () => {
  it('good at or below the budget, watch above', () => {
    // ₹920 of stock (10 × ₹92) with ₹8,280 of liquid → exactly 10%.
    expect(stockCheck(withHoldings([liquid(8280), holding('stk_greenfield', 'stock', 10)])).status).toBe('good');
    expect(stockCheck(withHoldings([liquid(8000), holding('stk_greenfield', 'stock', 10)])).status).toBe('watch');
    expect(stockCheck(withHoldings([])).status).toBe('good');
  });
  it('uses the user-set budget', () => {
    const s = withHoldings([liquid(8000), holding('stk_greenfield', 'stock', 10)]);
    expect(stockCheck(run(s, { type: 'setStockBudget', pct: 20 })).status).toBe('good');
  });
});

describe('SIPs running', () => {
  it('todo with no SIPs', () => {
    expect(sipCheck(fresh()).status).toBe('todo');
  });
  it('good when all are active', () => {
    expect(sipCheck(startSip(fresh(), 'liquid1', 500)).status).toBe('good');
  });
  it('watch with the resume date when any is paused', () => {
    let s = startSip(startSip(fresh(), 'liquid1', 500), 'index50', 500);
    s = run(s, { type: 'pauseSip', sipId: 'sip_2', months: 2 }); // today 14 Oct → until 14 Dec
    const c = sipCheck(s);
    expect(c.status).toBe('watch');
    expect(c.detail).toContain('1 of 2 running');
    expect(c.detail).toContain('15 Dec');
    expect(c.fixRoute).toBe('/portfolio/sip/sip_2');
  });
  it('stopped SIPs do not count', () => {
    const s = run(startSip(fresh(), 'liquid1', 500), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(sipCheck(s).status).toBe('todo');
  });
});

describe('planHealth', () => {
  it('returns the 4 checks in order, never using the word "fail"', () => {
    const states = [fresh(), withHoldings([liquid(100), holding('index50', 'fund', 10), holding('stk_greenfield', 'stock', 50)])];
    for (const s of states) {
      const checks = planHealth(s);
      expect(checks.map((c) => c.id)).toEqual(['cushion', 'horizon', 'stocks', 'sips']);
      expect(JSON.stringify(checks).toLowerCase()).not.toContain('fail');
    }
    expect(Object.values(STATUS_TEXT).join(' ').toLowerCase()).not.toContain('fail');
  });
});
