import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import type { State } from '../state/types';
import { MOODS } from '../styles/tokens';
import {
  ambience,
  autoMood,
  isSteady,
  isWeekend,
  latestScenario,
  marketMood,
  moodFromNumbers,
  moodFromScenario,
  paidThisWeek,
  paydayGlow,
  simClock,
  timeOfDay,
} from './mood';

const at = (hour: number) => new Date(2026, 9, 7, hour, 0, 0);
const ch = (pct: number) => ({ amount: pct * 100, pct });

describe('moodFromScenario (no money of your own yet)', () => {
  it('maps every scenario', () => {
    expect(moodFromScenario('up')).toBe('up');
    expect(moodFromScenario('normal')).toBe('flat');
    expect(moodFromScenario('flat')).toBe('flat');
    expect(moodFromScenario('dip_small')).toBe('small_dip');
    expect(moodFromScenario('dip_sharp')).toBe('big_dip');
  });
});

describe('moodFromNumbers (your own week and overall change)', () => {
  it('up at +1% or more, flat in between, small dip at −0.5% or less', () => {
    expect(moodFromNumbers(ch(2.4), ch(3))).toBe('up');
    expect(moodFromNumbers(ch(1), ch(0))).toBe('up');
    expect(moodFromNumbers(ch(0.6), ch(0))).toBe('flat');
    expect(moodFromNumbers(ch(-0.4), ch(0))).toBe('flat');
    expect(moodFromNumbers(ch(-0.5), ch(0))).toBe('small_dip');
    expect(moodFromNumbers(ch(-1.8), ch(-2))).toBe('small_dip');
  });
  it('big dip at −5% in a week, or −10% overall (the insight’s big-dip line), even in an up week', () => {
    expect(moodFromNumbers(ch(-5), ch(-3))).toBe('big_dip');
    expect(moodFromNumbers(ch(-1), ch(-10))).toBe('big_dip');
    expect(moodFromNumbers(ch(2.4), ch(-11))).toBe('big_dip');
  });
});

describe('autoMood and marketMood', () => {
  it('a new user follows the scenario: the chosen one before any week, then the latest week', () => {
    const s = fresh();
    expect(autoMood(s)).toBe('flat');
    expect(autoMood(run(s, { type: 'setScenario', scenario: 'up' }))).toBe('up');
    const later = advance(s, 1, 'dip_sharp');
    expect(latestScenario(later.market)).toBe('dip_sharp');
    expect(autoMood(run(later, { type: 'setScenario', scenario: 'up' }))).toBe('big_dip');
  });
  it('Riya (index fund, two sharp weeks, about −12% overall) is a big dip: Steady mode', () => {
    const riya = buildPersona('riya', TODAY);
    expect(autoMood(riya)).toBe('big_dip');
    expect(isSteady(marketMood(riya))).toBe(true);
  });
  it('Arjun’s index SIP follows his own week', () => {
    const arjun = buildPersona('arjun', TODAY);
    expect(autoMood(advance(arjun, 1, 'up'))).toBe('up');
    expect(autoMood(advance(arjun, 1, 'dip_small'))).toBe('small_dip');
    expect(autoMood(advance(arjun, 1, 'flat'))).toBe('flat');
  });
  it('a liquid-only portfolio barely moves, so a sharp market week is not a big dip for it', () => {
    const s = advance(startSip(withCheckin(fresh(), { horizon: 'lt1' }), 'liquid1', 1000), 1, 'dip_sharp');
    expect(autoMood(s)).not.toBe('big_dip');
  });
  it('a reviewer preview overrides the simulation; auto clears it', () => {
    const riya = buildPersona('riya', TODAY);
    for (const mood of MOODS) expect(marketMood(run(riya, { type: 'setPreview', patch: { mood } }))).toBe(mood);
    expect(marketMood(run(riya, { type: 'setPreview', patch: { mood: 'up' } }, { type: 'setPreview', patch: { mood: 'auto' } }))).toBe('big_dip');
  });
  it('persona load and reset clear the preview', () => {
    const s = run(fresh(), { type: 'setPreview', patch: { mood: 'up', day: 'weekend' } });
    expect(run(s, { type: 'loadPersona', persona: 'kabir', today: TODAY }).preview).toBeUndefined();
    expect(run(s, { type: 'reset', today: TODAY }).preview).toBeUndefined();
  });
});

describe('simulated clock', () => {
  it('time of day buckets', () => {
    expect([4, 5, 11, 12, 16, 17, 20, 21, 0].map(timeOfDay)).toEqual([
      'night', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening', 'night', 'night',
    ]);
  });
  it('weekends come from the simulated date', () => {
    expect(isWeekend('2026-10-10')).toBe(true); // Saturday
    expect(isWeekend('2026-10-11')).toBe(true); // Sunday
    expect(isWeekend('2026-10-07')).toBe(false); // Wednesday
    expect(simClock(fresh('2026-10-10'), at(9))).toMatchObject({ date: '2026-10-10', weekend: true, timeOfDay: 'morning' });
    expect(simClock(fresh(), at(22))).toMatchObject({ weekend: false, timeOfDay: 'night' });
  });
  it('reviewer previews pin the time of day and the day', () => {
    const s = run(fresh(), { type: 'setPreview', patch: { timeOfDay: 'evening', day: 'weekend' } });
    expect(simClock(s, at(9))).toMatchObject({ timeOfDay: 'evening', weekend: true });
  });
});

describe('payday', () => {
  // Riya is salaried with payday on the 1st; her plan's index SIP is running.
  const riya = buildPersona('riya', TODAY);
  it('a reviewer pay credit lights this simulated week only', () => {
    const notPayWeek: State = { ...riya, checkin: { ...riya.checkin!, incomeType: 'parttime' } };
    expect(paidThisWeek(notPayWeek)).toBe(false);
    const credited = run(notPayWeek, { type: 'creditPay' });
    expect(paidThisWeek(credited)).toBe(true);
    expect(paidThisWeek(advance(credited, 1, 'flat'))).toBe(false);
  });
  it('a salary payday inside the last 7 simulated days counts', () => {
    const s = { ...fresh('2026-10-03'), checkin: { ...withCheckin(fresh()).checkin! }, user: { ...fresh().user, payday: 1 } };
    expect(paidThisWeek(s)).toBe(true); // 1 Oct is within 27 Sep – 3 Oct
    expect(paidThisWeek({ ...s, user: { ...s.user, payday: 10 } })).toBe(false);
  });
  it('the glow needs the "Got paid? Split it" card (a running plan SIP) and never shows in Steady mode', () => {
    const credited = run(riya, { type: 'creditPay' });
    expect(paydayGlow(credited, 'flat')).toBe(true);
    expect(paydayGlow(credited, 'big_dip')).toBe(false);
    expect(paydayGlow(run(withCheckin(fresh()), { type: 'creditPay' }), 'flat')).toBe(false);
  });
});

describe('ambience', () => {
  it('bundles mood, Steady mode, clock and payday', () => {
    const riya = buildPersona('riya', TODAY);
    expect(ambience(riya, at(19))).toMatchObject({ mood: 'big_dip', steady: true, timeOfDay: 'evening', payday: false });
    const up = run(riya, { type: 'setPreview', patch: { mood: 'up' } }, { type: 'creditPay' });
    expect(ambience(up, at(8))).toMatchObject({ mood: 'up', steady: false, timeOfDay: 'morning', payday: true });
  });
});
