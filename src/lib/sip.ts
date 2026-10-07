// SIP detail and Stop coach logic (README 9 items 12–13, PLAN S15–S16).
// Pure: the screens hold the copy that needs Terms; everything that decides lives here.
import { FUNDS, getFund } from '../data/funds';
import type { Fund, FundId, ISODate, Sip, State } from '../state/types';
import { holdingIdFor } from './activity';
import { addMonths } from './dates';
import { dateLabel, formatINR, ordinal } from './format';
import { validateInvestAmount } from './invest';
import { holdingValue } from './market';
import { upcomingSips } from './nextStep';

export const PAUSE_MONTHS = [1, 2, 3] as const;
export type PauseMonths = (typeof PAUSE_MONTHS)[number];

export const STEP_UP_PCT = 10;

/** Pause choices with the date each one ends (the SIP restarts on its own after it). */
export function pauseOptions(today: ISODate): { months: PauseMonths; resumeOn: ISODate; label: string }[] {
  return PAUSE_MONTHS.map((months) => ({
    months,
    resumeOn: addMonths(today, months),
    label: `${months} month${months > 1 ? 's' : ''}`,
  }));
}

/** Step-up amount: +10%, rounded to the nearest ₹10 and never less than ₹10 more. */
export function stepUpAmount(amount: number): number {
  return Math.max(amount + 10, Math.round((amount * (1 + STEP_UP_PCT / 100)) / 10) * 10);
}

/** "Next step-up 4 Oct 2027: ₹2,000 → ₹2,200", or undefined when step-up is off. */
export function stepUpLine(sip: Pick<Sip, 'stepUpPct' | 'nextStepUpDate' | 'amount'>): string | undefined {
  if (!sip.stepUpPct || !sip.nextStepUpDate) return undefined;
  return `Next step-up ${dateLabel(sip.nextStepUpDate)}: ${formatINR(sip.amount)} → ${formatINR(stepUpAmount(sip.amount))}`;
}

export type SipEditCheck =
  | { ok: true; amount: number; day: number; changed: boolean }
  | { ok: false; error: string };

/** Edit sheet validation: amount against the fund minimum, and a day from 1 to 28. */
export function checkSipEdit(
  input: { amount: string; day: number },
  sip: Pick<Sip, 'amount' | 'dayOfMonth'>,
  fund: Pick<Fund, 'minSip'> | undefined,
): SipEditCheck {
  const a = validateInvestAmount(input.amount, { min: fund?.minSip ?? 100, type: 'sip' });
  if (!a.ok) return a;
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 28) return { ok: false, error: 'Pick a day from 1 to 28.' };
  return { ok: true, amount: a.value, day: input.day, changed: a.value !== sip.amount || input.day !== sip.dayOfMonth };
}

/** Current (illustrative) value of the units held in this SIP's fund: what "stays invested". */
export function unitsValue(state: Pick<State, 'holdings' | 'market'>, sip: Pick<Sip, 'fundId'>): number {
  const h = state.holdings.find((x) => x.id === holdingIdFor(sip.fundId));
  return h ? holdingValue(h, state.market) : 0;
}

/** The holding id for a SIP's fund, if the user still holds units there. */
export function sipHoldingId(state: Pick<State, 'holdings'>, sip: Pick<Sip, 'fundId'>): string | undefined {
  return state.holdings.find((h) => h.id === holdingIdFor(sip.fundId) && h.units > 0)?.id;
}

export type SipFacts = {
  /** Plain-words line about the next instalment (or why there is none). */
  next: string;
  /** Date the next instalment is due, when there is one. */
  nextDate?: ISODate;
  /** Set while the next instalment is being skipped. */
  skippedDate?: ISODate;
};

export function sipFacts(state: State, sip: Sip): SipFacts {
  if (sip.status === 'stopped') return { next: sip.stoppedAt ? `Stopped on ${dateLabel(sip.stoppedAt)}` : 'Stopped' };
  if (sip.status === 'paused') return { next: sip.pausedUntil ? `Restarts after ${dateLabel(sip.pausedUntil)}` : 'Paused' };
  const u = upcomingSips(state).find((x) => x.sip.id === sip.id);
  if (!u) return { next: '—' };
  if (u.skippedDate) {
    return {
      next: `${dateLabel(u.skippedDate, { short: true })} is skipped. Next: ${dateLabel(u.date, { short: true })}`,
      nextDate: u.date,
      skippedDate: u.skippedDate,
    };
  }
  return { next: dateLabel(u.date), nextDate: u.date };
}

/** Name of the goal this SIP is linked to, if any. */
export function linkedGoalName(state: Pick<State, 'goals'>, sip: Pick<Sip, 'goalId'>): string | undefined {
  return state.goals.find((g) => g.id === sip.goalId)?.name;
}

/** "the 4th of every month" */
export function sipDateText(sip: Pick<Sip, 'dayOfMonth'>): string {
  return `the ${ordinal(sip.dayOfMonth)} of every month`;
}

/**
 * Fund the "Found a better fund" comparison starts with: the plan's alternative
 * when it differs, else the first other fund in the same category, else the
 * first other fund.
 */
export function defaultCompareFund(state: Pick<State, 'plan'>, sip: Pick<Sip, 'fundId'>): FundId {
  const alt = state.plan?.alternativeFundId;
  if (alt && alt !== sip.fundId) return alt;
  const current = getFund(sip.fundId);
  const same = FUNDS.find((f) => f.id !== sip.fundId && f.category === current?.category);
  return (same ?? FUNDS.find((f) => f.id !== sip.fundId) ?? FUNDS[0]).id;
}

export function pauseToast(months: number, resumeOn: ISODate): string {
  return `Paused for ${months} month${months > 1 ? 's' : ''}. It restarts after ${dateLabel(resumeOn, { short: true })}.`;
}
