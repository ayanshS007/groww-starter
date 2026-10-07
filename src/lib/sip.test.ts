import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import {
  checkSipEdit,
  defaultCompareFund,
  pauseOptions,
  sipDateText,
  sipFacts,
  sipHoldingId,
  stepUpAmount,
  stepUpLine,
  unitsValue,
} from './sip';

const riya = () => buildPersona('riya', TODAY);

describe('pauseOptions', () => {
  it('offers 1, 2 and 3 months with the date each ends', () => {
    const o = pauseOptions('2026-10-07');
    expect(o.map((x) => x.months)).toEqual([1, 2, 3]);
    expect(o.map((x) => x.resumeOn)).toEqual(['2026-11-07', '2026-12-07', '2027-01-07']);
    expect(o.map((x) => x.label)).toEqual(['1 month', '2 months', '3 months']);
  });
  it('clamps to the end of a short month', () => {
    expect(pauseOptions('2026-12-31')[1].resumeOn).toBe('2027-02-28');
  });
});

describe('step-up', () => {
  it('adds 10%, rounded to the nearest ₹10', () => {
    expect(stepUpAmount(2000)).toBe(2200);
    expect(stepUpAmount(1500)).toBe(1650);
    expect(stepUpAmount(1333)).toBe(1470);
  });
  it('is always at least ₹10 more', () => {
    expect(stepUpAmount(100)).toBe(110);
    expect(stepUpAmount(50)).toBe(60);
  });
  it('stepUpLine shows the date and both amounts, or nothing when off', () => {
    expect(stepUpLine({ amount: 2000 })).toBeUndefined();
    expect(stepUpLine({ amount: 2000, stepUpPct: 10, nextStepUpDate: '2027-10-07' })).toBe('Next step-up 7 Oct 2027: ₹2,000 → ₹2,200');
  });
});

describe('checkSipEdit', () => {
  const sip = { amount: 2000, dayOfMonth: 4 };
  const fund = { minSip: 100 };
  it('accepts a new amount and date and reports whether anything changed', () => {
    expect(checkSipEdit({ amount: '1,500', day: 12 }, sip, fund)).toEqual({ ok: true, amount: 1500, day: 12, changed: true });
    expect(checkSipEdit({ amount: '2000', day: 4 }, sip, fund)).toMatchObject({ ok: true, changed: false });
  });
  it('₹99 and ₹1,00,001 are refused with the usual messages', () => {
    expect(checkSipEdit({ amount: '99', day: 4 }, sip, fund)).toEqual({ ok: false, error: 'The minimum for a SIP in this fund is ₹100.' });
    expect(checkSipEdit({ amount: '100001', day: 4 }, sip, fund)).toEqual({ ok: false, error: 'The maximum here is ₹1,00,000.' });
    expect(checkSipEdit({ amount: '', day: 4 }, sip, fund)).toEqual({ ok: false, error: 'Enter an amount.' });
  });
  it('respects a higher fund minimum', () => {
    expect(checkSipEdit({ amount: '400', day: 4 }, sip, { minSip: 500 })).toMatchObject({ ok: false });
  });
  it('refuses days outside 1–28', () => {
    expect(checkSipEdit({ amount: '500', day: 0 }, sip, fund)).toEqual({ ok: false, error: 'Pick a day from 1 to 28.' });
    expect(checkSipEdit({ amount: '500', day: 29 }, sip, fund)).toMatchObject({ ok: false });
  });
});

