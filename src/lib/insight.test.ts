import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, holding, oneTime, TODAY, withCheckin } from '../test/fixtures';
import type { Horizon } from '../state/types';
import { ALARM_WORDS, buildInsight, insightFromState, insightHorizon } from './insight';
import { MINUS } from './format';

const idx = [holding('index50', 'fund', 10, 1500)];
const debt = [holding('shortdebt1', 'fund', 10, 420)];
const liquid = [holding('liquid1', 'fund', 2, 2000)];
const ch = (amount: number, pct: number) => ({ amount, pct });

function noAlarm(text: string) {
  const t = text.toLowerCase();
  for (const w of ALARM_WORDS) expect(t).not.toContain(w);
}

describe('buildInsight branches (PLAN item 15, first match wins)', () => {
  it('1. big dip: overall ≤ −10% with horizon ≥ 3 yrs', () => {
    const i = buildInsight({ weekChange: ch(-400, -8), overallChange: ch(-700, -12), horizon: '5plus', holdings: idx });
    expect(i.branch).toBe('big_dip');
    expect(i.body).toContain('bigger fall');
    expect(i.body).toContain('recovered');
    expect(i.body).toContain('no promise');
    expect(i.body).toContain('lock in the fall');
    expect(i).toMatchObject({ action: 'review_plan', actionNeeded: false, tone: 'caution' });
  });
  it('big dip uses the overall change, not one week: a −8% week alone is not a big dip', () => {
    const i = buildInsight({ weekChange: ch(-400, -8), overallChange: ch(-200, -4), horizon: '5plus', holdings: idx });
    expect(i.branch).toBe('short_term');
  });
  it('big dip wins even in an up week', () => {
    const i = buildInsight({ weekChange: ch(50, 1), overallChange: ch(-700, -10), horizon: '3to5', holdings: idx });
    expect(i.branch).toBe('big_dip');
  });
  describe('1b. big dip, but this week is a gain (overall still ≤ −10%)', () => {
    const up = () => buildInsight({ weekChange: ch(165, 2.4), overallChange: ch(-960, -12), horizon: '5plus', holdings: idx });
    it('keeps the big-dip branch but leads the headline with this week’s gain in plain numbers', () => {
      const i = up();
      expect(i.branch).toBe('big_dip');
      expect(i.headline.startsWith('Up ₹165 (+2.4%) this week.')).toBe(true);
      expect(i.headline).toBe(`Up ₹165 (+2.4%) this week. Overall change: ${MINUS}₹960 (${MINUS}12.0%) on what you invested.`);
    });
    it('the body calmly says the portfolio is still below what was invested, in ₹ and %', () => {
      const i = up();
      expect(i.body).toContain('still ₹960 (12.0%) below what you invested');
      expect(i.body).toContain("That's normal after a bigger fall");
      expect(i.body).toContain('Your time frame is 5+ years');
    });
    it('needs no action, offers the optional review link, and is not the amber caution tone', () => {
      const i = up();
      expect(i).toMatchObject({ actionNeeded: false, action: 'review_plan', tone: 'neutral' });
      expect(i.body).toContain('Nothing needs doing');
      expect(i.body).toContain('Reviewing your plan is optional');
    });
    it('makes no promise, says nothing about selling, and has no alarm words', () => {
      const i = up();
      const t = (i.headline + ' ' + i.body).toLowerCase();
      for (const w of ['sell', 'recover', 'promise', 'guarantee', 'lock in']) expect(t).not.toContain(w);
      noAlarm(t);
    });
    it('a flat week (exactly zero) and a down week keep the original big-dip wording', () => {
      for (const w of [ch(0, 0), ch(-400, -8)]) {
        const i = buildInsight({ weekChange: w, overallChange: ch(-960, -12), horizon: '5plus', holdings: idx });
        expect(i.branch).toBe('big_dip');
        expect(i.headline.startsWith('This week:')).toBe(true);
        expect(i.body).toContain('lock in the fall');
        expect(i.tone).toBe('caution');
      }
    });
    it('only applies at the −10% line: −9.9% overall with a gain is the calm branch', () => {
      const i = buildInsight({ weekChange: ch(165, 2.4), overallChange: ch(-99, -9.9), horizon: '5plus', holdings: idx });
      expect(i.branch).toBe('calm');
    });
    it('needs a horizon of 3+ years: under that, a gain is calm', () => {
      const i = buildInsight({ weekChange: ch(165, 2.4), overallChange: ch(-960, -12), horizon: '1to3', holdings: idx });
      expect(i.branch).toBe('calm');
    });
    it('end to end: Riya after one up week (overall −10.1%) gets the new wording; once recovered it turns calm', () => {
      const riya = buildPersona('riya', TODAY);
      const one = insightFromState(advance(riya, 1, 'up'))!;
      expect(one.branch).toBe('big_dip');
      expect(one.headline).toMatch(/^Up ₹\d[\d,]* \(\+\d+\.\d%\) this week\. Overall change: /);
      expect(one.body).toContain('below what you invested');
      expect(insightFromState(advance(riya, 3, 'up'))!.branch).toBe('calm');
    });
  });
  it('2. up or flat week: calm, no action', () => {
    for (const w of [ch(30, 2.4), ch(0, 0)]) {
      const i = buildInsight({ weekChange: w, overallChange: ch(10, 1), horizon: '1to3', holdings: debt });
      expect(i).toMatchObject({ branch: 'calm', actionNeeded: false, tone: 'calm' });
      expect(i.body).toContain('One week is not a trend');
    }
  });
  it('3. down week, horizon ≥ 3 yrs: short-term move', () => {
    const i = buildInsight({ weekChange: ch(-27, -1.8), overallChange: ch(-27, -1.8), horizon: '5plus', holdings: idx });
    expect(i.branch).toBe('short_term');
    expect(i.body).toBe("A short-term move. Your time frame is 5+ years, so this alone doesn't mean you need to act.");
    expect(i.actionNeeded).toBe(false);
  });
  it('4. down week, horizon < 3 yrs: explains the steadier fund', () => {
    const i = buildInsight({ weekChange: ch(-1, -0.3), overallChange: ch(-1, -0.3), horizon: '1to3', holdings: debt });
    expect(i.branch).toBe('steadier');
    expect(i.body).toContain('Short Duration Debt Fund');
    expect(i.body).toContain('steadier');
    expect(i.actionNeeded).toBe(false);
  });
  it('4. names a horizon mismatch and offers Review my plan', () => {
    const i = buildInsight({ weekChange: ch(-27, -1.8), overallChange: ch(-27, -1.8), horizon: '1to3', holdings: idx });
    expect(i.branch).toBe('steadier');
    expect(i.body).toContain('Nifty 50 Index Fund is meant for 5+ yrs');
    expect(i).toMatchObject({ actionNeeded: true, action: 'review_plan', tone: 'caution' });
  });
  it('the headline states this week’s change and the overall change in ₹ and %', () => {
    const i = buildInsight({ weekChange: ch(-458, -8), overallChange: ch(-732, -12.2), horizon: '5plus', holdings: idx });
    expect(i.headline).toBe(`This week: ${MINUS}₹458 (${MINUS}8.0%). Overall change: ${MINUS}₹732 (${MINUS}12.2%) on what you invested.`);
  });
  it('tone is never red or alarming', () => {
    const cases: [number, number, Horizon][] = [
      [-8, -12, '5plus'],
      [-8, -12, 'lt1'],
      [-2, -2, '3to5'],
      [2, 2, '1to3'],
    ];
    for (const [w, o, h] of cases) {
      const i = buildInsight({ weekChange: ch(w * 10, w), overallChange: ch(o * 10, o), horizon: h, holdings: idx });
      expect(['calm', 'neutral', 'caution']).toContain(i.tone);
      noAlarm(i.headline + ' ' + i.body);
    }
  });
});

