// Portfolio and Holding detail logic (README 9 items 10–11, PLAN items 21–22).
import { getFund } from '../data/funds';
import { getStock } from '../data/stocks';
import type { Holding, State } from '../state/types';
import { formatINR } from './format';
import { cushionValue, currentNav, goalSavingsValue, holdingValue, isProcessing, portfolioValue, stockValue, type Change } from './market';

export type HoldingRow = {
  holding: Holding;
  name: string;
  sub: string;
  value: number;
  invested: number;
  change: Change;
  nav: number;
  avgNav: number;
  /** First bought this simulated week: value = invested, units on the way (QA #15). */
  processing: boolean;
};

export function assetName(assetId: string): string {
  return getFund(assetId)?.name ?? getStock(assetId)?.name ?? assetId;
}

function assetSub(h: Holding): string {
  if (h.kind === 'stock') return getStock(h.assetId)?.sector ?? 'Stock';
  const f = getFund(h.assetId);
  return f ? `${f.category} fund` : 'Fund';
}

export function holdingRow(h: Holding, market: State['market']): HoldingRow {
  const value = holdingValue(h, market);
  const amount = value - h.invested;
  return {
    holding: h,
    name: assetName(h.assetId),
    sub: assetSub(h),
    value,
    invested: h.invested,
    change: { amount, pct: h.invested > 0 ? (amount / h.invested) * 100 : 0 },
    nav: currentNav(h.assetId, market),
    avgNav: h.units > 0 ? h.invested / h.units : 0,
    processing: isProcessing(h, market),
  };
}

/** Holdings with units, biggest first. */
export function holdingRows(state: Pick<State, 'holdings' | 'market'>): HoldingRow[] {
  return state.holdings
    .filter((h) => h.units > 0)
    .map((h) => holdingRow(h, state.market))
    .sort((a, b) => b.value - a.value);
}

export type SliceId = 'cushion' | 'goals' | 'grow' | 'stocks';
export type AssetSlice = { id: SliceId; label: string; value: number; pct: number };

/** Cushion (liquid funds not behind a goal), goal savings, grow (other funds) and stocks. Empty slices are left out. */
export function assetSplit(state: Pick<State, 'holdings' | 'market'> & Partial<Pick<State, 'goals' | 'sips'>>): AssetSlice[] {
  const total = portfolioValue(state);
  if (total <= 0) return [];
  const cushion = cushionValue(state);
  const goals = goalSavingsValue(state);
  const stocks = stockValue(state);
  const grow = Math.max(0, total - cushion - goals - stocks);
  const raw: [SliceId, string, number][] = [
    ['cushion', 'Cushion', cushion],
    ['goals', 'Goal savings', goals],
    ['grow', 'Grow funds', grow],
    ['stocks', 'Stocks', stocks],
  ];
  return raw.filter(([, , v]) => v > 0.005).map(([id, label, value]) => ({ id, label, value, pct: (value / total) * 100 }));
}

// ---------- withdraw ----------
export type WithdrawCheck =
  | { ok: true; units: number; amount: number; all: boolean }
  | { ok: false; error: string };

/**
 * Funds are withdrawn by ₹ amount (or all); stocks by whole shares (PLAN item 22).
 * An amount that rounds to the full value is treated as "all".
 */
export function checkWithdraw(
  input: string,
  h: { kind: Holding['kind']; units: number; nav: number },
  all: boolean,
): WithdrawCheck {
  const value = h.units * h.nav;
  if (all) {
    const units = h.kind === 'stock' ? Math.floor(h.units) : h.units;
    return { ok: true, units, amount: units * h.nav, all: units >= h.units };
  }
  const raw = input.replace(/[₹,\s]/g, '');
  if (raw === '') return { ok: false, error: h.kind === 'stock' ? 'Enter how many shares.' : 'Enter an amount.' };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: 'Enter a number.' };
  if (!Number.isInteger(n)) return { ok: false, error: h.kind === 'stock' ? 'Shares are whole numbers.' : 'Use whole rupees.' };
  if (n <= 0) return { ok: false, error: h.kind === 'stock' ? 'Enter at least 1 share.' : `Enter more than ${formatINR(0)}.` };
  if (h.kind === 'stock') {
    if (n > h.units) return { ok: false, error: `You hold ${h.units} share${h.units === 1 ? '' : 's'}. Enter that or fewer.` };
    return { ok: true, units: n, amount: n * h.nav, all: n >= h.units };
  }
  if (n > Math.round(value)) return { ok: false, error: `You hold ${formatINR(value)} here. Enter that or less.` };
  if (n >= Math.round(value)) return { ok: true, units: h.units, amount: value, all: true };
  return { ok: true, units: n / h.nav, amount: n, all: false };
}
