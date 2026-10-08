import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { fresh, holding, run, startSip, withCheckin } from '../test/fixtures';
import type { Holding, State } from '../state/types';
import { cushionStep } from './planner';
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
  it('QA #16: "Yes, a few months" is taken at its word', () => {
    const s = withCheckin(fresh(), { cushion: 'yes', incomeBand: 'gt50k' });
    expect(cushionCheck(s)).toMatchObject({ status: 'good', detail: 'You said you have an emergency fund.' });
  });
  it('QA #17: liquid money behind a goal is not the cushion; an Emergency cushion goal still is', () => {
    const base = startSip(withHoldings([]), 'liquid1', 3000);
    const goal = { id: 'goal_1', name: 'Laptop', target: 45000, byDate: '2027-08-01', sipIds: ['sip_1'], isCushion: false, createdAt: '2026-10-07' };
    expect(cushionCheck({ ...base, goals: [goal] }).detail).toContain('₹0 of');
    expect(cushionCheck({ ...base, goals: [{ ...goal, isCushion: true }] }).detail).not.toContain('₹0 of');
  });
  it('QA #20: leads with a first ₹10,000 while below it, the full target second', () => {
    const s = withCheckin(fresh(), { incomeBand: '25to50k', cushion: 'no' });
    expect(cushionCheck(s).detail).toBe('₹0 of a first ₹10,000 set aside. Full target: ₹1,12,500.');
    expect(cushionCheck({ ...s, holdings: [liquid(12000)] }).detail).toBe('₹12,000 of ₹1,12,500 (11%) set aside.');
    // A full target under ₹10,000 (a Payday edit) is shown as is.
    expect(cushionStep(0, 8000)).toEqual({ main: 8000, full: 8000, first: false });
    expect(cushionStep(9999, 15000)).toEqual({ main: 10000, full: 15000, first: true });
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
  it('good when all are active, without "All 1" (QA #11)', () => {
    expect(sipCheck(startSip(fresh(), 'liquid1', 500))).toMatchObject({ status: 'good', detail: 'Your SIP is running.' });
    expect(sipCheck(startSip(startSip(fresh(), 'liquid1', 500), 'index50', 500)).detail).toBe('All 2 SIPs are running.');
  });
  it('QA #30: a plan part never set up counts, like Home’s "1 of 2"', () => {
    const c = sipCheck(buildPersona('riya', '2026-10-07'));
    // No cushion fund is picked yet, so the fix is the plan flow, which asks for the pick.
    expect(c).toMatchObject({ status: 'watch', fixRoute: '/invest/plan', fixLabel: 'Set it up' });
    expect(c.detail).toBe('1 of 2 SIPs in your plan running. Your emergency fund part isn’t set up yet.');
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
