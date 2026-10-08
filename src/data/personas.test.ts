import { describe, expect, it } from 'vitest';
import { insightFromState } from '../lib/insight';
import { overallChange, simToday } from '../lib/market';
import { TODAY } from '../test/fixtures';
import { buildPersona, PERSONA_SEEDS } from './personas';

describe('demo personas (README 7.4, PLAN C2/C15)', () => {
  it('has the four personas with 8–12 weeks of history each', () => {
    expect(PERSONA_SEEDS.map((p) => p.id)).toEqual(['riya', 'kabir', 'meera', 'arjun']);
    for (const p of PERSONA_SEEDS) {
      expect(p.history.length).toBeGreaterThanOrEqual(8);
      expect(p.history.length).toBeLessThanOrEqual(12);
      const s = buildPersona(p.id, TODAY);
      expect(simToday(s.market)).toBe(TODAY);
      expect(s.market.week).toBe(p.history.length);
      expect(s.plan).toBeDefined();
    }
  });
  it('Riya: index SIP ₹2,000, 3 instalments, two sharp dips, ₹4,000 plan, about −12%', () => {
    const s = buildPersona('riya', TODAY);
    expect(s.checkin).toMatchObject({ incomeType: 'salary', incomeBand: '25to50k', cushion: 'no', purpose: 'wealth', horizon: '5plus', dipReaction: 'wait', monthly: 4000 });
    expect(s.sips).toMatchObject([{ fundId: 'index50', amount: 2000, instalments: 3, status: 'active' }]);
    expect(s.market.history.filter((h) => h === 'dip_sharp')).toHaveLength(2);
    expect(s.market.history.at(-1)).toBe('dip_sharp');
    expect(s.market.history.indexOf('dip_sharp')).toBeLessThan(s.market.history.length - 1);
    expect(s.market.scenario).toBe('dip_sharp');
    // The plan names categories with funds to pick from; it never picks one (Stage 7a).
    expect(s.plan!.buckets.map((b) => [b.category, b.fundId, b.amount])).toEqual([
      ['liquid', undefined, 2000],
      ['index50', undefined, 2000],
    ]);
    // Only the index SIP exists, so the cushion bucket is the next step (PLAN item 7).
    expect(s.sips.some((x) => x.fundId === 'liquid1')).toBe(false);
    const o = overallChange(s).pct;
    expect(o).toBeGreaterThan(-13);
    expect(o).toBeLessThan(-11);
    expect(insightFromState(s)?.branch).toBe('big_dip');
  });
  it('Kabir: stipend < ₹10k, sells on a dip, nothing invested', () => {
    const s = buildPersona('kabir', TODAY);
    expect(s.checkin).toMatchObject({ incomeType: 'stipend', incomeBand: 'lt10k', cushion: 'no', purpose: 'exploring', horizon: '1to3', dipReaction: 'sell' });
    expect(s.holdings).toEqual([]);
    expect(s.sips).toEqual([]);
    expect(s.user.kyc).toBe('none');
  });
  it('Meera: goal "Laptop" with a liquid SIP of ₹1,500 linked', () => {
    const s = buildPersona('meera', TODAY);
    expect(s.checkin).toMatchObject({ incomeType: 'parttime', incomeBand: '10to25k', cushion: 'some', purpose: 'goal', horizon: 'lt1', dipReaction: 'wait' });
    expect(s.sips).toMatchObject([{ fundId: 'liquid1', amount: 1500, goalId: 'goal_1' }]);
    expect(s.goals).toMatchObject([{ id: 'goal_1', name: 'Laptop', sipIds: ['sip_1'] }]);
    expect(s.goals[0].byDate > TODAY).toBe(true);
  });
  it('Arjun: index SIP ₹5,000 and 3 stocks on the watchlist', () => {
    const s = buildPersona('arjun', TODAY);
    expect(s.checkin).toMatchObject({ incomeBand: 'gt50k', cushion: 'yes', horizon: '5plus', dipReaction: 'stay' });
    expect(s.sips).toMatchObject([{ fundId: 'index50', amount: 5000 }]);
    expect(s.watchlist).toHaveLength(3);
  });
  it('is deterministic', () => {
    expect(buildPersona('riya', TODAY)).toEqual(buildPersona('riya', TODAY));
  });
});
