// Goal pots (README 8.8, PLAN item 34). P1 logic. Never projects returns.
import { getFund } from '../data/funds';
import type { FundId, Goal, ISODate, Sip, State } from '../state/types';
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

// ---------- create and edit ----------
export type GoalInput = { name: string; target: string | number; byDate: string };
export type GoalErrors = Partial<Record<'name' | 'target' | 'byDate', string>>;
export const MAX_GOAL = 10_000_000;

/** Validates the create/edit form. A date today or earlier asks for a later one (README 8.8). */
export function validateGoalInput(
  input: GoalInput,
  today: ISODate,
): { ok: true; value: { name: string; target: number; byDate: ISODate } } | { ok: false; errors: GoalErrors } {
  const errors: GoalErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Give your goal a name.';
  else if (name.length > 40) errors.name = 'Keep the name under 40 characters.';
  const raw = typeof input.target === 'number' ? input.target : Number(String(input.target).replace(/[,\s₹]/g, ''));
  if (String(input.target).trim() === '' || !Number.isFinite(raw)) errors.target = 'Enter how much you need.';
  else if (!Number.isInteger(raw)) errors.target = 'Use whole rupees.';
  else if (raw < 500) errors.target = 'Enter at least ₹500.';
  else if (raw > MAX_GOAL) errors.target = 'Enter up to ₹1,00,00,000.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.byDate)) errors.byDate = 'Pick the date you need it by.';
  else if (input.byDate <= today) errors.byDate = 'Pick a date after today.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, target: raw, byDate: input.byDate } };
}

/** Prefill for a suggestion chip. Only the cushion has a known target: 3 × income midpoint. */
export function suggestionPrefill(
  name: (typeof GOAL_SUGGESTIONS)[number],
  cushionTarget: number | undefined,
  today: ISODate,
): { name: string; target?: number; byDate?: ISODate; isCushion: boolean } {
  if (name === 'Emergency cushion') {
    return { name, target: cushionTarget || undefined, byDate: addYears(today, 1), isCushion: true };
  }
  return { name, isCushion: false };
}

// ---------- detail ----------
export type GoalSummary = {
  value: number;
  pct: number;
  needed: number | null;
  linkedSips: Sip[];
  linkedTotal: number;
  shortfall: number;
  warnings: GoalWarning[];
  monthsLeft: number;
};

/** Everything the goal screens show. Only active SIPs count toward the monthly total. */
export function goalSummary(state: Pick<State, 'sips' | 'holdings' | 'market'>, goal: Goal, today: ISODate): GoalSummary {
  const value = goalValue(state, goal);
  const linkedSips = state.sips.filter((s) => goal.sipIds.includes(s.id));
  const linkedTotal = linkedSips.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
  const needed = monthlyNeeded(goal, value, today);
  return {
    value,
    pct: goalProgress(goal.target, value).pct,
    needed,
    linkedSips,
    linkedTotal,
    shortfall: goalShortfall(needed, linkedTotal),
    warnings: goalWarnings(goal, today, linkedSips.filter((s) => s.status !== 'stopped').map((s) => s.fundId)),
    monthsLeft: monthsLeft(today, goal.byDate),
  };
}

/** SIPs that can be linked: not stopped and not already linked to this goal. */
export function linkableSips(state: Pick<State, 'sips'>, goal: Pick<Goal, 'id'>): Sip[] {
  return state.sips.filter((s) => s.status !== 'stopped' && s.goalId !== goal.id);
}

/** "Switch to a steadier fund" opens the funds suited to money needed within a year. */
export const STEADIER_FUNDS_ROUTE = '/explore/funds?collection=need_this_year';

/**
 * Goal ring colour (Stage 6a): 0 at the start (mint), 1 at the target (brand
 * green). The ring warms in a straight line and gets a calm glow at 100%.
 */
export function ringWarmth(pct: number): number {
  return Math.max(0, Math.min(1, pct / 100));
}

export function ringGlows(pct: number): boolean {
  return pct >= 100;
}
