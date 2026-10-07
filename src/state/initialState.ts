import type { ISODate, NotifKind, State } from './types';
import { NOTIF_KINDS } from './types';
import { DEFAULT_STOCK_BUDGET_PCT } from '../lib/stockBudget';

export const STATE_VERSION = 1 as const;

export function defaultNotifPrefs(): Record<NotifKind, boolean> {
  return Object.fromEntries(NOTIF_KINDS.map((k) => [k, true])) as Record<NotifKind, boolean>;
}

/** PLAN section 4 "Initial state". `today` becomes simulated week 0. */
export function createInitialState(today: ISODate): State {
  return {
    version: STATE_VERSION,
    user: { signedUp: false, kyc: 'none', bankLinked: false, autopay: false },
    holdings: [],
    sips: [],
    orders: [],
    goals: [],
    watchlist: [],
    prefs: { view: 'starter', proUnlocked: false, stockBudgetPct: DEFAULT_STOCK_BUDGET_PCT, readinessPassed: false, notif: defaultNotifPrefs() },
    market: { scenario: 'normal', week: 0, history: [], startDate: today },
    activity: [],
    readNotifications: [],
    seenMilestones: [],
  };
}
