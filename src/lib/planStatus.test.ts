import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { hasRunningPlanSip, planAction } from './planStatus';

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
