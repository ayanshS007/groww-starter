// Payday Split (README 8.3 as changed by PLAN C14 and item 33). P1 logic.
import { roundTo50 } from './planner';

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
