import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { bucketForFund, bucketFundId, bucketHasLiveSip, bucketInvestPath, cushionFundId, hasRunningPlanSip, planAction, unpickedBuckets } from './planStatus';

const today = '2026-10-07';

describe('hasRunningPlanSip (QA #19: Payday card waits for a running plan SIP)', () => {
  it('false before any plan SIP, true once one is active, false when it is only paused', () => {
    expect(hasRunningPlanSip(buildPersona('kabir', today))).toBe(false);
    const riya = buildPersona('riya', today);
    expect(hasRunningPlanSip(riya)).toBe(true);
    expect(hasRunningPlanSip({ ...riya, sips: riya.sips.map((s) => ({ ...s, status: 'paused' as const })) })).toBe(false);
  });
});

describe('planAction (QA #8: the plan screen says what is already running)', () => {
  it('nothing running: start the whole plan', () => {
    const s = buildPersona('kabir', today);
    expect(planAction(s)).toMatchObject({ title: 'Ready when you are', cta: 'Start this plan', to: '/invest/plan' });
    expect(planAction(s)!.body).toContain('2 SIPs, ₹500 a month');
  });
  it('some parts running: set up the rest, with the missing amount', () => {
    const s = buildPersona('riya', today);
    const a = planAction(s)!;
    expect(a).toMatchObject({ title: 'Finish your plan', cta: 'Set up the rest', to: '/invest/plan' });
    expect(a.body).toBe('1 of 2 SIPs already running. This sets up the rest: ₹2,000 a month.');
  });
  it('everything running: points to the SIPs instead of starting again', () => {
    const s = buildPersona('arjun', today);
    expect(planAction(s)).toMatchObject({ title: 'Your plan is running', cta: 'See my SIPs', to: '/portfolio' });
  });
  it('no plan: nothing to show', () => {
    const s = buildPersona('riya', today);
    expect(planAction({ ...s, plan: undefined })).toBeNull();
  });
});

describe('plan parts and the user’s own picks (Stage 7a)', () => {
  const riya = buildPersona('riya', today);
  const cushion = riya.plan!.buckets.find((b) => b.role === 'cushion')!;
  const grow = riya.plan!.buckets.find((b) => b.role === 'grow')!;

  it('a part with no pick and no SIP has no fund, so the plan flow asks for one', () => {
    expect(bucketFundId(riya.sips, cushion)).toBeUndefined();
    expect(unpickedBuckets(riya).map((b) => b.role)).toEqual(['cushion']);
    expect(bucketInvestPath(riya.sips, cushion)).toBe('/invest/plan');
  });
  it('a running SIP in the category counts as the part’s fund, whichever fund it is', () => {
    expect(bucketFundId(riya.sips, grow)).toBe('index50');
    expect(bucketHasLiveSip(riya.sips, grow)).toBe(true);
    expect(bucketHasLiveSip(riya.sips, cushion)).toBe(false);
  });
  it('a pick sends the part straight to that fund', () => {
    const picked = { ...cushion, fundId: 'liquid2' as const };
    expect(bucketInvestPath(riya.sips, picked)).toBe('/invest/liquid2?amount=2000');
    expect(unpickedBuckets({ plan: { ...riya.plan!, buckets: [picked, grow] }, sips: riya.sips })).toEqual([]);
  });
  it('finds the part whose category lists a fund, and none for other funds', () => {
    expect(bucketForFund(riya.plan, 'liquid2')?.role).toBe('cushion');
    expect(bucketForFund(riya.plan, 'index50b')?.role).toBe('grow');
    expect(bucketForFund(riya.plan, 'gold1')).toBeUndefined();
  });
  it('a cushion top-up goes to the liquid fund the user picked or holds, never one chosen for them', () => {
    expect(cushionFundId(riya)).toBeUndefined();
    const picked = { ...riya, plan: { ...riya.plan!, buckets: riya.plan!.buckets.map((b) => (b.role === 'cushion' ? { ...b, fundId: 'liquid2' as const } : b)) } };
    expect(cushionFundId(picked)).toBe('liquid2');
    const holds = { ...riya, holdings: [...riya.holdings, { id: 'h_liquid1', kind: 'fund' as const, assetId: 'liquid1', units: 3, invested: 100, createdAt: today, createdWeek: 0 }] };
    expect(cushionFundId(holds)).toBe('liquid1');
  });
});
