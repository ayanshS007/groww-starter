// Check-in step logic (README 8.1, 9 item 3). Pure: the screen holds the copy.
import type { CheckinAnswers } from '../state/types';
import { validateMonthly } from './planner';

export const CHECKIN_STEPS = 6;

export const MONTHLY_PRESETS = [100, 500, 1000, 2500] as const;

/** True when the step's question has a usable answer (Continue is enabled). */
export function isStepAnswered(step: number, d: Partial<CheckinAnswers> | undefined): boolean {
  if (!d) return false;
  switch (step) {
    case 1:
      return !!d.incomeType && !!d.incomeBand;
    case 2:
      return !!d.cushion;
    case 3:
      return !!d.purpose;
    case 4:
      return !!d.horizon;
    case 5:
      return !!d.dipReaction;
    case 6:
      return d.monthlyChoice !== undefined && typeof d.monthly === 'number' && validateMonthly(d.monthly).ok;
    default:
      return false;
  }
}

/** First step without an answer, or 6 when everything is answered. */
export function firstUnansweredStep(d: Partial<CheckinAnswers> | undefined): number {
  for (let s = 1; s <= CHECKIN_STEPS; s++) if (!isStepAnswered(s, d)) return s;
  return CHECKIN_STEPS;
}

/** True when some, but not all, steps are answered. */
export function isCheckinStarted(d: Partial<CheckinAnswers> | undefined): boolean {
  return !!d && Object.keys(d).length > 0;
}
