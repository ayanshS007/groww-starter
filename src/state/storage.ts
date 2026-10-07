// Safe localStorage access (PLAN section 4): one key, every access in
// try/catch, and the app keeps working in memory if storage throws.
import { isISODate } from '../lib/dates';
import { createInitialState, STATE_VERSION } from './initialState';
import type { ISODate, State } from './types';

export const STORAGE_KEY = 'groww-starter:v1';

/** Minimal Storage surface so tests can pass a fake or throwing store. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** window.localStorage, or null when it is missing or access itself throws. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** True only when a write and read-back both succeed. */
export function probeStorage(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    const k = STORAGE_KEY + ':probe';
    storage.setItem(k, '1');
    const ok = storage.getItem(k) === '1';
    storage.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Accepts saved state only if it has the current version and the basic
 * shape; missing optional fields are filled from a fresh initial state.
 */
export function parseSavedState(raw: string | null, today: ISODate): State | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.version !== STATE_VERSION) return null;
  const market = data.market;
  if (!isObject(market) || !isISODate(market.startDate) || typeof market.week !== 'number' || !Array.isArray(market.history)) {
    return null;
  }
  for (const key of ['holdings', 'sips', 'orders', 'goals', 'watchlist', 'activity', 'readNotifications', 'seenMilestones']) {
    if (key in data && !Array.isArray(data[key])) return null;
  }
  if (!isObject(data.user)) return null;
  const fresh = createInitialState(today);
  const prefs = isObject(data.prefs) ? data.prefs : {};
  return {
    ...fresh,
    ...(data as Partial<State>),
    user: { ...fresh.user, ...(data.user as Partial<State['user']>) },
    prefs: {
      ...fresh.prefs,
      ...(prefs as Partial<State['prefs']>),
      notif: { ...fresh.prefs.notif, ...(isObject(prefs.notif) ? (prefs.notif as State['prefs']['notif']) : {}) },
    },
    market: market as unknown as State['market'],
  };
}

export type LoadResult = { state: State; storageOk: boolean };

export function loadState(storage: StorageLike | null, today: ISODate): LoadResult {
  const storageOk = probeStorage(storage);
  let raw: string | null = null;
  if (storage) {
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
  }
  return { state: parseSavedState(raw, today) ?? createInitialState(today), storageOk };
}

/** Returns false (never throws) when the write fails. */
export function saveState(storage: StorageLike | null, state: State): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage: StorageLike | null): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore: nothing else to do
  }
}
