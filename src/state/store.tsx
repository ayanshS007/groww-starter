// Context + useReducer store, persisted under one localStorage key.
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { realToday } from '../lib/dates';
import { reducer, type Action } from './reducer';
import { getBrowserStorage, loadState, saveState, type StorageLike } from './storage';
import type { State } from './types';

export const STORAGE_NOTICE = 'Progress won’t be saved in this browser.';

type StoreValue = {
  state: State;
  dispatch: (action: Action) => void;
  /** False when localStorage is unavailable; the app then runs in memory. */
  storageOk: boolean;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  children,
  storage = getBrowserStorage(),
  today = realToday(),
}: {
  children: ReactNode;
  storage?: StorageLike | null;
  today?: string;
}) {
  // Lazy init: read (and probe) storage once, not on every render.
  const [initial] = useState(() => loadState(storage, today));
  const [state, dispatch] = useReducer(reducer, initial.state);
  const [storageOk, setStorageOk] = useState(initial.storageOk);

  useEffect(() => {
    if (!storageOk) return;
    if (!saveState(storage, state)) setStorageOk(false);
  }, [state, storage, storageOk]);

  const value = useMemo(() => ({ state, dispatch, storageOk }), [state, storageOk]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
