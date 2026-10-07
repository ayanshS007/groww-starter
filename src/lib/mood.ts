// Market mood and the simulated clock (Stage 6a). One function maps the current
// scenario and the user's own numbers to a mood; App writes the result to
// <html data-mood data-tod> and tokens.ts turns that into CSS variables.
// Pure: no React, every input is a parameter.
import type { ISODate, Scenario, State } from '../state/types';
import type { Mood, TimeOfDay } from '../styles/tokens';
import { addDays, dayOfMonth, parseISO } from './dates';
import { BIG_DIP_PCT } from './insight';
import { overallChange, seriesWithFlow, simToday, weekChange, type Change } from './market';
import { hasRunningPlanSip } from './planStatus';

export type { Mood, TimeOfDay };

export const MOOD_LABEL: Record<Mood, string> = {
  up: 'Up week',
  flat: 'Flat',
  small_dip: 'Small dip',
  big_dip: 'Big dip',
};

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

/** A week at or above this (%) reads as up. */
export const UP_WEEK_PCT = 1;
/** A week at or below this (%) reads as a small dip. */
export const SMALL_DIP_WEEK_PCT = -0.5;
/** A single week at or below this (%) is a big dip on its own. */
export const BIG_DIP_WEEK_PCT = -5;

/** Mood when the user has no money of their own in the market yet. */
export function moodFromScenario(s: Scenario): Mood {
  if (s === 'up') return 'up';
  if (s === 'dip_small') return 'small_dip';
  if (s === 'dip_sharp') return 'big_dip';
  return 'flat'; // normal (+0.6%) and flat (+0.1%)
}

/**
 * Mood from the user's own money. The overall test matches the insight's
 * big-dip branch (≤ −10% on what was invested), so Steady mode and the
 * "bigger dip" insight appear together.
 */
export function moodFromNumbers(week: Change, overall: Change): Mood {
  if (overall.pct <= BIG_DIP_PCT || week.pct <= BIG_DIP_WEEK_PCT) return 'big_dip';
  if (week.pct <= SMALL_DIP_WEEK_PCT) return 'small_dip';
  if (week.pct >= UP_WEEK_PCT) return 'up';
  return 'flat';
}

/** The scenario of the latest simulated week, or the chosen one before any week has run. */
export function latestScenario(market: State['market']): Scenario {
  return market.history[market.history.length - 1] ?? market.scenario;
}

/** True once the user holds something that has lived through at least one simulated week. */
export function hasOwnWeek(state: Pick<State, 'holdings' | 'activity' | 'market'>): boolean {
  if (!state.holdings.some((h) => h.units > 0)) return false;
  const s = seriesWithFlow(state);
  return s.length >= 2 && s[s.length - 2].value > 0;
}

/** The mood the simulation gives, ignoring any reviewer preview. */
export function autoMood(state: State): Mood {
  if (!hasOwnWeek(state)) return moodFromScenario(latestScenario(state.market));
  return moodFromNumbers(weekChange(state), overallChange(state));
}

/** The app-wide market mood: the reviewer's preview if set, else the simulation. */
export function marketMood(state: State): Mood {
  const p = state.preview?.mood;
  return p && p !== 'auto' ? p : autoMood(state);
}

/** Steady mode: a big dip. The insight leads, blobs slow and nothing promotional shows. */
export function isSteady(mood: Mood): boolean {
  return mood === 'big_dip';
}

// ---------- simulated clock ----------
/** 5–11 morning, 12–16 afternoon, 17–20 evening, otherwise night. */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function isWeekend(iso: ISODate): boolean {
  const d = parseISO(iso).getUTCDay();
  return d === 0 || d === 6;
}

export type SimClock = { date: ISODate; hour: number; timeOfDay: TimeOfDay; weekend: boolean };

/**
 * The simulated clock: the simulated date (week 0 + 7 days a week) at the
 * viewer's real hour, since weeks are the only thing the simulation advances.
 * Reviewer previews can pin the time of day and the weekday/weekend.
 */
export function simClock(state: Pick<State, 'market' | 'preview'>, now: Date): SimClock {
  const date = simToday(state.market);
  const hour = now.getHours();
  const p = state.preview;
  return {
    date,
    hour,
    timeOfDay: p && p.timeOfDay !== 'auto' ? p.timeOfDay : timeOfDay(hour),
    weekend: p && p.day !== 'auto' ? p.day === 'weekend' : isWeekend(date),
  };
}

export const MARKETS_RESTING = 'Markets are resting. So can you.';

// ---------- payday ----------
/**
 * Pay was credited in the current simulated week (the 7 days ending today):
 * a reviewer "Simulate pay credit" this week, or a salary payday in that window.
 */
export function paidThisWeek(state: Pick<State, 'market' | 'checkin' | 'user' | 'payCreditWeek'>): boolean {
  if (state.payCreditWeek === state.market.week) return true;
  if (state.checkin?.incomeType !== 'salary') return false;
  const payday = state.user.payday ?? 1;
  const today = simToday(state.market);
  for (let i = 0; i < 7; i++) if (dayOfMonth(addDays(today, -i)) === payday) return true;
  return false;
}

/** Gold accent on Home and its "Got paid? Split it" card: only when that card shows, and never in Steady mode. */
export function paydayGlow(state: State, mood: Mood = marketMood(state)): boolean {
  return paidThisWeek(state) && hasRunningPlanSip(state) && !isSteady(mood);
}

export type Ambience = { mood: Mood; steady: boolean; timeOfDay: TimeOfDay; weekend: boolean; payday: boolean };

/** Everything the look of the app reacts to, in one place. */
export function ambience(state: State, now: Date): Ambience {
  const mood = marketMood(state);
  const clock = simClock(state, now);
  return { mood, steady: isSteady(mood), timeOfDay: clock.timeOfDay, weekend: clock.weekend, payday: paydayGlow(state, mood) };
}
