import { describe, expect, it } from 'vitest';
import type { CheckinAnswers, Horizon, RiskComfort } from '../state/types';
import { PLAN_LABEL } from '../state/types';
import {
  buildPlan,
  comfortCeiling,
  CONFLICT_NOTES,
  cushionTarget,
  defaultSipDay,
  growCategory,
  isCompleteCheckin,
  normaliseCushionPct,
  riskComfort,
  SPLIT_NOTES,
  splitAmounts,
  splitRule,
  validateMonthly,
} from './planner';

const TODAY = '2026-10-07';

const base: CheckinAnswers = {
  incomeType: 'salary',
  incomeBand: '25to50k',
  cushion: 'no',
  purpose: 'wealth',
  horizon: '5plus',
  dipReaction: 'wait',
  monthly: 4000,
  monthlyChoice: 'custom',
};
const answers = (patch: Partial<CheckinAnswers> = {}): CheckinAnswers => ({ ...base, ...patch });

describe('derived values', () => {
  it('maps dip reaction to risk comfort', () => {
    expect(riskComfort('sell')).toBe('low');
    expect(riskComfort('wait')).toBe('moderate');
    expect(riskComfort('stay')).toBe('high');
  });
  it('has a comfort ceiling per income band', () => {
    expect(comfortCeiling('lt10k')).toBe(1500);
    expect(comfortCeiling('10to25k')).toBe(4000);
    expect(comfortCeiling('25to50k')).toBe(10000);
    expect(comfortCeiling('gt50k')).toBe(25000);
  });
  it('sets the cushion target to 3 × the band midpoint', () => {
    expect(cushionTarget('lt10k')).toBe(15000);
    expect(cushionTarget('25to50k')).toBe(112500);
  });
  it('suggests a SIP date from income type (README 8.2)', () => {
    expect(defaultSipDay('salary')).toBe(4);
    expect(defaultSipDay('salary', 7)).toBe(10);
    expect(defaultSipDay('salary', 27)).toBe(28);
    expect(defaultSipDay('stipend')).toBe(10);
    expect(defaultSipDay('none')).toBe(10);
  });
});

describe('grow category matrix: all 12 cells', () => {
  const cells: [Horizon, RiskComfort, string, string | undefined, string | undefined][] = [
    ['lt1', 'low', 'liquid1', undefined, undefined],
    ['lt1', 'moderate', 'liquid1', undefined, undefined],
    ['lt1', 'high', 'liquid1', undefined, 'short_high'],
    ['1to3', 'low', 'shortdebt1', undefined, undefined],
    ['1to3', 'moderate', 'shortdebt1', undefined, undefined],
    ['1to3', 'high', 'shortdebt1', 'balanced1', undefined],
    ['3to5', 'low', 'shortdebt1', undefined, undefined],
    ['3to5', 'moderate', 'balanced1', undefined, undefined],
    ['3to5', 'high', 'balanced1', 'index50', undefined],
    ['5plus', 'low', 'balanced1', undefined, 'long_low'],
    ['5plus', 'moderate', 'index50', undefined, undefined],
    ['5plus', 'high', 'index50', 'flexi1', undefined],
  ];
  it.each(cells)('%s × %s → %s (alt %s, conflict %s)', (h, c, fund, alt, conflict) => {
    const g = growCategory(h, c);
    expect(g.fundId).toBe(fund);
    expect(g.alternativeFundId).toBe(alt);
    expect(g.conflict).toBe(conflict);
  });
});

