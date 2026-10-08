// Change cutoff for the next instalment (Stage 7a, real autopay rules). Autopay debits are
// set up days ahead, so once the next debit is within 3 business days, that one can't be
// skipped, paused around or edited. The one after can. Pure: the calendar is the simulated one.
import type { ISODate, Sip, State } from '../state/types';
import { addDays, parseISO } from './dates';
import { upcomingSips } from './nextStep';
import { simToday } from './market';

export const CUTOFF_BUSINESS_DAYS = 3;

/** The one line shown wherever a change is unavailable. */
export const CUTOFF_LINE = 'Too close to the debit date to change this one. You can change the next.';

/** Monday to Friday. The prototype has no bank-holiday calendar. */
export function isBusinessDay(iso: ISODate): boolean {
  const d = parseISO(iso).getUTCDay();
  return d !== 0 && d !== 6;
}

/** Business days after `from`, up to and including `to`. Zero when `to` is not after `from`. */
export function businessDaysBetween(from: ISODate, to: ISODate): number {
  let n = 0;
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) if (isBusinessDay(d)) n++;
  return n;
}

/** True when a debit on `debitDate` is inside the cutoff on `today`. */
export function withinCutoff(today: ISODate, debitDate: ISODate): boolean {
  return businessDaysBetween(today, debitDate) <= CUTOFF_BUSINESS_DAYS;
}

export type SipChangeWindow = {
  /** The instalment a change would touch: the next one that will actually debit. */
  debitDate?: ISODate;
  /** The next debit is inside the cutoff. */
  locked: boolean;
  canSkip: boolean;
  /** Undo works only before the cutoff of the instalment that was skipped. */
  canUndo: boolean;
  canPause: boolean;
  canEdit: boolean;
  /** Set when something the user would expect to do is unavailable. */
  line?: string;
};

const OPEN: SipChangeWindow = { locked: false, canSkip: false, canUndo: false, canPause: true, canEdit: true };

/**
 * What can still change on a SIP today. Paused SIPs have no debit coming, so pause and edit stay
 * open; stopped SIPs have nothing to change.
 */
export function sipChangeWindow(state: Pick<State, 'sips' | 'market'>, sip: Pick<Sip, 'id' | 'status'>): SipChangeWindow {
  if (sip.status === 'stopped') return { ...OPEN, canPause: false, canEdit: false };
  if (sip.status === 'paused') return OPEN;
  const u = upcomingSips(state).find((x) => x.sip.id === sip.id);
  if (!u) return { ...OPEN, canSkip: true };
  const today = simToday(state.market);
  const skipped = !!u.skippedDate;
  const locked = withinCutoff(today, u.date);
  const canUndo = skipped && !withinCutoff(today, u.skippedDate!);
  const canSkip = !skipped && !locked;
  return {
    debitDate: u.date,
    locked,
    canSkip,
    canUndo,
    canPause: !locked,
    canEdit: !locked,
    line: (!skipped && locked) || (skipped && !canUndo) ? CUTOFF_LINE : undefined,
  };
}
