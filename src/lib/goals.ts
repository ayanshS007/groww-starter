// Goal pots (README 8.8, PLAN item 34). P1 logic. Never projects returns.
import { getFund } from '../data/funds';
import type { FundId, Goal, ISODate, State } from '../state/types';
import { addYears, monthsBetweenCeil } from './dates';
import { holdingValue } from './market';

export const GOAL_SUGGESTIONS = ['Emergency cushion', 'Laptop', 'Trip', 'Course fees'] as const;
export const WITHOUT_RETURNS = 'Without counting returns';
export const GOAL_THRESHOLDS = [25, 50, 75, 100] as const;

/** Whole months left; 0 when the date is today or past. */
export function monthsLeft(today: ISODate, byDate: ISODate): number {
  return byDate <= today ? 0 : Math.max(1, monthsBetweenCeil(today, byDate));
}

function ceilTo50(n: number): number {
  return Math.ceil(n / 50) * 50;
}

/** (target − current) ÷ months left, rounded up to ₹50. Null when the date has passed. */
export function monthlyNeeded(goal: Pick<Goal, 'target' | 'byDate'>, currentValue: number, today: ISODate): number | null {
  const months = monthsLeft(today, goal.byDate);
  if (months === 0) return null;
  const gap = goal.target - currentValue;
  return gap <= 0 ? 0 : ceilTo50(gap / months);
}

export function goalProgress(target: number, current: number): { pct: number; reached: number[] } {
  const pct = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
  return { pct, reached: GOAL_THRESHOLDS.filter((t) => pct >= t) };
}

/** Value of holdings in the linked SIPs' funds (PLAN item 34). */
export function goalValue(state: Pick<State, 'sips' | 'holdings' | 'market'>, goal: Pick<Goal, 'sipIds'>): number {
  const funds = new Set(state.sips.filter((s) => goal.sipIds.includes(s.id)).map((s) => s.fundId));
  return state.holdings
    .filter((h) => funds.has(h.assetId as FundId))
    .reduce((sum, h) => sum + holdingValue(h, state.market), 0);
}

export type GoalWarning =
  | { kind: 'past_date'; text: string }
  | { kind: 'short_equity'; text: string; action: 'Switch to a steadier fund'; fundId: FundId };

export function goalWarnings(goal: Pick<Goal, 'byDate'>, today: ISODate, linkedFundIds: FundId[]): GoalWarning[] {
  const out: GoalWarning[] = [];
  if (goal.byDate <= today) {
    out.push({ kind: 'past_date', text: 'This goal’s date has passed. Pick a new date to keep tracking it.' });
    return out;
  }
  if (goal.byDate < addYears(today, 1)) {
    const equity = linkedFundIds.map((id) => getFund(id)).find((f) => f && f.risk >= 4);
    if (equity) {
      out.push({
        kind: 'short_equity',
        text: `This goal is less than a year away, but ${equity.name} can fall a lot in a year.`,
        action: 'Switch to a steadier fund',
        fundId: equity.id,
      });
    }
  }
  return out;
}

/** How much more a month the linked SIPs would need; 0 when on track. */
export function goalShortfall(needed: number | null, linkedSipTotal: number): number {
  return needed === null ? 0 : Math.max(0, needed - linkedSipTotal);
}