describe('split rules A1–A6 (first match wins)', () => {
  it('A1: goal is a cushion → 100% cushion, even with other answers that would match later rules', () => {
    expect(splitRule(answers({ purpose: 'cushion', cushion: 'yes' }))).toEqual({ rule: 'A1', cushionPct: 100 });
    const plan = buildPlan(answers({ purpose: 'cushion' }), TODAY);
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0]).toMatchObject({ role: 'cushion', fundId: 'liquid1', amount: 4000 });
  });
  it('A2: horizon under 1 year → 100% cushion', () => {
    expect(splitRule(answers({ horizon: 'lt1', cushion: 'yes' }))).toEqual({ rule: 'A2', cushionPct: 100 });
  });
  it('A3: no cushion and income not salary → 70/30', () => {
    for (const incomeType of ['stipend', 'parttime', 'none'] as const) {
      expect(splitRule(answers({ incomeType }))).toEqual({ rule: 'A3', cushionPct: 70 });
    }
    const plan = buildPlan(answers({ incomeType: 'stipend', monthly: 1000 }), TODAY);
    expect(plan.buckets.map((b) => [b.role, b.amount])).toEqual([
      ['cushion', 700],
      ['grow', 300],
    ]);
  });
  it('A4: no cushion and salary → 50/50', () => {
    expect(splitRule(answers())).toEqual({ rule: 'A4', cushionPct: 50 });
    const plan = buildPlan(answers(), TODAY);
    expect(plan.buckets.map((b) => [b.role, b.fundId, b.amount])).toEqual([
      ['cushion', 'liquid1', 2000],
      ['grow', 'index50', 2000],
    ]);
  });
  it('A5: some cushion → 30/70', () => {
    expect(splitRule(answers({ cushion: 'some', incomeType: 'stipend' }))).toEqual({ rule: 'A5', cushionPct: 30 });
    const plan = buildPlan(answers({ cushion: 'some', monthly: 1000 }), TODAY);
    expect(plan.buckets.map((b) => b.amount)).toEqual([300, 700]);
  });
  it('A6: cushion yes → 0/100', () => {
    expect(splitRule(answers({ cushion: 'yes' }))).toEqual({ rule: 'A6', cushionPct: 0 });
    const plan = buildPlan(answers({ cushion: 'yes', dipReaction: 'stay' }), TODAY);
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0]).toMatchObject({ role: 'grow', fundId: 'index50', amount: 4000 });
    expect(plan.alternativeFundId).toBe('flexi1');
  });
});

describe('conflict notes', () => {
  it('< 1 yr + High attaches the note even though grow is 0%', () => {
    const plan = buildPlan(answers({ horizon: 'lt1', dipReaction: 'stay' }), TODAY);
    expect(plan.buckets.every((b) => b.role === 'cushion')).toBe(true);
    expect(plan.conflictNote).toBe(CONFLICT_NOTES.short_high);
  });
  it('5+ yrs + Low attaches the balanced-fund note', () => {
    const plan = buildPlan(answers({ dipReaction: 'sell' }), TODAY);
    expect(plan.buckets.find((b) => b.role === 'grow')?.fundId).toBe('balanced1');
    expect(plan.conflictNote).toBe(CONFLICT_NOTES.long_low);
  });
  it('no conflict note elsewhere', () => {
    expect(buildPlan(answers(), TODAY).conflictNote).toBeUndefined();
    expect(buildPlan(answers({ horizon: '3to5', dipReaction: 'stay' }), TODAY).conflictNote).toBeUndefined();
  });
});

