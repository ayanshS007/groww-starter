import { describe, expect, it } from 'vitest';
import { getFund } from '../data/funds';
import { FIRST_WEEK_INSIGHT, insightFromState } from '../lib/insight';
import { currentNav, isProcessing, portfolioValue, simToday, totalInvested } from '../lib/market';
import { advance, fresh, oneTime, RIYA_ANSWERS, run, startSip, TODAY, withCheckin, withPicks } from '../test/fixtures';
import { createInitialState } from './initialState';
import { nextOrderId, reducer } from './reducer';
import type { State } from './types';

describe('initial state (PLAN section 4)', () => {
  it('matches the plan', () => {
    const s = createInitialState(TODAY);
    expect(s).toMatchObject({
      version: 1,
      user: { signedUp: false, kyc: 'none', bankLinked: false, autopay: false },
      holdings: [],
      sips: [],
      prefs: { view: 'starter', stockBudgetPct: 10, readinessPassed: false },
      market: { scenario: 'normal', week: 0, history: [], startDate: TODAY },
    });
    expect(Object.values(s.prefs.notif).every(Boolean)).toBe(true);
  });
});

describe('sign-up, check-in and plan', () => {
  it('keeps draft answers and builds the plan on completion', () => {
    let s = run(fresh(), { type: 'signUp', mobile: '9876543210', name: ' Riya ' });
    expect(s.user).toMatchObject({ signedUp: true, name: 'Riya', mobile: '9876543210' });
    s = run(s, { type: 'saveCheckinAnswer', answers: { incomeType: 'salary' } }, { type: 'completeCheckin' });
    expect(s.checkin).toBeUndefined(); // incomplete: no-op
    expect(s.checkinDraft).toEqual({ incomeType: 'salary' });
    s = run(s, { type: 'saveCheckinAnswer', answers: RIYA_ANSWERS }, { type: 'completeCheckin' });
    expect(s.checkin).toEqual(RIYA_ANSWERS);
    expect(s.plan?.buckets.map((b) => b.amount)).toEqual([2000, 2000]);
  });
  it('setPlanSplit re-runs the plan and keeps its date', () => {
    const s = run(withCheckin(fresh()), { type: 'setPlanSplit', cushionPct: 30 });
    expect(s.plan).toMatchObject({ cushionPct: 30, createdAt: TODAY, splitNote: expect.any(String) });
    expect(s.plan?.buckets.map((b) => b.amount)).toEqual([1200, 2800]);
  });
});

describe('KYC', () => {
  it('advances and completes', () => {
    let s = run(fresh(), { type: 'kycAdvance', progress: { step: 2, panOk: true } });
    expect(s.user.kyc).toBe('in_progress');
    expect(s.kycProgress).toEqual({ step: 2, panOk: true, aadhaarOk: false, selfieOk: false });
    s = run(s, { type: 'kycComplete' });
    expect(s.user).toMatchObject({ kyc: 'done', bankLinked: true });
    expect(s.kycProgress).toBeUndefined();
  });
});

