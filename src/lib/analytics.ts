// Pro portfolio analytics for the Dashboard (Stage 6b): the mix by category and one
// illustrative yearly figure. Both are labelled as sample data in the UI.
import { getFund } from '../data/funds';
import type { State } from '../state/types';
import { holdingValue } from './market';

export type MixRow = { label: string; value: number; pct: number };

/** Value by fund category, with company shares as "Stocks". Largest first. */
export function categoryMix(state: State): MixRow[] {
  const byLabel = new Map<string, number>();
  for (const h of state.holdings) {
    const value = holdingValue(h, state.market);
    if (!(value > 0)) continue;
    const label = h.kind === 'stock' ? 'Stocks' : (getFund(h.assetId)?.category ?? 'Other');
    byLabel.set(label, (byLabel.get(label) ?? 0) + value);
  }
  const total = [...byLabel.values()].reduce((a, b) => a + b, 0);
  return [...byLabel.entries()]
    .map(([label, value]) => ({ label, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/**
 * The funds' illustrative 1-year returns, weighted by what the user holds. It is
 * a description of sample fund figures, not the user's own return and not a
 * forecast. Stocks have no such figure and are left out; `coverage` is the share
 * of the portfolio the figure covers (0–1). Null when no fund is held.
 */
export function illustrativeYearlyReturn(state: State): { pct: number; coverage: number } | null {
  let fundValue = 0;
  let weighted = 0;
  let total = 0;
  for (const h of state.holdings) {
    const value = holdingValue(h, state.market);
    if (!(value > 0)) continue;
    total += value;
    const fund = h.kind === 'fund' ? getFund(h.assetId) : undefined;
    if (!fund) continue;
    fundValue += value;
    weighted += value * fund.illustrativeReturns.y1;
  }
  if (fundValue <= 0) return null;
  return { pct: weighted / fundValue, coverage: total > 0 ? fundValue / total : 0 };
}