describe('reasons and factors', () => {
  const variants: Partial<CheckinAnswers>[] = [
    {},
    { purpose: 'cushion' },
    { horizon: 'lt1' },
    { incomeType: 'parttime' },
    { cushion: 'some' },
    { cushion: 'yes' },
    { purpose: 'goal', horizon: '1to3' },
    { purpose: 'exploring', dipReaction: 'sell' },
  ];
  it.each(variants)('every bucket reason cites ≥ 2 answers (%o)', (patch) => {
    const plan = buildPlan(answers(patch), TODAY);
    expect(plan.buckets.length).toBeGreaterThan(0);
    for (const b of plan.buckets) {
      expect(new Set(b.citedAnswers).size).toBeGreaterThanOrEqual(2);
      expect(b.reason.length).toBeGreaterThan(20);
    }
  });
  it('the reason text mentions the answers it cites', () => {
    const plan = buildPlan(answers(), TODAY);
    const grow = plan.buckets.find((b) => b.role === 'grow')!;
    expect(grow.reason).toContain('5+ years');
    expect(grow.reason).toContain('10% fall');
    const cushion = plan.buckets.find((b) => b.role === 'cushion')!;
    expect(cushion.reason).toContain('emergency money');
    expect(cushion.reason).toContain('salary');
  });
  it('factors list ≥ 3 items, each citing one answer', () => {
    const plan = buildPlan(answers(), TODAY);
    expect(plan.factors.length).toBeGreaterThanOrEqual(3);
    const keys = plan.factors.map((f) => f.answer);
    expect(new Set(keys).size).toBe(keys.length);
    expect(plan.factors.find((f) => f.answer === 'monthly')?.text).toContain('₹4,000');
  });
  it('a goal changes the wording, not the fund', () => {
    const wealth = buildPlan(answers({ purpose: 'wealth' }), TODAY);
    const goal = buildPlan(answers({ purpose: 'goal' }), TODAY);
    expect(goal.buckets.map((b) => [b.fundId, b.amount])).toEqual(wealth.buckets.map((b) => [b.fundId, b.amount]));
    expect(goal.buckets.map((b) => b.reason)).not.toEqual(wealth.buckets.map((b) => b.reason));
    expect(goal.buckets.find((b) => b.role === 'grow')!.reason).toContain('goal');
  });
  it('carries the plan label and never uses advice words', () => {
    const plan = buildPlan(answers(), TODAY);
    expect(plan.label).toBe(PLAN_LABEL);
    const text = JSON.stringify(plan).toLowerCase();
    for (const w of ['best', 'recommended for you', 'guaranteed', 'top performing']) expect(text).not.toContain(w);
  });
});

describe('rounding and merge', () => {
  it('rounds the cushion to ₹50 and gives grow the remainder', () => {
    expect(splitAmounts(1250, 70)).toEqual({ cushion: 900, grow: 350 }); // 875 → 900
    expect(splitAmounts(1100, 30)).toEqual({ cushion: 350, grow: 750 }); // 330 → 350
    const plan = buildPlan(answers({ incomeType: 'stipend', monthly: 1250 }), TODAY);
    expect(plan.buckets.reduce((s, b) => s + b.amount, 0)).toBe(1250);
  });
  it('merges a grow part under ₹100 into the cushion and says so', () => {
    const r = splitAmounts(300, 70); // 210 → 200; grow 100 is not under ₹100
    expect(r).toEqual({ cushion: 200, grow: 100 });
    const m = splitAmounts(250, 70); // 175 → 200, grow 50 → merge
    expect(m.cushion).toBe(250);
    expect(m.grow).toBe(0);
    expect(m.mergeNote).toContain('grow part (₹50)');
  });
  it('merges a cushion part under ₹100 into grow', () => {
    const m = splitAmounts(500, 10); // 50 → 50 < 100
    expect(m).toMatchObject({ cushion: 0, grow: 500 });
    expect(m.mergeNote).toContain('cushion part (₹50)');
  });
  it('both parts under ₹100 merge into the cushion (ties go to the cushion)', () => {
    const m = splitAmounts(100, 50);
    expect(m).toMatchObject({ cushion: 100, grow: 0 });
    expect(m.mergeNote).toContain('Both parts');
    const plan = buildPlan(answers({ monthly: 100, monthlyChoice: 100 }), TODAY);
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0]).toMatchObject({ role: 'cushion', amount: 100 });
    expect(plan.mergeNote).toBeDefined();
  });
  it('no merge note when parts are large enough', () => {
    expect(buildPlan(answers(), TODAY).mergeNote).toBeUndefined();
  });
});

describe('comfort ceiling note', () => {
  it('appears above the ceiling and never blocks', () => {
    const plan = buildPlan(answers({ monthly: 12000 }), TODAY);
    expect(plan.overCeilingNote).toContain('₹10,000');
    expect(plan.buckets.reduce((s, b) => s + b.amount, 0)).toBe(12000);
  });
  it('does not appear at or below the ceiling', () => {
    expect(buildPlan(answers({ monthly: 10000 }), TODAY).overCeilingNote).toBeUndefined();
  });
});

