// Stock buy in beginner mode (README 8.9, 9 item 16, PLAN S25–S26, item 35).
// Delivery only; Market or Limit, each explained. The order lives in the URL
// query, so leaving for KYC or Tip Check and coming back keeps it.
import type { PickReason, State } from '../state/types';
import { formatINR } from './format';
import { portfolioValue, stockValue } from './market';
import { buildPath } from './routes';
import { checkStockBuy, type StockBuyCheck } from './stockBudget';

export const MAX_SHARES = 999;
export const EXAMPLE_AMOUNT = 1000;
export const ZERO_SHARES_NOTE = 'Indian exchanges don’t sell parts of a share.';
/** A limit price must sit within this share of the sample price. */
export const LIMIT_BAND = 0.2;

/** Whole shares an amount buys at a price; 0 is allowed. */
export function sharesFor(amount: number, price: number): number {
  if (!(price > 0) || !(amount > 0)) return 0;
  return Math.floor(amount / price + 1e-9);
}

/** "₹1,000 buys 2 shares" / "₹1,000 buys 1 share" / "₹1,000 buys 0 shares". */
export function buysLine(amount: number, price: number): string {
  const n = sharesFor(amount, price);
  return `${formatINR(amount)} buys ${n} share${n === 1 ? '' : 's'}`;
}

export type OrderType = 'market' | 'limit';

export const ORDER_TYPES: { value: OrderType; label: string; hint: string }[] = [
  { value: 'market', label: 'Market', hint: 'Buys now at the current sample price.' },
  { value: 'limit', label: 'Limit', hint: 'Buys only at your price or lower. It may never fill.' },
];

/** Shown as plain explanations once the readiness check is passed (PLAN C13). Never placeable. */
export const MORE_ORDER_TYPES: { label: string; text: string }[] = [
  { label: 'Stop-loss', text: 'Sells automatically if the price falls to a level you set, to limit a loss. It can sell lower than you set in a fast fall.' },
  { label: 'Good till triggered (GTT)', text: 'A limit order that waits for weeks until your price is reached, instead of expiring the same day.' },
  { label: 'After-market order (AMO)', text: 'An order placed after the market closes. It goes to the exchange when trading opens next.' },
];

// ---------- the order in the URL ----------
export type BuyStep = 'order' | 'review';
export type BuyMode = 'shares' | 'amount';

export type BuyDraft = {
  step: BuyStep;
  mode: BuyMode;
  qty: number;
  amount?: number;
  orderType: OrderType;
  limit?: number;
  reason?: PickReason;
  /** The Tip Check offer was taken or skipped. */
  tipDone: boolean;
  /** The user already chose "Buy anyway" on the budget sheet. */
  budgetOk: boolean;
  /** The risk box is ticked. Kept in the URL so it survives KYC, as fund buys do. */
  riskAck: boolean;
};

const REASONS: PickReason[] = ['plan', 'researched', 'social', 'not_sure'];

function int(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseBuyQuery(q: Record<string, string>): BuyDraft {
  const qty = Math.round(int(q.qty) ?? 1);
  const amount = int(q.amt);
  const limit = int(q.limit);
  return {
    step: q.step === 'review' ? 'review' : 'order',
    mode: q.mode === 'amount' ? 'amount' : 'shares',
    qty: Math.min(MAX_SHARES, Math.max(q.mode === 'amount' ? 0 : 1, qty)),
    amount: amount !== undefined && amount > 0 ? Math.round(amount) : undefined,
    orderType: q.type === 'limit' ? 'limit' : 'market',
    limit: limit !== undefined && limit > 0 ? limit : undefined,
    reason: REASONS.includes(q.reason as PickReason) ? (q.reason as PickReason) : undefined,
    tipDone: q.tc === '1',
    budgetOk: q.ok === '1',
    riskAck: q.ack === '1',
  };
}

export function buyPath(stockId: string, d: BuyDraft): string {
  return buildPath(`/stock/${stockId}/buy`, {
    step: d.step === 'review' ? 'review' : undefined,
    mode: d.mode === 'amount' ? 'amount' : undefined,
    qty: String(d.qty),
    amt: d.mode === 'amount' && d.amount ? String(d.amount) : undefined,
    type: d.orderType === 'limit' ? 'limit' : undefined,
    limit: d.orderType === 'limit' && d.limit ? String(d.limit) : undefined,
    reason: d.reason,
    tc: d.tipDone ? '1' : undefined,
    ok: d.budgetOk ? '1' : undefined,
    ack: d.riskAck ? '1' : undefined,
  });
}

export function validateLimit(input: string, price: number): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(input.replace(/[,\s₹]/g, ''));
  if (input.trim() === '' || !Number.isFinite(n) || n <= 0) return { ok: false, error: 'Enter the most you’ll pay per share.' };
  const low = Math.ceil(price * (1 - LIMIT_BAND));
  const high = Math.floor(price * (1 + LIMIT_BAND));
  if (n < low || n > high) return { ok: false, error: `Pick a price between ${formatINR(low)} and ${formatINR(high)}.` };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

/** Price per share the order fills at (PLAN item 35: instantly, at the sample or limit price). */
export function fillPrice(d: Pick<BuyDraft, 'orderType' | 'limit'>, price: number): number {
  return d.orderType === 'limit' && d.limit && d.limit > 0 ? d.limit : price;
}

/** Shares this draft buys: the stepper, or whole shares for the amount typed. */
export function draftShares(d: Pick<BuyDraft, 'mode' | 'qty' | 'amount' | 'orderType' | 'limit'>, price: number): number {
  return d.mode === 'amount' ? sharesFor(d.amount ?? 0, fillPrice(d, price)) : d.qty;
}

/** The stock budget check for a buy of this size, from state (never blocks). */
export function budgetCheck(state: Pick<State, 'holdings' | 'market' | 'prefs'>, buyAmount: number): StockBuyCheck {
  return checkStockBuy({
    stockValue: stockValue(state),
    portfolioValue: portfolioValue(state),
    buyAmount,
    pct: state.prefs.stockBudgetPct,
  });
}

/** Whole shares that fit inside the budget at this price. */
export function sharesWithinBudget(check: StockBuyCheck, price: number): number {
  return Number.isFinite(check.maxBuyWithin) ? sharesFor(check.maxBuyWithin, price) : MAX_SHARES;
}
