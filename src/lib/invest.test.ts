import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { nextOrderId } from '../state/reducer';
import { unpickedBuckets } from './planStatus';
import type { InvestDraft, State } from '../state/types';
import { fresh, run, startSip, TODAY, withCheckin, withPicks } from '../test/fixtures';
import {
  amountPresets,
  ceilingNote,
  suggestedOverCeiling,
  checkUpiId,
  planDraft,
  planParts,
  planPartsMatch,
  resolveStep,
  stepAfter,
  stepBefore,
  stepProgress,
  stepsFor,
  successInfo,
  suggestedDay,
  validateInvestAmount,
} from './invest';

const sip = { min: 100, type: 'sip' as const };
const D = (p: Partial<InvestDraft>): InvestDraft => ({ mode: 'single', fundId: 'index50', type: 'sip', step: 'amount', riskAck: false, startedAt: TODAY, ...p });
const ctx = { autopay: false, kycDone: true };

describe('validateInvestAmount', () => {
  it('₹99 is below the ₹100 minimum, with a plain message', () => {
    expect(validateInvestAmount('99', sip)).toEqual({ ok: false, error: 'The minimum for a SIP in this fund is ₹100.' });
  });
  it('accepts ₹100 and commas', () => {
    expect(validateInvestAmount('100', sip)).toEqual({ ok: true, value: 100 });
    expect(validateInvestAmount('1,000', sip)).toEqual({ ok: true, value: 1000 });
  });
  it('rejects empty, decimals, over the maximum', () => {
    expect(validateInvestAmount('', sip)).toMatchObject({ ok: false, error: 'Enter an amount.' });
    expect(validateInvestAmount('100.5', sip)).toMatchObject({ ok: false, error: 'Use whole rupees.' });
    expect(validateInvestAmount('100001', sip)).toMatchObject({ ok: false, error: 'The maximum here is ₹1,00,000.' });
  });
  it('one-time uses its own minimum and wording', () => {
    expect(validateInvestAmount('400', { min: 500, type: 'one_time' })).toEqual({
      ok: false,
      error: 'The minimum for a one-time investment in this fund is ₹500.',
    });
  });
});

describe('amountPresets (PLAN item 27)', () => {
  it('plan amount plus ₹100, ₹500, ₹1,000 in order, plan one flagged', () => {
    expect(amountPresets(100, 2000)).toEqual([
      { value: 100, fromPlan: false },
      { value: 500, fromPlan: false },
      { value: 1000, fromPlan: false },
      { value: 2000, fromPlan: true },
    ]);
  });
  it('drops presets under the fund minimum and does not duplicate the plan amount', () => {
    expect(amountPresets(500, 500)).toEqual([
      { value: 500, fromPlan: true },
      { value: 1000, fromPlan: false },
    ]);
  });
});

describe('ceilingNote (soft, counts every monthly SIP)', () => {
  it('no note without a check-in', () => {
    expect(ceilingNote({ checkin: undefined, sips: [] }, 50000)).toBeUndefined();
  });
  it('compares existing live SIPs plus this one with the ceiling', () => {
    const s = startSip(withCheckin(fresh(), { incomeBand: 'lt10k' }), 'index50', 1000);
    expect(ceilingNote(s, 400)).toBeUndefined(); // 1,400 ≤ 1,500
    expect(ceilingNote(s, 600)).toContain('₹1,600');
    expect(ceilingNote(s, 600)).toContain('₹1,500');
  });
  it('leaves out a fund that is being replaced', () => {
    const s = startSip(withCheckin(fresh(), { incomeBand: 'lt10k' }), 'index50', 1000);
    expect(ceilingNote(s, 1500, ['index50'])).toBeUndefined();
  });
});

describe('suggested SIP date (README 8.2)', () => {
  it('salary → payday + 3; irregular or no check-in → the 10th', () => {
    const salary = withCheckin(fresh());
    expect(suggestedDay(salary)).toBe(4);
    expect(suggestedDay(run(salary, { type: 'setPayday', day: 5 }))).toBe(8);
    expect(suggestedDay(withCheckin(fresh(), { incomeType: 'stipend' }))).toBe(10);
    expect(suggestedDay(fresh())).toBe(10);
  });
});