describe('validateMonthly', () => {
  it('rejects ₹99 and ₹1,00,001', () => {
    expect(validateMonthly(99)).toEqual({ ok: false, error: 'The minimum is ₹100 a month.' });
    expect(validateMonthly(100001)).toEqual({ ok: false, error: 'The maximum here is ₹1,00,000 a month.' });
  });
  it('accepts the bounds and formatted strings', () => {
    expect(validateMonthly(100)).toEqual({ ok: true, value: 100 });
    expect(validateMonthly('1,00,000')).toEqual({ ok: true, value: 100000 });
    expect(validateMonthly('₹ 2,500')).toEqual({ ok: true, value: 2500 });
  });
  it('rejects empty, non-numeric and decimal input', () => {
    expect(validateMonthly('').ok).toBe(false);
    expect(validateMonthly('abc').ok).toBe(false);
    expect(validateMonthly(150.5)).toEqual({ ok: false, error: 'Use whole rupees.' });
  });
});

describe('Adjust split (PLAN item 9)', () => {
  it('snaps to steps of 10 within 0–100', () => {
    expect(normaliseCushionPct(34)).toBe(30);
    expect(normaliseCushionPct(-20)).toBe(0);
    expect(normaliseCushionPct(140)).toBe(100);
    expect(normaliseCushionPct(Number.NaN)).toBe(0);
  });
  it('starts at the suggestion with no trade-off line', () => {
    const plan = buildPlan(answers(), TODAY);
    expect(plan.cushionPct).toBe(50);
    expect(plan.suggestedCushionPct).toBe(50);
    expect(plan.splitNote).toBeUndefined();
  });
  it('below the suggestion shows the "less cushion" line', () => {
    const plan = buildPlan(answers(), TODAY, 30);
    expect(plan.splitNote).toBe(SPLIT_NOTES.less);
    expect(plan.buckets.map((b) => b.amount)).toEqual([1200, 2800]);
  });
  it('above the suggestion shows the "more cushion" line', () => {
    const plan = buildPlan(answers(), TODAY, 80);
    expect(plan.splitNote).toBe(SPLIT_NOTES.more);
    expect(plan.buckets.map((b) => b.amount)).toEqual([3200, 800]);
  });
  it('re-runs rounding and merge on every step', () => {
    const plan = buildPlan(answers({ monthly: 500, monthlyChoice: 500 }), TODAY, 90); // 450 / 50 → merge
    expect(plan.buckets).toHaveLength(1);
    expect(plan.mergeNote).toBeDefined();
    expect(plan.splitNote).toBe(SPLIT_NOTES.more);
  });
  it('0% and 100% give a single bucket', () => {
    expect(buildPlan(answers(), TODAY, 0).buckets.map((b) => b.role)).toEqual(['grow']);
    expect(buildPlan(answers(), TODAY, 100).buckets.map((b) => b.role)).toEqual(['cushion']);
  });
  it('liquid grow category collapses into one liquid bucket with its own line', () => {
    const plan = buildPlan(answers({ horizon: 'lt1' }), TODAY, 40);
    expect(plan.buckets).toHaveLength(1);
    expect(plan.buckets[0]).toMatchObject({ role: 'cushion', fundId: 'liquid1', amount: 4000 });
    expect(plan.splitNote).toBe(SPLIT_NOTES.liquid);
    expect(plan.cushionPct).toBe(40);
  });
  it('keeps the A-rule and suggestion when overridden', () => {
    const plan = buildPlan(answers(), TODAY, 70);
    expect(plan.rule).toBe('A4');
    expect(plan.suggestedCushionPct).toBe(50);
  });
});

describe('isCompleteCheckin', () => {
  it('needs every answer and a valid monthly amount', () => {
    expect(isCompleteCheckin(base)).toBe(true);
    expect(isCompleteCheckin({ ...base, monthly: 99 })).toBe(false);
    const { horizon: _h, ...partial } = base;
    expect(isCompleteCheckin(partial)).toBe(false);
    expect(isCompleteCheckin(undefined)).toBe(false);
  });
});
