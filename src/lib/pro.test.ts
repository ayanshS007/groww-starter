import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { READINESS_QUESTIONS } from '../data/learn';
import { reducer } from '../state/reducer';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import { sliceRange, CHART_RANGES } from './chartRanges';
import { isSteady, marketMood } from './mood';
import { NO_PROMO_SCREENS, PRO_FEATURES, promoAllowed, proMode, proViewOn, showUpgradeBanner } from './pro';
import { scoreReadiness } from './readiness';
import type { ScreenId } from './routes';

const calm = run(fresh(), { type: 'setPreview', patch: { mood: 'flat' } });
const steady = run(fresh(), { type: 'setPreview', patch: { mood: 'big_dip' } });

describe('lock state', () => {
  it('starts locked: features show as locked, Pro view is off', () => {
    const s = fresh();
    expect(s.prefs.proUnlocked).toBe(false);
    expect(proViewOn(s)).toBe(false);
    expect(proMode(calm, 'fund')).toBe('locked');
    expect(proMode(calm, 'dashboard')).toBe('locked');
  });
  it('Pro view cannot be switched on while locked', () => {
    expect(run(fresh(), { type: 'setView', view: 'pro' }).prefs.view).toBe('starter');
  });
  it('unlocked: live with Pro view on, hidden (not locked) with it off', () => {
    const on = run(calm, { type: 'unlockPro' });
    expect(proMode(on, 'fund')).toBe('live');
    const off = run(on, { type: 'setView', view: 'starter' });
    expect(off.prefs.proUnlocked).toBe(true);
    expect(proMode(off, 'fund')).toBe('hidden');
    expect(proMode(run(off, { type: 'setView', view: 'pro' }), 'fund')).toBe('live');
  });
  it('lists the seven Pro features, none of them with a price', () => {
    expect(PRO_FEATURES.map((f) => f.id).sort()).toEqual(['analytics', 'compare', 'index', 'metrics', 'orders', 'ranges', 'watchlist']);
    expect(JSON.stringify(PRO_FEATURES)).not.toMatch(/₹|price|pay|subscri/i);
  });
  it('the upgrade banner is for the Explore hub only, while locked', () => {
    expect(showUpgradeBanner(calm, 'explore')).toBe(true);
    for (const screen of ['home', 'fund', 'dashboard', 'you', 'portfolio', 'stocks'] as ScreenId[]) expect(showUpgradeBanner(calm, screen)).toBe(false);
    expect(showUpgradeBanner(run(calm, { type: 'unlockPro' }), 'explore')).toBe(false);
  });
});

describe('unlock via the quick check', () => {
  const answers = (wrong: number) => READINESS_QUESTIONS.map((q, i) => (i < wrong ? (q.correctIndex + 1) % q.options.length : q.correctIndex));

  it('4 of 5 passes and unlocks Pro with Pro view on', () => {
    const r = scoreReadiness(answers(1));
    expect(r.passed).toBe(true);
    const s = reducer(fresh(), { type: 'passReadiness', passed: r.passed });
    expect(s.prefs).toMatchObject({ proUnlocked: true, view: 'pro', readinessPassed: true });
  });
  it('3 of 5 fails, changes nothing and can be retried', () => {
    const r = scoreReadiness(answers(2));
    expect(r.passed).toBe(false);
    expect(r.wrongIds).toHaveLength(2);
    const failed = reducer(fresh(), { type: 'passReadiness', passed: r.passed });
    expect(failed.prefs).toMatchObject({ proUnlocked: false, view: 'starter', readinessPassed: false });
    const retry = reducer(failed, { type: 'passReadiness', passed: scoreReadiness(answers(0)).passed });
    expect(retry.prefs.proUnlocked).toBe(true);
  });
  it('a later fail never takes Pro away, and passing again keeps the user’s Pro view choice', () => {
    let s = run(fresh(), { type: 'unlockPro' }, { type: 'setView', view: 'starter' });
    s = reducer(s, { type: 'passReadiness', passed: true });
    expect(s.prefs.view).toBe('starter');
    expect(reducer(s, { type: 'passReadiness', passed: false }).prefs.proUnlocked).toBe(true);
  });
  it('reviewer Unlock Pro / Lock Pro', () => {
    const on = reducer(fresh(), { type: 'unlockPro' });
    expect(on.prefs).toMatchObject({ proUnlocked: true, view: 'pro' });
    expect(reducer(on, { type: 'lockPro' }).prefs).toMatchObject({ proUnlocked: false, view: 'starter', readinessPassed: false });
  });
});

describe('hidden in Steady mode, flows and the stop coach', () => {
  it('Steady mode hides the banner and every locked chip, on every screen', () => {
    expect(isSteady(marketMood(steady))).toBe(true);
    expect(showUpgradeBanner(steady, 'explore')).toBe(false);
    for (const screen of ['explore', 'fund', 'stock', 'dashboard', 'home', 'you'] as ScreenId[]) {
      expect(proMode(steady, screen)).toBe('hidden');
      expect(promoAllowed(steady, screen)).toBe(false);
    }
  });
  it('a real big dip (Riya) is Steady mode too, and a calmer week brings the banner back', () => {
    const riya = buildPersona('riya', TODAY);
    expect(showUpgradeBanner(riya, 'explore')).toBe(false);
    expect(showUpgradeBanner(run(riya, { type: 'setPreview', patch: { mood: 'up' } }), 'explore')).toBe(true);
  });
  it('the Stop coach, invest flow, KYC, check-in and the buy flow never show locked Pro', () => {
    expect(NO_PROMO_SCREENS).toEqual(expect.arrayContaining(['stopCoach', 'invest', 'investPlan', 'kyc', 'checkin', 'stockBuy']));
    for (const screen of NO_PROMO_SCREENS) {
      expect(proMode(calm, screen)).toBe('hidden');
      expect(showUpgradeBanner(calm, screen)).toBe(false);
    }
  });
  it('unlocked Pro stays live in Steady mode: it is not promotion', () => {
    expect(proMode(run(steady, { type: 'unlockPro' }), 'fund')).toBe('live');
  });
  it('a dip that the user lives through switches the banner off', () => {
    let s = startSip(withCheckin(fresh()), 'index50', 500);
    s = run(s, { type: 'setPreview', patch: { mood: 'flat' } });
    expect(showUpgradeBanner(s, 'explore')).toBe(true);
    s = advance(run(s, { type: 'setPreview', patch: { mood: 'auto' } }), 3, 'dip_sharp');
    if (isSteady(marketMood(s))) expect(showUpgradeBanner(s, 'explore')).toBe(false);
  });
});

describe('chart ranges', () => {
  const pts = Array.from({ length: 24 }, (_, i) => i);
  it('each range is the tail of the sample series, All is everything', () => {
    expect(CHART_RANGES).toEqual(['1W', '1M', '1Y', 'All']);
    expect(sliceRange(pts, 'All')).toHaveLength(24);
    expect(sliceRange(pts, '1W').length).toBeLessThan(sliceRange(pts, '1M').length);
    expect(sliceRange(pts, '1M').length).toBeLessThan(sliceRange(pts, '1Y').length);
    expect(sliceRange(pts, '1W').at(-1)).toBe(23);
  });
});