describe('steps', () => {
  it('single SIP: amount → date → review → pay → mandate; mandate skipped once autopay exists', () => {
    expect(stepsFor({ mode: 'single', type: 'sip' }, false)).toEqual(['amount', 'date', 'review', 'pay', 'mandate']);
    expect(stepsFor({ mode: 'single', type: 'sip' }, true)).toEqual(['amount', 'date', 'review', 'pay']);
  });
  it('one-time has no date or mandate; plan has no amount step', () => {
    expect(stepsFor({ mode: 'single', type: 'one_time' }, false)).toEqual(['amount', 'review', 'pay']);
    expect(stepsFor({ mode: 'plan', type: 'sip' }, false)).toEqual(['date', 'review', 'pay', 'mandate']);
  });
  it('stepAfter / stepBefore / progress follow the list', () => {
    const d = D({ amount: 500, step: 'date' });
    expect(stepAfter(d, ctx)).toBe('review');
    expect(stepBefore(d, ctx)).toBe('amount');
    expect(stepProgress(d, ctx)).toEqual({ n: 2, of: 5 });
    expect(stepAfter(D({ amount: 500, step: 'mandate' }), ctx)).toBe('processing');
  });
});

describe('resolveStep (refresh and KYC rules)', () => {
  it('a saved draft resumes at the same step', () => {
    expect(resolveStep(D({ amount: 500, dayOfMonth: 10, step: 'review' }), ctx)).toBe('review');
  });
  it('payment steps need KYC: without it the draft shows review', () => {
    const d = D({ amount: 500, step: 'pay' });
    expect(resolveStep(d, { autopay: false, kycDone: false })).toBe('review');
    expect(resolveStep(d, { autopay: false, kycDone: true })).toBe('pay');
  });
  it('a single fund with no amount always starts at amount', () => {
    expect(resolveStep(D({ step: 'review' }), ctx)).toBe('amount');
  });
  it('steps that do not exist for this draft are mapped to ones that do', () => {
    expect(resolveStep(D({ type: 'one_time', amount: 500, step: 'date' }), ctx)).toBe('review');
    expect(resolveStep(D({ amount: 500, step: 'mandate' }), { autopay: true, kycDone: true })).toBe('pay');
    expect(resolveStep(D({ step: 'type' }), ctx)).toBe('amount');
  });
});

describe('plan flow', () => {
  const unpicked = withCheckin(fresh());
  const planned = withPicks(unpicked);
  it('asks for a pick first: nothing is in the draft until each part has a fund (Stage 7a)', () => {
    expect(unpickedBuckets(unpicked).map((b) => b.role)).toEqual(['cushion', 'grow']);
    expect(planParts(unpicked)).toEqual([]);
    const oneDone = withPicks({ ...unpicked }, {});
    expect(unpickedBuckets(oneDone)).toEqual([]);
    const cushionOnly = run(unpicked, { type: 'pickPlanFund', role: 'cushion', fundId: 'liquid2' });
    expect(unpickedBuckets(cushionOnly).map((b) => b.role)).toEqual(['grow']);
    expect(planParts(cushionOnly).map((p) => p.fundId)).toEqual(['liquid2']);
  });
  it('a pick must be one of the part’s listed funds', () => {
    const bad = run(unpicked, { type: 'pickPlanFund', role: 'cushion', fundId: 'index50' });
    expect(bad.plan!.buckets[0].fundId).toBeUndefined();
  });
  it('picks survive a change of split and a redo of the same answers', () => {
    const s = run(planned, { type: 'setPlanSplit', cushionPct: 80 });
    expect(s.plan!.buckets.map((b) => b.fundId)).toEqual(['liquid1', 'index50']);
    const redo = run(planned, { type: 'completeCheckin' });
    expect(redo.plan!.buckets.map((b) => b.fundId)).toEqual(['liquid1', 'index50']);
  });
  it('a pick is dropped when its category changes', () => {
    const s = run(planned, { type: 'saveCheckinAnswer', answers: { horizon: '1to3' } }, { type: 'completeCheckin' });
    const grow = s.plan!.buckets.find((b) => b.role === 'grow')!;
    expect(grow.category).toBe('short_debt');
    expect(grow.fundId).toBeUndefined();
    expect(s.plan!.buckets.find((b) => b.role === 'cushion')!.fundId).toBe('liquid1');
  });
  it('one draft with both parts; a part with a running SIP is left out', () => {
    expect(planParts(planned).map((p) => [p.fundId, p.amount])).toEqual([
      ['liquid1', 2000],
      ['index50', 2000],
    ]);
    const half = startSip(planned, 'index50', 2000);
    expect(planParts(half).map((p) => p.fundId)).toEqual(['liquid1']);
  });
  it('detects when the plan changed under a saved draft', () => {
    const d = planDraft(planned);
    expect(planPartsMatch(d, planned)).toBe(true);
    expect(planPartsMatch(d, run(planned, { type: 'setPlanSplit', cushionPct: 80 }))).toBe(false);
  });
  it('placing the plan batch creates both SIPs, one mandate, one success', () => {
    let s = run(planned, { type: 'startInvestDraft', draft: { ...planDraft(planned), dayOfMonth: 4, riskAck: true, step: 'processing' } });
    const id = nextOrderId(s);
    s = run(s, { type: 'placeInvestOrder' });
    expect(s.sips).toHaveLength(2);
    expect(s.sips.every((x) => x.batchId === 'batch_1')).toBe(true);
    expect(s.user.autopay).toBe(true);
    expect(s.investDraft).toBeUndefined();
    expect(s.orders.every((o) => o.pickReason === 'plan')).toBe(true);
    const info = successInfo(s, id)!;
    expect(info.headline).toBe('Your plan is set. 2 SIPs, ₹4,000 a month.');
    expect(info.rows).toHaveLength(2);
    expect(info.steps).toHaveLength(3);
  });
});

