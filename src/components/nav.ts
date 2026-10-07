// Navigation items and screen titles for the shell (README 4.1). Stage 3d turns
// on the Dashboard tab: 5 mobile tabs and 6 sidebar items.
import type { ScreenId } from '../lib/routes';
import type { IconName } from './Icon';

export type NavId = 'home' | 'dashboard' | 'explore' | 'portfolio' | 'learn' | 'you';

export type NavItem = { id: NavId; label: string; to: string; icon: IconName; mobile: boolean };

/** Desktop sidebar order: Home · Dashboard · Explore · Portfolio · Learn · You. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', to: '/home', icon: 'home', mobile: true },
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'dashboard', mobile: true },
  { id: 'explore', label: 'Explore', to: '/explore', icon: 'explore', mobile: true },
  { id: 'portfolio', label: 'Portfolio', to: '/portfolio', icon: 'portfolio', mobile: true },
  { id: 'learn', label: 'Learn', to: '/learn', icon: 'book', mobile: false },
  { id: 'you', label: 'You', to: '/you', icon: 'user', mobile: true },
];

/** Mobile tab order: Home · Explore · Dashboard · Portfolio · You (Learn is the top-bar book icon). */
const MOBILE_ORDER: NavId[] = ['home', 'explore', 'dashboard', 'portfolio', 'you'];

export const MOBILE_NAV: NavItem[] = MOBILE_ORDER.map((id) => NAV_ITEMS.find((n) => n.id === id)!).filter((n) => n.mobile);

const ACTIVE: Partial<Record<ScreenId, NavId>> = {
  home: 'home',
  plan: 'home',
  explore: 'explore',
  funds: 'explore',
  fund: 'explore',
  portfolio: 'portfolio',
  success: 'portfolio',
  holding: 'portfolio',
  sip: 'portfolio',
  learn: 'learn',
  glossary: 'learn',
  you: 'you',
  review: 'you',
  dashboard: 'dashboard',
  payday: 'home',
  goals: 'portfolio',
  goal: 'portfolio',
  stocks: 'explore',
  stock: 'explore',
  tipCheck: 'learn',
  trading: 'you',
};

export function activeNav(screen: ScreenId): NavId | undefined {
  return ACTIVE[screen];
}

export const SCREEN_TITLE: Record<ScreenId, string> = {
  landing: 'Welcome',
  signup: 'Sign up',
  checkin: 'Money check-in',
  plan: 'Your starter plan',
  home: 'Home',
  kyc: 'Verification',
  explore: 'Explore',
  funds: 'Mutual funds',
  fund: 'Fund',
  investPlan: 'Start your plan',
  invest: 'Invest',
  success: 'Done',
  portfolio: 'Portfolio',
  holding: 'Holding',
  sip: 'SIP',
  stopCoach: 'Stop SIP',
  learn: 'Learn',
  glossary: 'Glossary',
  you: 'You',
  review: 'Reviewer tools',
  dashboard: 'Dashboard',
  notifications: 'Notifications',
  payday: 'Payday Split',
  goals: 'Goals',
  goal: 'Goal',
  stocks: 'Stocks',
  stock: 'Stock',
  stockBuy: 'Buy shares',
  tipCheck: 'Tip Check',
  trading: 'Stocks: budget and readiness',
};
