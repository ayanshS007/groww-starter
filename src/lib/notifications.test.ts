import { describe, expect, it } from 'vitest';
import { advance, fresh, run, startSip } from '../test/fixtures';
import type { NotifKind, State } from '../state/types';
import { deriveNotifications, groupNotifications, unreadCount } from './notifications';

const kinds = (s: State) => deriveNotifications(s).map((n) => n.kind);
const byKind = (s: State, k: NotifKind) => deriveNotifications(s).filter((n) => n.kind === k);

// SIP on the 10th created 7 Oct; first investment moved to week 1 (14 Oct).
const base = () => startSip(fresh(), 'index50', 1000, 10);

describe('deriveNotifications', () => {
  it('nothing for a fresh state', () => {
    expect(deriveNotifications(fresh())).toEqual([]);
  });
  it('sip_done for each instalment, routed to the SIP', () => {
    const n = byKind(base(), 'sip_done');
    expect(n).toHaveLength(1);
    expect(n[0]).toMatchObject({ route: '/portfolio/sip/sip_1', body: expect.stringContaining('₹1,000') });
  });
  it('insight_ready once a held week has passed', () => {
    expect(byKind(base(), 'insight_ready')).toMatchObject([{ id: 'insight:1', route: '/portfolio' }]);
  });
  it('sip_due within 2 days of the simulated date', () => {
    // Week 4 = 4 Nov (6 days before 10 Nov): not yet. Shift to 8 Nov by moving startDate.
    let s = advance(base(), 3, 'flat');
    expect(byKind(s, 'sip_due')).toEqual([]);
    s = { ...s, market: { ...s.market, startDate: '2026-10-11' } }; // week 4 → 8 Nov
    const due = byKind(s, 'sip_due');
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({ id: 'sip_due:sip_1:2026-11-10', title: 'SIP due in 2 days' });
  });
  it('no sip_due when the next instalment is skipped', () => {
    let s = advance(base(), 3, 'flat');
    s = { ...s, market: { ...s.market, startDate: '2026-10-11' } };
    expect(byKind(run(s, { type: 'skipNext', sipId: 'sip_1' }), 'sip_due')).toEqual([]);
  });
  it('sip_skipped_paused for skips and pauses', () => {
    let s = run(base(), { type: 'skipNext', sipId: 'sip_1' });
    s = advance(s, 4, 'flat');
    s = run(s, { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    expect(byKind(s, 'sip_skipped_paused').map((n) => n.title).sort()).toEqual(['Instalment skipped', 'SIP paused']);
  });
  it('goal_progress at 25/50/75/100%', () => {
    let s = run(base(), { type: 'createGoal', name: 'Trip', target: 4000, byDate: '2027-10-01', sipIds: ['sip_1'] });
    // ₹1,000 of ₹4,000: 25% reached, not 50%.
    expect(byKind(s, 'goal_progress').map((n) => n.id)).toEqual(['goal:goal_1:25']);
    s = advance(s, 4, 'up'); // 10 Nov instalment → about ₹2,100
    expect(byKind(s, 'goal_progress').map((n) => n.id).sort()).toEqual(['goal:goal_1:25', 'goal:goal_1:50']);
    s = run(s, { type: 'updateGoal', goalId: 'goal_1', patch: { target: 1500 } });
    expect(byKind(s, 'goal_progress').map((n) => n.id).sort()).toEqual([
      'goal:goal_1:100',
      'goal:goal_1:25',
      'goal:goal_1:50',
      'goal:goal_1:75',
    ]);
  });
  it('milestone notifications for earned milestones', () => {
    expect(byKind(base(), 'milestone').map((n) => n.id).sort()).toEqual(['milestone:first_dip', 'milestone:first_investment']);
  });
  it('kyc_pending while verification is in progress', () => {
    const s = run(fresh(), { type: 'kycAdvance', progress: { step: 2, panOk: true } });
    expect(byKind(s, 'kyc_pending')).toMatchObject([{ id: 'kyc_pending', route: '/kyc/2' }]);
    expect(byKind(run(s, { type: 'kycComplete' }), 'kyc_pending')).toEqual([]);
  });
  it('respects notification preferences', () => {
    const s = run(base(), { type: 'setNotifPref', kind: 'sip_done', on: false });
    expect(kinds(s)).not.toContain('sip_done');
    expect(kinds(s)).toContain('insight_ready');
  });
  it('tracks read state with deterministic ids', () => {
    const s = base();
    const first = deriveNotifications(s);
    expect(deriveNotifications(s).map((n) => n.id)).toEqual(first.map((n) => n.id));
    expect(unreadCount(s)).toBe(first.length);
    const read = run(s, { type: 'markNotificationsRead', ids: first.map((n) => n.id) });
    expect(unreadCount(read)).toBe(0);
    expect(deriveNotifications(read).every((n) => n.read)).toBe(true);
  });
  it('never includes marketing or “buy now” copy', () => {
    const text = JSON.stringify(deriveNotifications(advance(base(), 6, 'up'))).toLowerCase();
    for (const w of ['buy now', 'market is up', 'offer', 'don’t miss']) expect(text).not.toContain(w);
  });
});

describe('groupNotifications', () => {
  it('"Today" is the current simulated week', () => {
    const s = advance(base(), 2, 'flat');
    const g = groupNotifications(deriveNotifications(s), s.market.week);
    expect(g.today.every((n) => n.week === 3)).toBe(true);
    expect(g.today.map((n) => n.kind)).toContain('insight_ready');
    expect(g.earlier.map((n) => n.kind)).toContain('sip_done');
  });
});
