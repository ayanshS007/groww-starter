import { describe, expect, it } from 'vitest';
import { TODAY } from '../test/fixtures';
import { createInitialState } from './initialState';
import { reducer } from './reducer';
import { clearState, loadState, parseSavedState, probeStorage, saveState, STORAGE_KEY, type StorageLike } from './storage';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

const readOnly: StorageLike = {
  getItem: () => null,
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => undefined,
};

describe('storage', () => {
  it('round-trips state under one key', () => {
    const store = memoryStorage();
    const s = reducer(createInitialState(TODAY), { type: 'signUp', mobile: '9876543210', name: 'Riya' });
    expect(saveState(store, s)).toBe(true);
    expect([...store.data.keys()]).toEqual([STORAGE_KEY]);
    const loaded = loadState(store, '2030-01-01');
    expect(loaded.storageOk).toBe(true);
    expect(loaded.state).toEqual(s);
  });
  it('starts fresh with today as week 0 when nothing is saved', () => {
    const { state, storageOk } = loadState(memoryStorage(), TODAY);
    expect(storageOk).toBe(true);
    expect(state).toEqual(createInitialState(TODAY));
  });
});

describe('storage failure: the app keeps working in memory', () => {
  it('getItem/setItem throwing → initial state, storageOk false, no throw', () => {
    expect(() => loadState(throwing, TODAY)).not.toThrow();
    const r = loadState(throwing, TODAY);
    expect(r.storageOk).toBe(false);
    expect(r.state).toEqual(createInitialState(TODAY));
  });
  it('saveState returns false instead of throwing', () => {
    expect(saveState(throwing, createInitialState(TODAY))).toBe(false);
    expect(saveState(readOnly, createInitialState(TODAY))).toBe(false);
    expect(saveState(null, createInitialState(TODAY))).toBe(false);
  });
  it('a read-only store is detected by the probe', () => {
    expect(probeStorage(readOnly)).toBe(false);
    expect(probeStorage(null)).toBe(false);
    expect(probeStorage(memoryStorage())).toBe(true);
  });
  it('no storage at all → initial state', () => {
    expect(loadState(null, TODAY)).toEqual({ state: createInitialState(TODAY), storageOk: false });
  });
  it('clearState never throws', () => {
    expect(() => clearState(throwing)).not.toThrow();
    expect(() => clearState(null)).not.toThrow();
  });
  it('the reducer still works on state loaded without storage', () => {
    const { state } = loadState(throwing, TODAY);
    const next = reducer(state, { type: 'signUp', mobile: '9999999999', name: 'Kabir' });
    expect(next.user.signedUp).toBe(true);
  });
});

describe('parseSavedState rejects bad data', () => {
  it.each([
    ['corrupt JSON', '{not json'],
    ['wrong version', JSON.stringify({ ...createInitialState(TODAY), version: 2 })],
    ['not an object', '[]'],
    ['missing market', JSON.stringify({ version: 1, user: {} })],
    ['bad startDate', JSON.stringify({ ...createInitialState(TODAY), market: { scenario: 'normal', week: 0, history: [], startDate: 'x' } })],
    ['holdings not a list', JSON.stringify({ ...createInitialState(TODAY), holdings: 'oops' })],
  ])('%s → null', (_name, raw) => {
    expect(parseSavedState(raw, TODAY)).toBeNull();
  });
  it('fills fields missing from older saves', () => {
    const { prefs: _p, seenMilestones: _s, ...partial } = createInitialState('2026-01-01');
    const parsed = parseSavedState(JSON.stringify(partial), TODAY)!;
    expect(parsed.seenMilestones).toEqual([]);
    expect(parsed.prefs.stockBudgetPct).toBe(10);
    expect(parsed.market.startDate).toBe('2026-01-01');
  });
});
