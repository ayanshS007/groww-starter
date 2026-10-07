import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import type { State } from '../state/types';
import { buildPath, FLOW_SCREENS, matchPath, parseHash, resolveRoute, routeExists, safeNext, TOASTS } from './routes';

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
  it('Dashboard and the inbox open without any state (Stage 3d)', () => {
    expect(go('#/dashboard', fresh())).toMatchObject({ kind: 'screen', screen: 'dashboard' });
    expect(go('#/notifications', fresh())).toMatchObject({ kind: 'screen', screen: 'notifications' });
    expect(go('#/explore?tab=watchlist', fresh())).toMatchObject({ kind: 'screen', screen: 'explore', query: { tab: 'watchlist' } });
  });
  it('routeExists: every P0/P1 route is built; the P2 card route is not', () => {
    expect(routeExists('/dashboard')).toBe(true);
    expect(routeExists('/portfolio/sip/sip_9')).toBe(true);
    expect(routeExists('/invest/liquid1?amount=2000')).toBe(true);
    for (const p of ['/payday', '/portfolio/goals', '/portfolio/goal/goal_1', '/explore/stocks', '/stock/stk_voltara', '/stock/stk_voltara/buy', '/learn/tip-check', '/you/trading']) {
      expect(routeExists(p)).toBe(true);
    }
    expect(routeExists('/learn/card/sip')).toBe(false);
  });
  it('unknown routes and the unbuilt P2 card route go to Home', () => {
    for (const p of ['/nope', '/learn/card/sip']) {
      expect(go('#' + p, fresh())).toEqual({ kind: 'redirect', to: '/home' });
    }
  });
  it('Stage 3d-2 routes open, with missing-state redirects and toasts', () => {
    const planned = withCheckin(fresh());
    expect(go('#/payday', planned)).toMatchObject({ kind: 'screen', screen: 'payday' });
    expect(go('#/payday', fresh())).toMatchObject({ kind: 'redirect', to: '/signup?next=%2Fcheckin%2F1' });
    expect(go('#/payday', run(fresh(), { type: 'signUp', mobile: '9876543210', name: 'A' }))).toEqual({
      kind: 'redirect',
      to: '/checkin/1',
      toast: TOASTS.checkinFirst,
    });
    expect(go('#/portfolio/goals', fresh())).toMatchObject({ kind: 'screen', screen: 'goals' });
    expect(go('#/portfolio/goal/goal_9', fresh())).toEqual({ kind: 'redirect', to: '/portfolio/goals', toast: TOASTS.noGoal });
    const meera = buildPersona('meera', TODAY);
    expect(go('#/portfolio/goal/goal_1', meera)).toMatchObject({ kind: 'screen', screen: 'goal', params: { id: 'goal_1' } });
    expect(go('#/explore/stocks', fresh())).toMatchObject({ kind: 'screen', screen: 'stocks' });
    expect(go('#/stock/stk_voltara', fresh())).toMatchObject({ kind: 'screen', screen: 'stock' });
    expect(go('#/stock/stk_voltara/buy?qty=2', fresh())).toMatchObject({ kind: 'screen', screen: 'stockBuy', query: { qty: '2' } });
    expect(go('#/stock/nope', fresh())).toEqual({ kind: 'redirect', to: '/explore/stocks', toast: TOASTS.noStock });
    expect(go('#/stock/nope/buy', fresh())).toEqual({ kind: 'redirect', to: '/explore/stocks', toast: TOASTS.noStock });
    expect(go('#/learn/tip-check', fresh())).toMatchObject({ kind: 'screen', screen: 'tipCheck' });
    expect(go('#/you/trading', fresh())).toMatchObject({ kind: 'screen', screen: 'trading' });
  });
  it('the stock buy flow hides the tab bar', () => {
    expect(FLOW_SCREENS).toContain('stockBuy');
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
