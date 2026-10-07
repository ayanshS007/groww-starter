import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, oneTime, run, startSip, TODAY } from '../test/fixtures';
import {
  cushionValue,
  navAt,
  navSeries,
  overallChange,
  portfolioValue,
  SCENARIO_MOVE,
  scenarioMove,
  simDate,
  simToday,
  totalInvested,
  valueSeries,
  weekChange,
} from './market';

describe('scenarios and NAV', () => {
  it('uses the README weekly moves', () => {
    expect(SCENARIO_MOVE).toEqual({ normal: 0.006, dip_small: -0.018, dip_sharp: -0.08, up: 0.024, flat: 0.001 });
    expect(scenarioMove('dip_sharp')).toBe(-0.08);
  });
  it.each([
    ['index50', 'dip_sharp', 150 * (1 - 0.08 * 1.0)],
    ['index50', 'up', 150 * (1 + 0.024 * 1.0)],
    ['liquid1', 'dip_sharp', 1000 * (1 - 0.08 * 0.02)],
    ['midcap1', 'dip_small', 95 * (1 - 0.018 * 1.45)],
    ['balanced1', 'normal', 58 * (1 + 0.006 * 0.6)],
    ['shortdebt1', 'flat', 42 * (1 + 0.001 * 0.15)],
    ['stk_orbitly', 'dip_sharp', 3180 * (1 - 0.08 * 1.1)],
  ] as const)('%s after one %s week = baseNav × (1 + move × vol)', (asset, scenario, expected) => {
    expect(navAt(asset, 1, [scenario])).toBeCloseTo(expected, 8);
  });
  it('compounds over history and ignores weeks beyond it', () => {
    const h = ['up', 'dip_small', 'dip_sharp'] as const;
    expect(navAt('index50', 3, [...h])).toBeCloseTo(150 * 1.024 * 0.982 * 0.92, 8);
    expect(navAt('index50', 0, [...h])).toBe(150);
    expect(navSeries('index50', [...h])).toHaveLength(4);
  });
  it('maps weeks to simulated dates', () => {
    expect(simDate(TODAY, 0)).toBe(TODAY);
    expect(simDate(TODAY, 3)).toBe('2026-10-28');
  });
});

describe('portfolio maths', () => {
  it('values holdings and overall change', () => {
    // ₹1,000 one-time: first investment → dip_small and one week applied (PLAN item 13).
    const s = oneTime(fresh(), 'index50', 1000);
    expect(s.market.week).toBe(1);
    expect(s.market.history).toEqual(['dip_small']);
    expect(portfolioValue(s)).toBeCloseTo(1000 * 0.982, 6);
    expect(totalInvested(s)).toBe(1000);
    const o = overallChange(s);
    expect(o.amount).toBeCloseTo(-18, 6);
    expect(o.pct).toBeCloseTo(-1.8, 6);
  });
  it('treats liquid holdings as the cushion', () => {
    const s = oneTime(oneTime(fresh(), 'liquid1', 2000), 'index50', 1000);
    expect(cushionValue(s)).toBeCloseTo(2000 * (1 - 0.018 * 0.02), 6);
  });
});

describe('valueSeries', () => {
  it('has one point per week from 0 to the current week', () => {
    const s = advance(oneTime(fresh(), 'index50', 1000), 2, 'up');
    expect(s.market.week).toBe(3);
    const series = valueSeries(s);
    expect(series.map((p) => p.week)).toEqual([0, 1, 2, 3]);
  });
  it('rebuilds invested and value from the activity log', () => {
    const s = advance(oneTime(fresh(), 'index50', 1000), 2, 'up');
    const series = valueSeries(s);
    expect(series[0]).toEqual({ week: 0, invested: 1000, value: 1000 });
    expect(series[1].value).toBeCloseTo(982, 6);
    expect(series[3].value).toBeCloseTo(1000 * 0.982 * 1.024 * 1.024, 6);
    expect(series.every((p) => p.invested === 1000)).toBe(true);
  });
  it('ends at the current portfolio value and invested', () => {
    const s = buildPersona('riya', TODAY);
    const last = valueSeries(s).at(-1)!;
    expect(last.value).toBeCloseTo(portfolioValue(s), 6);
    expect(last.invested).toBeCloseTo(totalInvested(s), 6);
  });
  it('reduces invested pro rata after a withdrawal', () => {
    let s = advance(oneTime(fresh(), 'index50', 1000), 1, 'up');
    const h = s.holdings[0];
    s = run(s, { type: 'withdraw', holdingId: h.id, units: h.units / 2 });
    const last = valueSeries(s).at(-1)!;
    expect(last.invested).toBeCloseTo(500, 6);
    expect(last.invested).toBeCloseTo(totalInvested(s), 6);
    expect(last.value).toBeCloseTo(portfolioValue(s), 6);
  });
});

describe('weekChange', () => {
  it('is the market move on last week’s units, excluding new money', () => {
    let s = oneTime(fresh(), 'index50', 1000); // week 1: dip_small applied
    expect(weekChange(s).amount).toBeCloseTo(-18, 6);
    expect(weekChange(s).pct).toBeCloseTo(-1.8, 6);
    s = oneTime(s, 'index50', 5000); // new money this week is not a market move
    expect(weekChange(s).amount).toBeCloseTo(-18, 6);
    s = advance(s, 1, 'up');
    expect(weekChange(s).pct).toBeCloseTo(2.4, 6);
  });
  it('is zero before any week has passed', () => {
    expect(weekChange(fresh())).toEqual({ amount: 0, pct: 0 });
  });
});

describe('Riya seed (PLAN item 16)', () => {
  const s = buildPersona('riya', TODAY);
  it('overall change is between −13% and −11%', () => {
    const o = overallChange(s);
    expect(o.pct).toBeGreaterThan(-13);
    expect(o.pct).toBeLessThan(-11);
  });
  it('the latest week is a sharp dip of −8% on the index fund', () => {
    expect(weekChange(s).pct).toBeCloseTo(-8, 6);
  });
  it('simulated today is the real today', () => {
    expect(simToday(s.market)).toBe(TODAY);
  });
});

describe('a SIP over time', () => {
  it('posts monthly instalments as weeks advance', () => {
    let s = startSip(fresh(), 'index50', 1000, 10);
    s = advance(s, 9, 'flat'); // week 1 (first investment) + 9 → week 10 = 16 Dec
    // Created 7 Oct; first auto date is the 10th at least 15 days later → 10 Nov, then 10 Dec.
    const posts = s.activity.filter((a) => a.kind === 'sip_instalment').map((a) => a.at);
    expect(posts).toEqual([TODAY, '2026-11-10', '2026-12-10']);
    expect(totalInvested(s)).toBe(3000);
  });
});
