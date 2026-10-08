import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { reducer } from '../state/reducer';
import type { State } from '../state/types';
import { advance, agedSip, run, TODAY, withNextDebit } from '../test/fixtures';
import { businessDaysBetween, CUTOFF_BUSINESS_DAYS, CUTOFF_LINE, isBusinessDay, sipChangeWindow, withinCutoff } from './cutoff';
import { addDays } from './dates';
import { simToday } from './market';
import { upcomingSips } from './nextStep';

// 2026-10-05 is a Monday.
const MON = '2026-10-05';

describe('business days on the simulated calendar', () => {
  it('Monday to Friday are business days, the weekend is not', () => {
    expect(isBusinessDay('2026-10-05')).toBe(true); // Mon
    expect(isBusinessDay('2026-10-09')).toBe(true); // Fri
    expect(isBusinessDay('2026-10-10')).toBe(false); // Sat
    expect(isBusinessDay('2026-10-11')).toBe(false); // Sun
  });
  it('counts business days after the start day, up to and including the end day', () => {
    expect(businessDaysBetween(MON, '2026-10-05')).toBe(0);
    expect(businessDaysBetween(MON, '2026-10-06')).toBe(1);
    expect(businessDaysBetween(MON, '2026-10-08')).toBe(3);
    expect(businessDaysBetween(MON, '2026-10-09')).toBe(4);
    expect(businessDaysBetween('2026-10-09', '2026-10-12')).toBe(1); // Fri → Mon
    expect(businessDaysBetween('2026-10-10', '2026-10-12')).toBe(1); // Sat → Mon
    expect(businessDaysBetween('2026-10-12', '2026-10-05')).toBe(0);
  });
  it('is within the cutoff at 3 business days and out of it at 4', () => {
    expect(CUTOFF_BUSINESS_DAYS).toBe(3);
    expect(withinCutoff(MON, '2026-10-08')).toBe(true); // Thu: Tue, Wed, Thu
    expect(withinCutoff(MON, '2026-10-09')).toBe(false); // Fri: 4
  });
  it('weekends do not count', () => {
    expect(withinCutoff('2026-10-02', '2026-10-05')).toBe(true); // Fri → Mon is 1
    expect(withinCutoff('2026-10-02', '2026-10-07')).toBe(true); // Fri → Wed: Mon, Tue, Wed
    expect(withinCutoff('2026-10-02', '2026-10-08')).toBe(false); // Fri → Thu: 4
  });
});

const aged = agedSip;
const withDay = withNextDebit;

describe('sipChangeWindow', () => {
  it('a debit well ahead leaves skip, pause and edit open and shows no line', () => {
    const s = withDay(aged(), false);
    const w = sipChangeWindow(s, s.sips[0]);
    expect(w).toMatchObject({ locked: false, canSkip: true, canPause: true, canEdit: true, canUndo: false });
    expect(w.line).toBeUndefined();
  });

  it('a debit within 3 business days closes skip, pause and edit and shows the one line', () => {
    const s = withDay(aged(), true);
    const w = sipChangeWindow(s, s.sips[0]);
    expect(w).toMatchObject({ locked: true, canSkip: false, canPause: false, canEdit: false });
    expect(w.line).toBe('Too close to the debit date to change this one. You can change the next.');
    expect(w.line).toBe(CUTOFF_LINE);
  });

  it('paused SIPs have no debit coming, so pause and edit stay open', () => {
    const s = run(withDay(aged(), false), { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    expect(sipChangeWindow(s, s.sips[0])).toMatchObject({ locked: false, canPause: true, canEdit: true, canSkip: false });
  });

  it('stopped SIPs offer nothing', () => {
    const s = run(aged(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(sipChangeWindow(s, s.sips[0])).toMatchObject({ canSkip: false, canPause: false, canEdit: false, canUndo: false });
  });
});

describe('the reducer enforces the cutoff', () => {
  it('outside the cutoff skip, pause and edit work', () => {
    const open = withDay(aged(), false);
    expect(run(open, { type: 'skipNext', sipId: 'sip_1' }).sips[0].skipNext).toBe(true);
    expect(run(open, { type: 'pauseSip', sipId: 'sip_1', months: 1 }).sips[0].status).toBe('paused');
    expect(run(open, { type: 'editSip', sipId: 'sip_1', amount: 1500 }).sips[0].amount).toBe(1500);
  });

  it('inside the cutoff the same actions change nothing', () => {
    const closed = withDay(aged(), true);
    expect(reducer(closed, { type: 'skipNext', sipId: 'sip_1' })).toBe(closed);
    expect(reducer(closed, { type: 'pauseSip', sipId: 'sip_1', months: 1 })).toBe(closed);
    expect(reducer(closed, { type: 'editSip', sipId: 'sip_1', amount: 1500 })).toBe(closed);
    expect(reducer(closed, { type: 'editSip', sipId: 'sip_1', dayOfMonth: 25 })).toBe(closed);
  });

  it('skip, then undo straight away: allowed, because the debit is still outside the cutoff', () => {
    const skipped = run(withDay(aged(), false), { type: 'skipNext', sipId: 'sip_1' });
    const w = sipChangeWindow(skipped, skipped.sips[0]);
    expect(w).toMatchObject({ canSkip: false, canUndo: true });
    expect(w.line).toBeUndefined();
    expect(run(skipped, { type: 'undoSkip', sipId: 'sip_1' }).sips[0].skipNext).toBe(false);
  });

  it('undo works only before the cutoff: once the skipped debit is that close, the skip stays', () => {
    const skipped = run(withDay(aged(), false), { type: 'skipNext', sipId: 'sip_1' });
    // Move the simulated today to the day before the skipped debit.
    const skippedDate = upcomingSips(skipped)[0].skippedDate!;
    const close = addDays(skippedDate, -1);
    const late: State = { ...skipped, market: { ...skipped.market, startDate: addDays(close, -7 * skipped.market.week) } };
    expect(simToday(late.market)).toBe(close);
    const w = sipChangeWindow(late, late.sips[0]);
    expect(w.canUndo).toBe(false);
    expect(w.line).toBe(CUTOFF_LINE);
    expect(reducer(late, { type: 'undoSkip', sipId: 'sip_1' })).toBe(late);
    // Pause and edit concern the next debit, a month away, so they stay open.
    expect(w).toMatchObject({ canPause: true, canEdit: true });
  });

  it('Riya: advancing weeks keeps the window consistent with the rules', () => {
    let s = buildPersona('riya', TODAY);
    for (let i = 0; i < 6; i++) {
      s = advance(s, 1, 'normal');
      const sip = s.sips.find((x) => x.status === 'active')!;
      const w = sipChangeWindow(s, sip);
      expect(w.canSkip).toBe(!w.locked && !sip.skipNext);
      expect(w.canPause).toBe(!w.locked);
      expect(w.canEdit).toBe(!w.locked);
      expect(!!w.line).toBe(w.locked);
    }
  });
});
