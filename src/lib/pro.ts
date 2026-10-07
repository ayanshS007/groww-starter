// Earned Pro (Stage 6b, PLAN C23–C26). Pro is unlocked by passing the quick check
// (4 of 5), never bought. Pure: components ask this module what to show.
import type { State } from '../state/types';
import { isSteady, marketMood } from './mood';
import type { ScreenId } from './routes';

export type ProFeatureId = 'ranges' | 'index' | 'watchlist' | 'compare' | 'metrics' | 'analytics' | 'orders';

/** The list in the "What Pro adds" sheet. Plain words, no prices. */
export const PRO_FEATURES: { id: ProFeatureId; label: string; text: string }[] = [
  { id: 'ranges', label: 'More chart ranges', text: '1W, 1M, 1Y and All on fund and company charts.' },
  { id: 'index', label: 'Sample index strip', text: 'A strip of sample indices at the top of Explore.' },
  { id: 'watchlist', label: 'Watchlist table', text: 'Your saved companies with a 52-week range.' },
  { id: 'compare', label: 'Compare two funds', text: 'Two funds side by side, in plain numbers.' },
  { id: 'metrics', label: 'Extra fund numbers', text: 'Expense ratio and 1, 3 and 5-year illustrative returns.' },
  { id: 'analytics', label: 'Portfolio analytics', text: 'Your category mix and an illustrative yearly return on the Dashboard.' },
  { id: 'orders', label: 'More order types', text: 'Stop-loss, GTT and after-market orders, explained.' },
];

export const PRO_SHEET_TITLE = 'What Pro adds';
export const PRO_CTA = 'Unlock Pro: take the 5-question quick check';
export const QUICK_CHECK_ROUTE = '/you/trading?focus=check';

/** Screens where no Pro banner, locked chip or sheet may appear (owner rule, 6b item 6). */
export const NO_PROMO_SCREENS: ScreenId[] = ['stopCoach', 'investPlan', 'invest', 'success', 'stockBuy', 'kyc', 'checkin'];

export function isProUnlocked(state: Pick<State, 'prefs'>): boolean {
  return state.prefs.proUnlocked;
}

/** "Pro view" is on: unlocked, and switched on in You. */
export function proViewOn(state: Pick<State, 'prefs'>): boolean {
  return state.prefs.proUnlocked && state.prefs.view === 'pro';
}

/** Locked Pro UI (banner, locked chips, the sheet) may show here: not in Steady mode, not in a flow. */
export function promoAllowed(state: State, screen: ScreenId | undefined): boolean {
  if (isSteady(marketMood(state))) return false;
  return !screen || !NO_PROMO_SCREENS.includes(screen);
}

export type ProMode = 'live' | 'locked' | 'hidden';

/**
 * How a Pro feature appears: live (unlocked and Pro view on), locked (still
 * visible, dimmed, opens the sheet) or hidden (unlocked but Pro view off, or
 * locked where promotion is not allowed).
 */
export function proMode(state: State, screen: ScreenId | undefined): ProMode {
  if (state.prefs.proUnlocked) return state.prefs.view === 'pro' ? 'live' : 'hidden';
  return promoAllowed(state, screen) ? 'locked' : 'hidden';
}

/** The one "Upgrade to Pro" banner: Explore's hub, while locked, where promotion is allowed. */
export function showUpgradeBanner(state: State, screen: ScreenId | undefined): boolean {
  return screen === 'explore' && !state.prefs.proUnlocked && promoAllowed(state, screen);
}