describe('liquid-only portfolio under dip_sharp', () => {
  it.each(['lt1', '1to3', '3to5', '5plus'] as Horizon[])('has no alarming words (horizon %s)', (horizon) => {
    let s = withCheckin(fresh(), { horizon, purpose: horizon === 'lt1' ? 'goal' : 'cushion' });
    s = oneTime(s, 'liquid1', 2000);
    s = advance(s, 1, 'dip_sharp');
    const i = insightFromState(s)!;
    expect(i).not.toBeNull();
    noAlarm(i.headline + ' ' + i.body);
    expect(i.actionNeeded).toBe(false);
  });
  it('the direct builder says the moves are tiny', () => {
    const i = buildInsight({ weekChange: ch(-3, -0.16), overallChange: ch(-4, -0.2), horizon: 'lt1', holdings: liquid });
    expect(i.body).toContain('liquid fund');
    noAlarm(i.body);
  });
});

describe('from state', () => {
  it('is null with nothing held', () => {
    expect(insightFromState(fresh())).toBeNull();
  });
  it('Riya’s seed lands in the big-dip branch', () => {
    expect(insightFromState(buildPersona('riya', TODAY))!.branch).toBe('big_dip');
  });
  it('browse mode falls back to the longest held fund horizon', () => {
    const s = oneTime(oneTime(fresh(), 'liquid1', 1000), 'shortdebt1', 1000);
    expect(s.checkin).toBeUndefined();
    expect(insightHorizon(s)).toBe('1to3');
    expect(insightHorizon(fresh())).toBe('5plus');
  });
  it('reacts to every scenario', () => {
    const start = oneTime(withCheckin(fresh()), 'index50', 1000);
    const branches = (['normal', 'up', 'flat', 'dip_small', 'dip_sharp'] as const).map(
      (sc) => insightFromState(advance(start, 1, sc))!.branch,
    );
    expect(branches).toEqual(['calm', 'calm', 'calm', 'short_term', 'short_term']);
    // Two sharp weeks after the first dip take the overall change past −10%.
    expect(insightFromState(advance(start, 2, 'dip_sharp'))!.branch).toBe('big_dip');
  });
});