describe('placeInvestOrder', () => {
  it('single SIP: first payment, order, autopay; no automatic market week (QA #15)', () => {
    const before = fresh();
    expect(nextOrderId(before)).toBe('ord_1');
    // Straight through the reducer: the fixtures add a week for older tests.
    const s = run(
      before,
      { type: 'startInvestDraft', draft: { mode: 'single', fundId: 'index50', type: 'sip', amount: 1000, dayOfMonth: 10, step: 'review', riskAck: true } },
      { type: 'placeInvestOrder' },
    );
    expect(s.investDraft).toBeUndefined();
    expect(s.sips).toMatchObject([{ id: 'sip_1', fundId: 'index50', amount: 1000, dayOfMonth: 10, instalments: 1, status: 'active' }]);
    expect(s.orders).toMatchObject([{ id: 'ord_1', type: 'sip_first', amount: 1000, status: 'processing' }]);
    expect(s.user.autopay).toBe(true);
    // A fresh account sees no market move: same week, same scenario, value = invested.
    expect(s.market).toMatchObject({ scenario: 'normal', week: 0, history: [] });
    expect(s.holdings[0].units).toBeCloseTo(1000 / 150, 9);
    expect(isProcessing(s.holdings[0], s.market)).toBe(true);
    expect(portfolioValue(s)).toBeCloseTo(1000, 6);
    expect(insightFromState(s)).toBe(FIRST_WEEK_INSIGHT);
    // The next simulated week settles it and the usual insight takes over.
    const later = run(s, { type: 'advanceWeek' });
    expect(isProcessing(later.holdings[0], later.market)).toBe(false);
    expect(later.orders[0].status).toBe('done');
    expect(insightFromState(later)?.branch).not.toBe('first_week');
  });
  it('later investments do not change the scenario or advance a week', () => {
    let s = startSip(fresh(), 'index50', 1000);
    s = run(s, { type: 'setScenario', scenario: 'up' });
    s = oneTime(s, 'liquid1', 500);
    expect(s.market).toMatchObject({ scenario: 'up', week: 1 });
    expect(s.orders.at(-1)).toMatchObject({ type: 'one_time', status: 'processing', units: 500 / currentNav('liquid1', s.market) });
    expect(s.activity.at(-1)).toMatchObject({ kind: 'one_time', amount: 500, week: 1 });
  });
  it('plan mode sets up both SIPs in one pass with one batch (PLAN C4, C11)', () => {
    const planned = withPicks(withCheckin(fresh()));
    const s = run(
      planned,
      {
        type: 'startInvestDraft',
        draft: {
          mode: 'plan',
          type: 'sip',
          planAmounts: planned.plan!.buckets.map((b) => ({ fundId: b.fundId!, amount: b.amount, role: b.role })),
          dayOfMonth: 4,
          step: 'review',
          riskAck: true,
        },
      },
      { type: 'placeInvestOrder' },
    );
    expect(s.sips.map((x) => [x.fundId, x.amount, x.dayOfMonth, x.batchId])).toEqual([
      ['liquid1', 2000, 4, 'batch_1'],
      ['index50', 2000, 4, 'batch_1'],
    ]);
    expect(s.orders.map((o) => [o.batchId, o.pickReason])).toEqual([
      ['batch_1', 'plan'],
      ['batch_1', 'plan'],
    ]);
    expect(totalInvested(s)).toBe(4000);
    expect(s.market.week).toBe(0); // QA #15: no automatic week after a first investment
  });
  it('rejects amounts under the fund minimum (₹99) and keeps the draft', () => {
    const s = run(
      fresh(),
      { type: 'startInvestDraft', draft: { mode: 'single', fundId: 'index50', type: 'sip', amount: 99, step: 'review', riskAck: true } },
      { type: 'placeInvestOrder' },
    );
    expect(s.orders).toEqual([]);
    expect(s.investDraft?.amount).toBe(99);
    expect(getFund('arb1')!.minSip).toBe(500);
    const arb = startSip(fresh(), 'arb1', 400);
    expect(arb.sips).toEqual([]);
  });
  it('the draft survives a refresh-style reload and updates in place', () => {
    let s = run(fresh(), {
      type: 'startInvestDraft',
      draft: { mode: 'single', fundId: 'liquid1', type: 'sip', step: 'amount', riskAck: false },
    });
    s = run(s, { type: 'updateInvestDraft', patch: { amount: 500, step: 'date' } });
    const reloaded = JSON.parse(JSON.stringify(s)) as State;
    expect(reloaded.investDraft).toMatchObject({ amount: 500, step: 'date', startedAt: TODAY });
    expect(run(reloaded, { type: 'clearInvestDraft' }).investDraft).toBeUndefined();
  });
});

