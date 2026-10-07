import { describe, expect, it } from 'vitest';
import { advance, fresh, oneTime, run, startSip } from '../test/fixtures';
import { earnedMilestones, MILESTONE_COPY, nextUnseen } from './milestones';

const ids = (s: Parameters<typeof earnedMilestones>[0]) => earnedMilestones(s).map((m) => m.id);

describe('milestones', () => {
  it('nothing before the first investment', () => {
    expect(ids(fresh())).toEqual([]);
    expect(nextUnseen(fresh())).toBeNull();
  });
  it('first investment counts as instalment 1', () => {
    const s = startSip(fresh(), 'index50', 1000, 10);
    expect(ids(s)).toContain('first_investment');
    expect(s.sips[0].instalments).toBe(1);
  });
  it('3 instalments across all SIPs', () => {
    let s = startSip(startSip(fresh(), 'index50', 500, 10), 'liquid1', 500, 10); // 2 instalments
    expect(ids(s)).not.toContain('instalments_3');
    s = advance(s, 4, 'flat'); // 10 Nov posts both → 4
    expect(ids(s)).toContain('instalments_3');
  });
  it('triggers once: after "Got it" the next unseen one shows, then none', () => {
    let s = advance(startSip(fresh(), 'index50', 1000, 10), 1, 'up');
    // First investment applied a dip_small week, so first_dip is earned too.
    expect(ids(s)).toEqual(['first_investment', 'first_dip']);
    expect(nextUnseen(s)).toBe('first_investment');
    s = run(s, { type: 'seeMilestone', id: 'first_investment' });
    expect(nextUnseen(s)).toBe('first_dip');
    s = run(s, { type: 'seeMilestone', id: 'first_dip' }, { type: 'seeMilestone', id: 'first_dip' });
    expect(s.seenMilestones).toEqual(['first_investment', 'first_dip']);
    expect(nextUnseen(s)).toBeNull();
  });
  it('skips and pauses never reset counts', () => {
    let s = startSip(startSip(fresh(), 'index50', 500, 10), 'liquid1', 500, 10);
    s = advance(s, 4, 'flat'); // 4 instalments
    const before = ids(s);
    s = run(s, { type: 'skipNext', sipId: 'sip_1' }, { type: 'pauseSip', sipId: 'sip_2', months: 1 });
    s = advance(s, 5, 'flat'); // 10 Dec: sip_1 skipped; sip_2 paused until 18 Dec
    expect(s.activity.filter((a) => a.kind === 'sip_skipped')).toHaveLength(1);
    expect(s.activity.filter((a) => a.kind === 'sip_instalment')).toHaveLength(4);
    expect(ids(s)).toEqual(expect.arrayContaining(before));
    expect(ids(s)).toContain('instalments_3');
  });
  it('first dip: a holding existed during a down week and no SIP was stopped that week', () => {
    // One-time first investment applies a dip_small week straight away.
    expect(ids(oneTime(fresh(), 'index50', 1000))).toContain('first_dip');
    // Stopping in the dip week doesn't count; a later dip still does.
    const base = fresh();
    const activity = [
      { id: 'act_1', at: '2026-10-07', week: 0, kind: 'sip_instalment' as const, assetId: 'index50', amount: 1000, units: 6 },
      { id: 'act_2', at: '2026-10-14', week: 1, kind: 'sip_stopped' as const, sipId: 'sip_1' },
    ];
    const oneDip = { ...base, activity, market: { ...base.market, week: 1, history: ['dip_small' as const] } };
    expect(ids(oneDip)).not.toContain('first_dip');
    const twoDips = { ...oneDip, market: { ...oneDip.market, week: 2, history: ['dip_small' as const, 'dip_sharp' as const] } };
    expect(earnedMilestones(twoDips).find((m) => m.id === 'first_dip')?.week).toBe(2);
    // Up weeks never count.
    expect(ids({ ...oneDip, activity: [activity[0]], market: { ...oneDip.market, history: ['up' as const] } })).not.toContain('first_dip');
  });
  it('has calm copy with no streak or confetti language', () => {
    const text = JSON.stringify(MILESTONE_COPY).toLowerCase();
    for (const w of ['streak', 'confetti', 'points', 'don’t break', "don't break"]) expect(text).not.toContain(w);
  });
});
