// Weekly dip insight (README 8.5 as changed by PLAN C1 and items 14–15).
import type { Holding, Horizon, State } from '../state/types';
import { formatINR, formatPct, formatSigned } from './format';
import { HORIZON_TEXT, horizonRank, heldFunds, overallChange, weekChange, type Change } from './market';

export type InsightBranch = 'big_dip' | 'calm' | 'short_term' | 'steadier';
export type InsightTone = 'calm' | 'neutral' | 'caution'; // never red

export type Insight = {
  branch: InsightBranch;
  headline: string;
  body: string;
  actionNeeded: boolean;
  /** Optional link; "Review my plan" is offered, never pushed. */
  action?: 'review_plan';
  tone: InsightTone;
};

export type InsightInput = {
  weekChange: Change;
  overallChange: Change;
  horizon: Horizon;
  holdings: Holding[];
};

export const BIG_DIP_PCT = -10;

/** Words that must never appear, whatever the market does. */
export const ALARM_WORDS = ['crash', 'alert', 'sell now', 'panic', 'plunge', 'danger', 'urgent', 'warning', 'collapse', 'tank'];

function headline(week: Change, overall: Change): string {
  return `This week: ${formatSigned(week.amount)} (${formatSigned(week.pct, 'pct')}). Overall: ${formatSigned(
    overall.amount,
  )} (${formatSigned(overall.pct, 'pct')}) on what you put in.`;
}

export function buildInsight({ weekChange: week, overallChange: overall, horizon, holdings }: InsightInput): Insight {
  const head = headline(week, overall);
  const h = HORIZON_TEXT[horizon];
  const longTerm = horizonRank(horizon) >= horizonRank('3to5');

  // 1. Big dip: judged on the overall change, not one week (PLAN C1).
  if (overall.pct <= BIG_DIP_PCT && longTerm) {
    // A gain this week while still well below what was put in: lead with the gain,
    // say plainly where the total stands, and keep the review optional.
    if (week.amount > 0) {
      return {
        branch: 'big_dip',
        headline: `Up ${formatINR(week.amount)} (${formatSigned(week.pct, 'pct')}) this week. Overall: ${formatSigned(overall.amount)} (${formatSigned(
          overall.pct,
          'pct',
        )}) on what you put in.`,
        body: `Your portfolio is still ${formatINR(Math.abs(overall.amount))} (${formatPct(Math.abs(overall.pct))}) below what you put in. That's normal after a bigger fall. Your horizon is ${h}. Nothing needs doing. Reviewing your plan is optional.`,
        actionNeeded: false,
        action: 'review_plan',
        tone: 'neutral',
      };
    }
    return {
      branch: 'big_dip',
      headline: head,
      body: `That's a bigger fall than usual. Past falls like this have recovered, but there's no promise this one will. Selling now would lock in the fall. Your horizon is ${h}. Reviewing your plan is optional.`,
      actionNeeded: false,
      action: 'review_plan',
      tone: 'caution',
    };
  }

  // 2. Up or flat.
  if (week.amount >= 0) {
    return {
      branch: 'calm',
      headline: head,
      body: 'One week is not a trend. Nothing to do.',
      actionNeeded: false,
      tone: 'calm',
    };
  }

  // 3. Down, long horizon.
  if (longTerm) {
    return {
      branch: 'short_term',
      headline: head,
      body: `A short-term move. Your horizon is ${h}, so this alone doesn't mean you need to act.`,
      actionNeeded: false,
      tone: 'neutral',
    };
  }

  // 4. Down, horizon under 3 years: explain the steadier fund, flag a mismatch.
  const funds = heldFunds(holdings);
  const grow = funds.filter((f) => f.category !== 'Liquid');
  const mismatch = grow.find((f) => horizonRank(f.horizon) > horizonRank(horizon));
  if (mismatch) {
    return {
      branch: 'steadier',
      headline: head,
      body: `${mismatch.name} is meant for ${mismatch.horizonLabel}, longer than your ${h}. Funds like it can stay down for a while. You may want to review your plan.`,
      actionNeeded: true,
      action: 'review_plan',
      tone: 'caution',
    };
  }
  const steady = grow[0];
  const body = steady
    ? `Your grow money is in ${steady.name}, a steadier type of fund, because you may need it in ${h}. It moves less than shares, so dips stay smaller.`
    : `Your money is in a liquid fund, built for money you may need soon. Its moves are tiny, so a week like this stays small.`;
  return { branch: 'steadier', headline: head, body, actionNeeded: false, tone: 'neutral' };
}

/**
 * Horizon used by the insight: the check-in answer, or in browse mode the
 * longest horizon among held funds (5+ yrs if only stocks are held).
 */
export function insightHorizon(state: Pick<State, 'checkin' | 'holdings'>): Horizon {
  if (state.checkin) return state.checkin.horizon;
  const funds = heldFunds(state.holdings);
  if (funds.length === 0) return '5plus';
  return funds.reduce((best, f) => (horizonRank(f.horizon) > horizonRank(best) ? f.horizon : best), funds[0].horizon);
}

/** Insight for the current state, or null when nothing is held. */
export function insightFromState(state: State): Insight | null {
  if (!state.holdings.some((h) => h.units > 0)) return null;
  return buildInsight({
    weekChange: weekChange(state),
    overallChange: overallChange(state),
    horizon: insightHorizon(state),
    holdings: state.holdings,
  });
}