describe('withdraw', () => {
  it('partial withdrawal reduces units and invested pro rata', () => {
    let s = oneTime(fresh(), 'liquid1', 2000);
    const nav = currentNav('liquid1', s.market);
    s = run(s, { type: 'withdraw', holdingId: 'h_liquid1', amount: 500 });
    expect(s.holdings[0].units).toBeCloseTo((2000 - (500 * 1000) / nav) / 1000, 6);
    expect(s.holdings[0].invested).toBeLessThan(2000);
    expect(s.orders.at(-1)).toMatchObject({ type: 'redeem', status: 'processing' });
    expect(s.activity.at(-1)).toMatchObject({ kind: 'redeem', amount: expect.closeTo(500, 6) });
  });
  it('withdraw all removes the holding; unknown holdings are a no-op', () => {
    let s = oneTime(fresh(), 'liquid1', 2000);
    s = run(s, { type: 'withdraw', holdingId: 'h_liquid1', all: true });
    expect(s.holdings).toEqual([]);
    expect(run(s, { type: 'withdraw', holdingId: 'h_nope', all: true })).toBe(s);
  });
});

describe('Flex SIP actions', () => {
  const base = () => startSip(fresh(), 'index50', 1000, 10);
  it('skip and undo', () => {
    const s = run(base(), { type: 'skipNext', sipId: 'sip_1' });
    expect(s.sips[0].skipNext).toBe(true);
    expect(run(s, { type: 'undoSkip', sipId: 'sip_1' }).sips[0].skipNext).toBe(false);
  });
  it('pause for 1–3 months and resume now', () => {
    let s = run(base(), { type: 'pauseSip', sipId: 'sip_1', months: 3 });
    expect(s.sips[0]).toMatchObject({ status: 'paused', pausedUntil: '2027-01-14' });
    expect(s.activity.at(-1)).toMatchObject({ kind: 'sip_paused', note: '3 months' });
    s = run(s, { type: 'resumeSip', sipId: 'sip_1' });
    expect(s.sips[0].status).toBe('active');
    expect(s.sips[0].pausedUntil).toBeUndefined();
  });
  it('edit amount and date, logging sip_edited', () => {
    const s = run(base(), { type: 'editSip', sipId: 'sip_1', amount: 1500, dayOfMonth: 31 });
    expect(s.sips[0]).toMatchObject({ amount: 1500, dayOfMonth: 28 });
    expect(s.activity.at(-1)).toMatchObject({ kind: 'sip_edited', note: 'Amount ₹1,000 → ₹1,500; Date 10th → 28th' });
    expect(run(base(), { type: 'editSip', sipId: 'sip_1', amount: 50 }).sips[0].amount).toBe(1000);
  });
  it('step-up +10% yearly toggles with the next date', () => {
    let s = run(base(), { type: 'toggleStepUp', sipId: 'sip_1' });
    expect(s.sips[0]).toMatchObject({ stepUpPct: 10, nextStepUpDate: '2027-10-07' });
    s = run(s, { type: 'toggleStepUp', sipId: 'sip_1' });
    expect(s.sips[0].stepUpPct).toBeUndefined();
  });
  it('stop keeps units invested and needs no reason', () => {
    const s = run(base(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(s.sips[0]).toMatchObject({ status: 'stopped', stopReason: 'none', stoppedAt: simToday(s.market) });
    expect(s.holdings[0].units).toBeGreaterThan(0);
    expect(run(s, { type: 'pauseSip', sipId: 'sip_1', months: 1 })).toBe(s);
  });
});

describe('goals', () => {
  it('creates, links (one goal per fund), updates and deletes', () => {
    let s = startSip(startSip(fresh(), 'liquid1', 500), 'liquid1', 300);
    s = run(
      s,
      { type: 'createGoal', name: 'Laptop', target: 45000, byDate: '2027-08-01', sipIds: ['sip_1'] },
      { type: 'createGoal', name: 'Trip', target: 10000, byDate: '2027-03-01' },
    );
    expect(s.goals.map((g) => [g.id, g.sipIds])).toEqual([
      ['goal_1', ['sip_1']],
      ['goal_2', []],
    ]);
    s = run(s, { type: 'linkSipToGoal', sipId: 'sip_2', goalId: 'goal_2' });
    // sip_1 is in the same fund, so it leaves goal_1.
    expect(s.goals.map((g) => g.sipIds)).toEqual([[], ['sip_2']]);
    expect(s.sips.map((x) => x.goalId)).toEqual([undefined, 'goal_2']);
    s = run(s, { type: 'updateGoal', goalId: 'goal_2', patch: { target: 12000 } }, { type: 'deleteGoal', goalId: 'goal_2' });
    expect(s.goals.map((g) => g.id)).toEqual(['goal_1']);
    expect(s.sips[1].goalId).toBeUndefined();
    expect(run(s, { type: 'createGoal', name: 'X', target: 1, byDate: '2027-01-01' }).goals.at(-1)?.id).toBe('goal_2');
  });
});

describe('stocks and preferences', () => {
  it('buys whole shares at the sample price, or the limit price', () => {
    let s = run(withCheckin(fresh()), { type: 'buyStock', stockId: 'stk_tealeaf', shares: 2.7, orderType: 'market', pickReason: 'social' });
    expect(s.holdings[0]).toMatchObject({ kind: 'stock', units: 2, invested: 2480 });
    expect(s.orders[0]).toMatchObject({ type: 'buy', orderType: 'market', pickReason: 'social', status: 'done' });
    s = run(s, { type: 'buyStock', stockId: 'stk_voltara', shares: 1, orderType: 'limit', limitPrice: 2400 });
    expect(s.orders.at(-1)).toMatchObject({ amount: 2400, limitPrice: 2400 });
    expect(run(s, { type: 'buyStock', stockId: 'nope', shares: 1, orderType: 'market' })).toBe(s);
  });
  it('sells whole shares through withdraw', () => {
    let s = run(fresh(), { type: 'buyStock', stockId: 'stk_greenfield', shares: 5, orderType: 'market' });
    s = run(s, { type: 'withdraw', holdingId: 'h_stk_greenfield', units: 2.9 });
    expect(s.holdings[0].units).toBe(3);
  });
  it('watchlist, budget, readiness, view, notifications, payday', () => {
    let s = run(
      fresh(),
      { type: 'toggleWatchlist', assetId: 'index50' },
      { type: 'toggleWatchlist', assetId: 'stk_orbitly' },
      { type: 'toggleWatchlist', assetId: 'index50' },
      { type: 'setStockBudget', pct: 250 },
      { type: 'passReadiness', passed: true },
      { type: 'passReadiness', passed: false },
      { type: 'setView', view: 'pro' },
      { type: 'setNotifPref', kind: 'sip_due', on: false },
      { type: 'markNotificationsRead', ids: ['a', 'b'] },
      { type: 'markNotificationsRead', ids: ['b', 'c'] },
      { type: 'setPayday', day: 30 },
    );
    expect(s.watchlist).toEqual(['stk_orbitly']);
    expect(s.prefs).toMatchObject({ stockBudgetPct: 100, readinessPassed: true, view: 'pro' });
    expect(s.prefs.notif.sip_due).toBe(false);
    expect(s.readNotifications).toEqual(['a', 'b', 'c']);
    expect(s.user.payday).toBe(28);
  });
});

describe('reviewer actions', () => {
  it('setScenario applies on the next advance', () => {
    const s = advance(fresh(), 1, 'dip_sharp');
    expect(s.market).toMatchObject({ scenario: 'dip_sharp', week: 1, history: ['dip_sharp'] });
  });
  it('loadPersona replaces state; reset starts over', () => {
    const s = run(startSip(fresh(), 'index50', 1000), { type: 'loadPersona', persona: 'riya', today: TODAY });
    expect(s.user.persona).toBe('riya');
    expect(simToday(s.market)).toBe(TODAY);
    expect(reducer(s, { type: 'reset', today: TODAY })).toEqual(createInitialState(TODAY));
  });
});