describe('success copy (PLAN item 32)', () => {
  it('first SIP, later SIP, one-time', () => {
    let s = startSip(withCheckin(fresh()), 'index50', 2000);
    expect(successInfo(s, 'ord_1')!.headline).toBe('Your first SIP is set.');
    s = startSip(s, 'liquid1', 2000);
    expect(successInfo(s, 'ord_2')!.headline).toBe('Your SIP is set.');
    const one = run(
      fresh(),
      { type: 'startInvestDraft', draft: { mode: 'single', fundId: 'liquid1', type: 'one_time', amount: 750, step: 'processing', riskAck: true } },
      { type: 'placeInvestOrder' },
    );
    const info = successInfo(one, 'ord_1')!;
    expect(info.headline).toBe('₹750 invested.');
    expect(info.kind).toBe('one_time');
    expect(info.single).toBe(true);
  });
  it('unknown order → null', () => {
    expect(successInfo(fresh(), 'ord_9')).toBeNull();
  });
  it('copy never uses advice or hype words', () => {
    const s = startSip(withCheckin(fresh()), 'index50', 2000);
    const t = JSON.stringify(successInfo(s, 'ord_1'));
    expect(t).not.toMatch(/best|recommended|guaranteed|confetti|streak/i);
  });
});

describe('UPI id', () => {
  it('accepts name@bank, rejects the rest', () => {
    expect(checkUpiId('riya@bank').ok).toBe(true);
    expect(checkUpiId('riya').ok).toBe(false);
    expect(checkUpiId('').ok).toBe(false);
  });
});

describe('persona state still works with the flow', () => {
  it('Riya already has a live index SIP, so only the cushion part is left', () => {
    const riya: State = buildPersona('riya', TODAY);
    expect(planParts(riya)).toEqual([]); // the cushion part still needs a pick
    expect(unpickedBuckets(riya).map((b) => b.role)).toEqual(['cushion']);
    expect(planParts(withPicks(riya)).map((p) => p.fundId)).toEqual(['liquid1']);
  });
});

describe('suggestedOverCeiling (QA #18)', () => {
  it('Meera: raising her ₹1,500 SIP to ₹4,200 for the laptop goes over ₹4,000, said in one line', () => {
    const m = buildPersona('meera', TODAY);
    expect(suggestedOverCeiling(m, m.sips[0].id, 4200)).toBe('That’s more than the ₹4,000 a month that usually feels easy at your income. Your call.');
    expect(suggestedOverCeiling(m, m.sips[0].id, 4000)).toBeUndefined();
  });
  it('no check-in, no line', () => {
    expect(suggestedOverCeiling(fresh(), 'sip_1', 99999)).toBeUndefined();
  });
});
