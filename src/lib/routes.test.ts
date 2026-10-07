import { describe, expect, it } from 'vitest';
import { advance, fresh, run, startSip, withCheckin } from '../test/fixtures';
import type { State } from '../state/types';
import { buildPath, matchPath, parseHash, resolveRoute, safeNext, TOASTS } from './routes';

const go = (hash: string, state: State) => resolveRoute(parseHash(hash), state);

describe('parsing', () => {
  it('parses paths and queries', () => {
    expect(parseHash('')).toEqual({ path: '/', query: {} });
    expect(parseHash('#/')).toEqual({ path: '/', query: {} });
    expect(parseHash('#/kyc/2?next=%2Finvest%2Findex50')).toEqual({ path: '/kyc/2', query: { next: '/invest/index50' } });
    expect(parseHash('#/home/')).toEqual({ path: '/home', query: {} });
    expect(parseHash('#/x?bad=%E0%A4%A')).toEqual({ path: '/x', query: {} });
  });
  it('builds paths and matches params', () => {
    expect(buildPath('/signup', { next: '/checkin/1', none: undefined })).toBe('/signup?next=%2Fcheckin%2F1');
    expect(matchPath('/fund/:id', '/fund/index50')).toEqual({ id: 'index50' });
    expect(matchPath('/fund/:id', '/fund')).toBeNull();
  });
  it('only allows internal return paths', () => {
    expect(safeNext('/invest/index50')).toBe('/invest/index50');
    expect(safeNext('//evil.example')).toBeUndefined();
    expect(safeNext('https://evil.example')).toBeUndefined();
  });
});

