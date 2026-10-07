import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, run } from '../test/fixtures';
import { addDays, addMonths } from './dates';
import {
  GOAL_SUGGESTIONS,
  goalProgress,
  goalShortfall,
  goalSummary,
  goalValue,
  goalWarnings,
  linkableSips,
  monthlyNeeded,
  monthsLeft,
  STEADIER_FUNDS_ROUTE,
  suggestionPrefill,
  validateGoalInput,
} from './goals';
import { simToday } from './market';
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

describe('goal form (README 8.8: past date asks to update)', () => {
  it('accepts a valid goal', () => {
    expect(validateGoalInput({ name: ' Laptop ', target: '45,000', byDate: '2027-04-07' }, TODAY)).toEqual({
      ok: true,
      value: { name: 'Laptop', target: 45000, byDate: '2027-04-07' },
    });
  });
  it('a date today or in the past asks for a later one', () => {
    for (const byDate of [TODAY, '2026-01-01']) {
      const r = validateGoalInput({ name: 'Trip', target: 15000, byDate }, TODAY);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.byDate).toBe('Pick a date after today.');
    }
  });
  it('names, amounts and missing dates are checked', () => {
    const r = validateGoalInput({ name: ' ', target: '', byDate: '' }, TODAY);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['byDate', 'name', 'target']);
    const small = validateGoalInput({ name: 'X', target: '499', byDate: '2027-01-01' }, TODAY);
    expect(small.ok).toBe(false);
  });
  it('the Emergency cushion suggestion prefills 3 × income and a year; others only the name', () => {
    expect(suggestionPrefill('Emergency cushion', 112500, TODAY)).toEqual({
      name: 'Emergency cushion',
      target: 112500,
      byDate: '2027-10-07',
      isCushion: true,
    });
    expect(suggestionPrefill('Laptop', 112500, TODAY)).toEqual({ name: 'Laptop', isCushion: false });
    expect(GOAL_SUGGESTIONS).toEqual(['Emergency cushion', 'Laptop', 'Trip', 'Course fees']);
  });
});

describe('goalSummary (goal detail)', () => {
  it('Laptop under a year linked to Riya’s index SIP: short-goal-in-equity warning and a shortfall', () => {
    let s = buildPersona('riya', TODAY);
    const today = simToday(s.market);
    s = run(s, { type: 'createGoal', name: 'Laptop', target: 50000, byDate: addMonths(today, 8), sipIds: ['sip_1'] });
    const goal = s.goals[0];
    const sum = goalSummary(s, goal, today);
    expect(sum.linkedSips.map((x) => x.id)).toEqual(['sip_1']);
    expect(sum.warnings.map((w) => w.kind)).toEqual(['short_equity']);
    expect(sum.warnings[0].text).toContain('Nifty 50 Index Fund');
    expect(sum.linkedTotal).toBe(2000);
    expect(sum.needed).toBeGreaterThan(2000);
    expect(sum.shortfall).toBe((sum.needed ?? 0) - 2000);
    expect(STEADIER_FUNDS_ROUTE).toBe('/explore/funds?collection=need_this_year');
  });
  it('a goal more than a year away has no warning; after its date passes it asks for a new date', () => {
    let s = buildPersona('riya', TODAY);
    const today = simToday(s.market);
    s = run(s, { type: 'createGoal', name: 'Trip', target: 20000, byDate: addDays(today, 400), sipIds: ['sip_1'] });
    expect(goalSummary(s, s.goals[0], today).warnings).toEqual([]);
    s = run(s, { type: 'updateGoal', goalId: s.goals[0].id, patch: { byDate: addDays(today, 10) } });
    s = advance(s, 2);
    const later = goalSummary(s, s.goals[0], simToday(s.market));
    expect(later.needed).toBeNull();
    expect(later.warnings.map((w) => w.kind)).toEqual(['past_date']);
  });
  it('paused SIPs don’t count toward the monthly total; stopped ones can’t be linked', () => {
    let s = buildPersona('riya', TODAY);
    const today = simToday(s.market);
    s = run(s, { type: 'createGoal', name: 'Laptop', target: 50000, byDate: addMonths(today, 20), sipIds: ['sip_1'] });
    s = run(s, { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    expect(goalSummary(s, s.goals[0], today).linkedTotal).toBe(0);
    const other = run(s, { type: 'createGoal', name: 'Trip', target: 9000, byDate: addMonths(today, 20) });
    expect(linkableSips(other, other.goals[1]).map((x) => x.id)).toEqual(['sip_1']);
    const stopped = run(other, { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(linkableSips(stopped, stopped.goals[1])).toEqual([]);
  });
});
