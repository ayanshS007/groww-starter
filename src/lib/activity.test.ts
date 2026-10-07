import { describe, expect, it } from 'vitest';
import { advance, fresh, run, startSip, TODAY } from '../test/fixtures';
import type { Sip, State } from '../state/types';
import { activeSipTotal, applyRedeem, dueInstalments, firstAutoDate, nextDueDate, nextId } from './activity';
import { simToday } from './market';

const sip = (patch: Partial<Sip> = {}): Sip => ({
  id: 'sip_1',
  fundId: 'index50',
  amount: 1000,
  dayOfMonth: 10,
  status: 'active',
  skipNext: false,
  instalments: 1,
  createdAt: TODAY,
  createdWeek: 0,
  ...patch,
});

/** Index SIP on the 10th, created 7 Oct (week 0), now at week 1 (14 Oct). Next due 10 Nov. */
const base = (): State => startSip(fresh(), 'index50', 1000, 10);
const instalments = (s: State) => s.activity.filter((a) => a.kind === 'sip_instalment');

describe('ids', () => {
  it('uses max suffix + 1 so deleted items never clash', () => {
    expect(nextId('goal', [])).toBe('goal_1');
    expect(nextId('goal', [{ id: 'goal_2' }, { id: 'goal_5' }, { id: 'other_9' }])).toBe('goal_6');
  });
});

describe('due dates', () => {
  it('waits at least 15 days after the first payment', () => {
    expect(firstAutoDate({ createdAt: TODAY, dayOfMonth: 10 })).toBe('2026-11-10');
    expect(firstAutoDate({ createdAt: TODAY, dayOfMonth: 28 })).toBe('2026-10-28');
    expect(nextDueDate({ createdAt: TODAY, dayOfMonth: 10 }, '2026-12-11')).toBe('2027-01-10');
  });
  it('lists every due date in (from, to], sorted, skipping stopped SIPs', () => {
    const sips = [sip(), sip({ id: 'sip_2', dayOfMonth: 28 }), sip({ id: 'sip_3', status: 'stopped' })];
    expect(dueInstalments(sips, '2026-10-07', '2026-12-31')).toEqual([
      { sipId: 'sip_2', date: '2026-10-28' },
      { sipId: 'sip_1', date: '2026-11-10' },
      { sipId: 'sip_2', date: '2026-11-28' },
      { sipId: 'sip_1', date: '2026-12-10' },
      { sipId: 'sip_2', date: '2026-12-28' },
    ]);
    expect(dueInstalments(sips, '2026-11-10', '2026-11-27')).toEqual([]);
  });
});

describe('postWeek via advanceWeek', () => {
  it('advancing a week appends the scenario, moves the date and settles orders', () => {
    const s0 = base();
    expect(s0.orders.every((o) => o.status === 'done')).toBe(true); // first investment advanced a week
    const s1 = run(s0, { type: 'setScenario', scenario: 'up' }, { type: 'advanceWeek' });
    expect(s1.market.week).toBe(2);
    expect(s1.market.history).toEqual(['dip_small', 'up']);
    expect(simToday(s1.market)).toBe('2026-10-21');
  });
  it('posts an instalment in the week its date falls in, at that week’s NAV', () => {
    const s = advance(base(), 4, 'flat'); // week 5 = 11 Nov, covers 10 Nov
    const posted = instalments(s);
    expect(posted).toHaveLength(2);
    expect(posted[1]).toMatchObject({ at: '2026-11-10', week: 5, amount: 1000 });
    expect(s.sips[0].instalments).toBe(2);
    expect(s.holdings[0].invested).toBe(2000);
  });
  it('a skip is consumed by the next instalment and moves no money', () => {
    let s = run(base(), { type: 'skipNext', sipId: 'sip_1' });
    expect(s.sips[0].skipNext).toBe(true);
    s = advance(s, 4, 'flat');
    expect(instalments(s)).toHaveLength(1);
    expect(s.activity.filter((a) => a.kind === 'sip_skipped')).toMatchObject([{ at: '2026-11-10', amount: 1000 }]);
    expect(s.sips[0]).toMatchObject({ skipNext: false, instalments: 1, status: 'active' });
    expect(s.holdings[0].invested).toBe(1000);
    s = advance(s, 5, 'flat'); // week 10 covers 10 Dec: posts again
    expect(instalments(s)).toHaveLength(2);
  });
  it('a paused SIP posts nothing until it resumes on its own', () => {
    let s = run(base(), { type: 'pauseSip', sipId: 'sip_1', months: 1 }); // paused until 14 Nov
    expect(s.sips[0]).toMatchObject({ status: 'paused', pausedUntil: '2026-11-14' });
    s = advance(s, 4, 'flat'); // week 5 = 11 Nov: 10 Nov skipped by the pause
    expect(instalments(s)).toHaveLength(1);
    expect(s.sips[0].status).toBe('paused');
    s = advance(s, 1, 'flat'); // week 6 = 18 Nov: passes pausedUntil → auto-resume
    expect(s.sips[0].status).toBe('active');
    expect(s.sips[0].pausedUntil).toBeUndefined();
    expect(s.activity.filter((a) => a.kind === 'sip_resumed')).toMatchObject([{ at: '2026-11-15', note: 'auto', week: 6 }]);
    s = advance(s, 4, 'flat'); // week 10 = 16 Dec: posts 10 Dec
    expect(instalments(s).map((a) => a.at)).toEqual([TODAY, '2026-12-10']);
    expect(s.sips[0].instalments).toBe(2);
  });
  it('resumes on the instalment date when the pause ends earlier that week', () => {
    let s = run(base(), { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    s = { ...s, sips: s.sips.map((x) => ({ ...x, pausedUntil: '2026-11-09' })) };
    s = advance(s, 4, 'flat'); // covers 10 Nov, after pausedUntil
    expect(s.sips[0].status).toBe('active');
    expect(instalments(s).map((a) => a.at)).toEqual([TODAY, '2026-11-10']);
  });
  it('a stopped SIP never posts again', () => {
    let s = run(base(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    s = advance(s, 12, 'normal');
    expect(instalments(s)).toHaveLength(1);
    expect(s.holdings[0].units).toBeGreaterThan(0);
  });
});

describe('helpers', () => {
  it('sums active SIPs only', () => {
    expect(activeSipTotal([sip(), sip({ id: 'b', amount: 500, status: 'paused' }), sip({ id: 'c', amount: 200 })])).toBe(1200);
  });
  it('redeems pro rata and drops empty holdings', () => {
    const h = [{ id: 'h_x', kind: 'fund' as const, assetId: 'index50', units: 10, invested: 1000, createdAt: TODAY, createdWeek: 0 }];
    expect(applyRedeem(h, 'h_x', 4)[0]).toMatchObject({ units: 6, invested: 600 });
    expect(applyRedeem(h, 'h_x', 10)).toEqual([]);
    expect(applyRedeem(h, 'h_x', 99)).toEqual([]);
  });
});
