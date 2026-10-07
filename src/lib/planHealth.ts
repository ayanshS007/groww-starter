// Plan health (README 8.11). Four checks; text + icon, never colour alone, never "fail".
import { getFund } from '../data/funds';
import type { State } from '../state/types';
import { addDays } from './dates';
import { dateLabel, formatINR, formatPct } from './format';
import { cushionValue, heldFunds, HORIZON_TEXT, horizonRank, portfolioValue, stockValue } from './market';
import { cushionTarget } from './planner';

export type HealthStatus = 'good' | 'watch' | 'todo';
export type HealthCheckId = 'cushion' | 'horizon' | 'stocks' | 'sips';

export type HealthCheck = {
  id: HealthCheckId;
  label: string;
  status: HealthStatus;
  detail: string;
  /** Where the fix lives. */
  fixRoute: string;
  /** Link text for the fix. */
  fixLabel: string;
};

export const STATUS_TEXT: Record<HealthStatus, string> = { good: 'On track', watch: 'Keep an eye', todo: 'To do' };

type HealthState = Pick<State, 'checkin' | 'holdings' | 'market' | 'sips' | 'prefs'>;

export function cushionCheck(state: HealthState): HealthCheck {
  const base = { id: 'cushion' as const, label: 'Cushion' };
  if (!state.checkin) {
    return { ...base, status: 'todo', detail: 'Take the check-in to set a cushion target.', fixRoute: '/checkin/1', fixLabel: 'Take the check-in' };
  }
  const target = cushionTarget(state.checkin.incomeBand);
  const value = cushionValue(state);
  const pct = target > 0 ? (value / target) * 100 : 0;
  const status: HealthStatus = pct >= 100 ? 'good' : pct >= 25 ? 'watch' : 'todo';
  return {
    ...base,
    status,
    detail: `${formatINR(value)} of ${formatINR(target)} (${formatPct(Math.min(pct, 100), 0)}) set aside.`,
    fixRoute: '/payday',
    fixLabel: status === 'good' ? 'See cushion' : 'Top up cushion',
  };
}

export function horizonCheck(state: HealthState): HealthCheck {
  const base = { id: 'horizon' as const, label: 'Time frame match' };
  if (!state.checkin) {
    return { ...base, status: 'todo', detail: 'Take the check-in to compare time frames.', fixRoute: '/checkin/1', fixLabel: 'Take the check-in' };
  }
  const user = state.checkin.horizon;
  const grow = heldFunds(state.holdings).filter((f) => f.category !== 'Liquid');
  const mismatch = grow.find((f) => horizonRank(f.horizon) > horizonRank(user));
  if (mismatch) {
    return {
      ...base,
      status: 'watch',
      detail: `${mismatch.name} is meant for ${mismatch.horizonLabel}; your time frame is ${HORIZON_TEXT[user]}.`,
      fixRoute: '/plan',
      fixLabel: 'Review my plan',
    };
  }
  return {
    ...base,
    status: 'good',
    detail: `Your funds suit your time frame of ${HORIZON_TEXT[user]}.`,
    fixRoute: '/plan',
    fixLabel: 'See my plan',
  };
}

export function stockCheck(state: HealthState): HealthCheck {
  const total = portfolioValue(state);
  const pct = total > 0 ? (stockValue(state) / total) * 100 : 0;
  const limit = state.prefs.stockBudgetPct;
  return {
    id: 'stocks',
    label: 'Stock budget',
    status: pct <= limit + 1e-9 ? 'good' : 'watch',
    detail: `Stocks are ${formatPct(pct, 0)} of your portfolio. Your limit is ${formatPct(limit, 0)}.`,
    fixRoute: '/you/trading',
    fixLabel: 'Stock budget',
  };
}

export function sipCheck(state: HealthState): HealthCheck {
  const base = { id: 'sips' as const, label: 'SIPs running' };
  const active = state.sips.filter((s) => s.status === 'active');
  const paused = state.sips.filter((s) => s.status === 'paused');
  if (active.length + paused.length === 0) {
    return { ...base, status: 'todo', detail: 'No SIPs running yet.', fixRoute: '/home', fixLabel: 'Start a SIP' };
  }
  if (paused.length > 0) {
    const first = paused.map((s) => s.pausedUntil).filter((d): d is string => !!d).sort()[0];
    const when = first ? `, resumes ${dateLabel(addDays(first, 1), { short: true })}` : '';
    const name = getFund(paused[0].fundId)?.name ?? 'A SIP';
    return {
      ...base,
      status: 'watch',
      detail: `${active.length} of ${active.length + paused.length} running. ${name} is paused${when}.`,
      fixRoute: `/portfolio/sip/${paused[0].id}`,
      fixLabel: 'Resume or manage',
    };
  }
  return { ...base, status: 'good', detail: `All ${active.length} running.`, fixRoute: '/portfolio', fixLabel: 'See my SIPs' };
}

export function planHealth(state: HealthState): HealthCheck[] {
  return [cushionCheck(state), horizonCheck(state), stockCheck(state), sipCheck(state)];
}
