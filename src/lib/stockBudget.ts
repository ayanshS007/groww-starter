// Stock budget cap (README 8.9, PLAN item 35). P1 logic. Never blocks.

export type StockBuyCheck = {
  exceeds: boolean;
  /** Stocks as % of the portfolio after this buy. */
  afterPct: number;
  limitPct: number;
  /** Largest buy that stays within the budget (₹, ≥ 0). */
  maxBuyWithin: number;
};

export const DEFAULT_STOCK_BUDGET_PCT = 10;

/** Checked including the proposed buy, so a first buy with no other holdings is 100% stocks. */
export function checkStockBuy({
  stockValue,
  portfolioValue,
  buyAmount,
  pct,
}: {
  stockValue: number;
  portfolioValue: number;
  buyAmount: number;
  pct: number;
}): StockBuyCheck {
  const afterTotal = portfolioValue + buyAmount;
  const afterPct = afterTotal > 0 ? ((stockValue + buyAmount) / afterTotal) * 100 : 0;
  const share = pct / 100;
  const maxBuyWithin = share >= 1 ? Infinity : Math.max(0, Math.floor((share * portfolioValue - stockValue) / (1 - share)));
  return { exceeds: afterPct > pct + 1e-9, afterPct, limitPct: pct, maxBuyWithin };
}
