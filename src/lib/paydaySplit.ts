// Payday Split (README 8.3 as changed by PLAN C14 and item 33). P1 logic.
import type { State } from '../state/types';
import { activeSipTotal } from './activity';
import { cushionValue } from './market';
import { cushionTarget, INCOME_MIDPOINT, roundTo50 } from './planner';

export type PaydayInput = {
  pay: number;
  activeSipTotal: number;
  cushionValue: number;
  cushionTarget: number;
};

export type PaydaySplit = {
  toSips: number;
  topUp: number;
  toSpend: number;
  cushionGap: number;
  /** Shown when SIPs and top-up add up to more than the pay. */
  note?: string;
};

export const PAYDAY_TOP_UP_PCT = 10;
export const PAYDAY_COPY = 'A suggestion, not a rule. Change any number.';

/**
 * Top-up = min(10% of pay, gap to target), rounded to ₹50, and never more than
 * what is left after SIPs. "Yours to spend" never goes below ₹0.
 */
export function splitPay({ pay, activeSipTotal, cushionValue, cushionTarget }: PaydayInput): PaydaySplit {
  const safePay = Math.max(0, pay);
  const cushionGap = Math.max(0, cushionTarget - cushionValue);
  const afterSips = safePay - activeSipTotal;
  let topUp = 0;
  if (cushionGap > 0 && afterSips > 0) {
    topUp = roundTo50(Math.min((safePay * PAYDAY_TOP_UP_PCT) / 100, cushionGap));
    topUp = Math.min(topUp, Math.floor(afterSips / 50) * 50);
  }
  const rest = safePay - activeSipTotal - topUp;
  const out: PaydaySplit = { toSips: activeSipTotal, topUp, toSpend: Math.max(0, rest), cushionGap };
  if (rest < 0) out.note = 'Your SIPs add up to more than this pay. You can skip a month, free.';
  return out;
}

/** PLAN item 33: "Simulate pay credit" defaults to ₹28,000 for Riya, else the income-band midpoint. */
export const RIYA_PAY = 28000;

export function defaultPay(state: Pick<State, 'checkin' | 'user'>): number {
  if (state.user.persona === 'riya') return RIYA_PAY;
  return state.checkin ? INCOME_MIDPOINT[state.checkin.incomeBand] : RIYA_PAY;
}

/**
 * The cushion target Payday Split starts from: an Emergency cushion goal's
 * target when there is one, else 3 × the income-band midpoint (README 8.3).
 */
export function paydayCushionTarget(state: Pick<State, 'checkin' | 'goals'>): number {
  const goal = state.goals.find((g) => g.isCushion);
  if (goal) return goal.target;
  return state.checkin ? cushionTarget(state.checkin.incomeBand) : 0;
}

/** Everything Payday Split needs from state, for a given pay and target. */
export function paydayFromState(
  state: Pick<State, 'sips' | 'holdings' | 'market'> & Partial<Pick<State, 'goals' | 'checkin'>>,
  pay: number,
  target: number,
): PaydaySplit & { cushionValue: number; cushionTarget: number; saidHasCushion: boolean } {
  const value = cushionValue(state);
  // QA #16: someone who said they have a cushion gets no top-up suggestion.
  const saidHasCushion = state.checkin?.cushion === 'yes';
  const split = splitPay({ pay, activeSipTotal: activeSipTotal(state.sips), cushionValue: value, cushionTarget: saidHasCushion ? 0 : target });
  return { ...split, cushionValue: value, cushionTarget: target, saidHasCushion };
}

/** Pay amounts accepted on the Payday screen and in Reviewer tools. */
export function validatePay(input: string | number): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof input === 'number' ? input : Number(String(input).replace(/[,\s₹]/g, ''));
  if (String(input).trim() === '' || !Number.isFinite(n)) return { ok: false, error: 'Enter the amount you received.' };
  if (!Number.isInteger(n)) return { ok: false, error: 'Use whole rupees.' };
  if (n < 100) return { ok: false, error: 'Enter at least ₹100.' };
  if (n > 1_000_000) return { ok: false, error: 'Enter up to ₹10,00,000.' };
  return { ok: true, value: n };
}