describe('sipFacts', () => {
  it('active: next instalment date; skipped: names the skipped date and the one after', () => {
    let s = startSip(withCheckin(fresh()), 'index50', 2000, 20);
    const sip = () => s.sips[0];
    const first = sipFacts(s, sip());
    expect(first.nextDate).toBeDefined();
    expect(first.skippedDate).toBeUndefined();
    s = run(s, { type: 'skipNext', sipId: 'sip_1' });
    const skipped = sipFacts(s, sip());
    expect(skipped.skippedDate).toBe(first.nextDate);
    expect(skipped.nextDate! > first.nextDate!).toBe(true);
    expect(skipped.next).toContain('is skipped');
  });
  it('paused and stopped have their own lines', () => {
    let s = startSip(withCheckin(fresh()), 'index50', 2000);
    s = run(s, { type: 'pauseSip', sipId: 'sip_1', months: 2 });
    expect(sipFacts(s, s.sips[0]).next).toMatch(/^Restarts after /);
    s = run(s, { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(sipFacts(s, s.sips[0]).next).toMatch(/^Stopped on /);
  });
});

describe('units that stay invested', () => {
  it('unitsValue is the holding value and survives stopping', () => {
    const s = riya();
    const before = unitsValue(s, s.sips[0]);
    expect(before).toBeGreaterThan(0);
    const stopped = run(s, { type: 'stopSip', sipId: s.sips[0].id, reason: 'market_fell' });
    expect(unitsValue(stopped, stopped.sips[0])).toBeCloseTo(before, 6);
    expect(sipHoldingId(stopped, stopped.sips[0])).toBe('h_index50');
  });
  it('is 0 and has no holding id when nothing is held', () => {
    const s = fresh();
    expect(unitsValue(s, { fundId: 'index50' })).toBe(0);
    expect(sipHoldingId(s, { fundId: 'index50' })).toBeUndefined();
  });
});

describe('defaultCompareFund', () => {
  it('uses the plan’s alternative when it is a different fund', () => {
    const s = withCheckin(fresh(), { dipReaction: 'stay' }); // 5+ yrs + stay → Flexi Cap as the alternative
    expect(s.plan?.alternativeFundId).toBe('flexi1');
    expect(defaultCompareFund(s, { fundId: 'index50' })).toBe('flexi1');
  });
  it('falls back to a same-category fund, then to any other fund', () => {
    expect(defaultCompareFund({ plan: undefined }, { fundId: 'liquid1' })).toBe('liquid2');
    const id = defaultCompareFund({ plan: undefined }, { fundId: 'index50' });
    expect(id).not.toBe('index50');
  });
  it('never returns the SIP’s own fund', () => {
    const s = withCheckin(fresh());
    for (const f of ['liquid1', 'index50', 'gold1', 'midcap1'] as const) expect(defaultCompareFund(s, { fundId: f })).not.toBe(f);
  });
});

it('sipDateText', () => {
  expect(sipDateText({ dayOfMonth: 4 })).toBe('the 4th of every month');
  expect(sipDateText({ dayOfMonth: 22 })).toBe('the 22nd of every month');
});

describe('Advance one week ×3 with skip and pause (README 14)', () => {
  // Fixture today is 2026-10-07; the first investment applies one week, so the
  // simulated date is 2026-10-14 and the first auto-debit on the 3rd is 2026-11-03.
  const setup = () => {
    let s = startSip(withCheckin(fresh()), 'index50', 2000, 3);
    s = run(
      s,
      { type: 'startInvestDraft', draft: { mode: 'single', fundId: 'liquid1', type: 'sip', amount: 1000, dayOfMonth: 3, step: 'review', riskAck: true } },
      { type: 'placeInvestOrder' },
    );
    return run(s, { type: 'skipNext', sipId: 'sip_1' }, { type: 'pauseSip', sipId: 'sip_2', months: 1 });
  };

  it('three weeks: the skipped instalment is consumed and the paused SIP posts nothing', () => {
    const s = advance(setup(), 3, 'normal');
    expect(s.market.week).toBe(4);
    const [a, b] = s.sips;
    expect(a).toMatchObject({ skipNext: false, instalments: 1, status: 'active' });
    expect(b).toMatchObject({ instalments: 1, status: 'paused' });
    expect(s.activity.filter((x) => x.kind === 'sip_skipped').map((x) => [x.sipId, x.at])).toEqual([['sip_1', '2026-11-03']]);
    expect(s.activity.filter((x) => x.kind === 'sip_instalment')).toHaveLength(2); // just the two first payments
  });
  it('the pause ends by itself, and both SIPs post again on the next due date', () => {
    const s = advance(setup(), 8, 'normal'); // simulated date 2026-12-09
    const [a, b] = s.sips;
    expect(b.status).toBe('active');
    expect(s.activity.some((x) => x.kind === 'sip_resumed' && x.sipId === 'sip_2')).toBe(true);
    expect(a.instalments).toBe(2);
    expect(b.instalments).toBe(2);
  });
  it('a stopped SIP posts nothing more', () => {
    let s = run(setup(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    s = advance(s, 8, 'normal');
    expect(s.sips[0]).toMatchObject({ status: 'stopped', instalments: 1 });
  });
});
