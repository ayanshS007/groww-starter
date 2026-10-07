// Navigation items and screen titles for the shell (README 4.1, PLAN item 45:
// Dashboard and bell stay hidden until Stage 3d).
import type { ScreenId } from '../lib/routes';
import type { IconName } from './Icon';

export type NavId = 'home' | 'explore' | 'portfolio' | 'learn' | 'you';

export type NavItem = { id: NavId; label: string; to: string; icon: IconName; mobile: boolean };

/** Desktop order; mobile shows the items with mobile: true in the same order. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', to: '/home', icon: 'home', mobile: true },
  { id: 'explore', label: 'Explore', to: '/explore', icon: 'explore', mobile: true },
  { id: 'portfolio', label: 'Portfolio', to: '/portfolio', icon: 'portfolio', mobile: true },
  { id: 'learn', label: 'Learn', to: '/learn', icon: 'book', mobile: false },
  { id: 'you', label: 'You', to: '/you', icon: 'user', mobile: true },
];

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
};