describe('guards (PLAN section 3)', () => {
  const signedUp = run(fresh(), { type: 'signUp', mobile: '9876543210', name: 'R' });
  const planned = withCheckin(fresh());

  it('open routes resolve directly', () => {
    for (const p of ['/', '/home', '/explore', '/explore/funds', '/portfolio', '/learn', '/learn/glossary', '/you', '/review']) {
      expect(go('#' + p, fresh()).kind).toBe('screen');
    }
  });
  it('unknown and not-yet-built P1 routes go to Home', () => {
    for (const p of ['/nope', '/dashboard', '/payday', '/learn/card/sip', '/notifications']) {
      expect(go('#' + p, fresh())).toEqual({ kind: 'redirect', to: '/home' });
    }
  });
  it('/signup when already signed up → next or /home', () => {
    expect(go('#/signup', signedUp)).toEqual({ kind: 'redirect', to: '/home' });
    expect(go('#/signup?next=%2Fcheckin%2F1', signedUp)).toEqual({ kind: 'redirect', to: '/checkin/1' });
  });
  it('/checkin needs sign-up; bad steps go to step 1', () => {
    expect(go('#/checkin/3', fresh())).toEqual({ kind: 'redirect', to: '/signup?next=%2Fcheckin%2F1', toast: TOASTS.signUpFirst });
    expect(go('#/checkin/7', signedUp)).toEqual({ kind: 'redirect', to: '/checkin/1' });
    expect(go('#/checkin/6', signedUp)).toMatchObject({ kind: 'screen', screen: 'checkin', params: { step: '6' } });
  });
  it('/plan and /invest/plan need a completed check-in', () => {
    expect(go('#/plan', fresh())).toMatchObject({ kind: 'redirect', toast: TOASTS.signUpFirst });
    expect(go('#/plan', signedUp)).toEqual({ kind: 'redirect', to: '/checkin/1', toast: TOASTS.checkinFirst });
    expect(go('#/invest/plan', signedUp)).toEqual({ kind: 'redirect', to: '/checkin/1', toast: TOASTS.checkinFirst });
    expect(go('#/plan', planned)).toMatchObject({ kind: 'screen', screen: 'plan' });
    expect(go('#/invest/plan', planned)).toMatchObject({ kind: 'screen', screen: 'investPlan' });
  });
  it('/invest/plan with every plan SIP already running goes to Portfolio with a toast', () => {
    let s = planned;
    for (const b of planned.plan!.buckets) s = startSip(s, b.fundId, b.amount);
    expect(go('#/invest/plan', s)).toEqual({ kind: 'redirect', to: '/portfolio', toast: TOASTS.planRunning });
    // one part running: the flow still opens for the other part
    expect(go('#/invest/plan', startSip(planned, 'index50', 2000))).toMatchObject({ kind: 'screen', screen: 'investPlan' });
  });
  it('/kyc needs sign-up and keeps the return path', () => {
    const r = go('#/kyc/1?next=%2Finvest%2Findex50', fresh());
    expect(r).toMatchObject({ kind: 'redirect', toast: TOASTS.signUpFirst });
    if (r.kind === 'redirect') expect(parseHash('#' + r.to).query.next).toBe('/kyc/1?next=%2Finvest%2Findex50'); // round-trips to the same KYC step
    expect(go('#/kyc/9', signedUp)).toEqual({ kind: 'redirect', to: '/kyc/1' });
    const done = run(signedUp, { type: 'kycComplete' });
    expect(go('#/kyc/1?next=%2Finvest%2Findex50', done)).toEqual({ kind: 'redirect', to: '/invest/index50' });
    expect(go('#/kyc/1', done)).toEqual({ kind: 'redirect', to: '/you' });
  });
  it('/kyc/done shows "You’re verified" only once KYC is done', () => {
    expect(go('#/kyc/done?next=%2Fhome', signedUp)).toEqual({ kind: 'redirect', to: '/kyc/1?next=%2Fhome' });
    const done = run(signedUp, { type: 'kycComplete' });
    expect(go('#/kyc/done?next=%2Fhome', done)).toMatchObject({ kind: 'screen', screen: 'kyc', params: { step: 'done' } });
  });
  it('/fund and /invest need a valid fund id; invest does not need KYC (PLAN C5)', () => {
    expect(go('#/fund/x', fresh())).toEqual({ kind: 'redirect', to: '/explore/funds', toast: TOASTS.noFund });
    expect(go('#/invest/x', fresh())).toEqual({ kind: 'redirect', to: '/explore/funds', toast: TOASTS.noFund });
    expect(go('#/invest/index50', fresh())).toMatchObject({ kind: 'screen', screen: 'invest', params: { fundId: 'index50' } });
  });
  it('success, holding, SIP and stop coach need their records', () => {
    expect(go('#/invest/success/ord_1', fresh())).toMatchObject({ kind: 'redirect', to: '/portfolio' });
    expect(go('#/portfolio/holding/h_index50', fresh())).toMatchObject({ kind: 'redirect', to: '/portfolio' });
    expect(go('#/portfolio/sip/sip_1', fresh())).toMatchObject({ kind: 'redirect', to: '/portfolio' });
    expect(go('#/portfolio/sip/sip_1/stop', fresh())).toMatchObject({ kind: 'redirect', to: '/portfolio' });
    const s = startSip(fresh(), 'index50', 1000);
    expect(go('#/invest/success/ord_1', s)).toMatchObject({ kind: 'screen', screen: 'success' });
    expect(go('#/portfolio/holding/h_index50', s)).toMatchObject({ kind: 'screen', screen: 'holding' });
    expect(go('#/portfolio/sip/sip_1/stop', s)).toMatchObject({ kind: 'screen', screen: 'stopCoach' });
    const stopped = run(s, { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(go('#/portfolio/sip/sip_1/stop', stopped)).toEqual({ kind: 'redirect', to: '/portfolio/sip/sip_1' });
  });
  it('reset then a direct URL to /portfolio never crashes', () => {
    const s = run(advance(startSip(fresh(), 'index50', 1000), 2), { type: 'reset', today: '2026-10-07' });
    expect(go('#/portfolio', s)).toMatchObject({ kind: 'screen', screen: 'portfolio' });
    expect(go('#/portfolio/sip/sip_1', s)).toMatchObject({ kind: 'redirect', to: '/portfolio' });
  });
});
