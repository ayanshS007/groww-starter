// Explore in Pro view (README 9 item 22, PLAN items 38–39). Market prices only:
// green/red with +/− signs is allowed here, never for the user's own money.
import { SAMPLE_INDICES } from '../data/indices';
import { STOCKS } from '../data/stocks';
import type { MarketState, Order, Stock, StockSize } from '../state/types';
import { currentNav, scenarioMove } from './market';
import { assetName } from './portfolio';

export type ProTab = 'explore' | 'holdings' | 'orders' | 'watchlist';

export const PRO_TABS: { id: ProTab; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'holdings', label: 'Holdings' },
  { id: 'orders', label: 'Orders' },
  { id: 'watchlist', label: 'Watchlist' },
];

export function parseProTab(v: string | undefined): ProTab {
  return PRO_TABS.some((t) => t.id === v) ? (v as ProTab) : 'explore';
}

export type MarketChange = { amount: number; pct: number };

export type IndexQuote = { id: string; name: string; level: number; change: MarketChange };

/** Index level now and its move in the latest simulated week. */
export function indexQuotes(market: Pick<MarketState, 'week' | 'history'>): IndexQuote[] {
  const weeks = market.history.slice(0, market.week);
  return SAMPLE_INDICES.map((ix) => {
    const levels = [ix.base];
    for (const s of weeks) levels.push(levels[levels.length - 1] * (1 + scenarioMove(s) * ix.vol));
    const level = levels[levels.length - 1];
    const prev = levels.length > 1 ? levels[levels.length - 2] : level;
    return { id: ix.id, name: ix.name, level, change: { amount: level - prev, pct: prev > 0 ? ((level - prev) / prev) * 100 : 0 } };
  });
}

export type StockQuote = {
  stock: Stock;
  price: number;
  /** Sample 1-day change from the data file, applied to today's price. */
  change: MarketChange;
  /** 52-week range, widened to include today's price; pos is 0–1 along it. */
  range: { low: number; high: number; pos: number };
};

export function stockQuote(stock: Stock, market: MarketState): StockQuote {
  const price = currentNav(stock.id, market);
  const pct = stock.dayChangePct;
  const amount = price - price / (1 + pct / 100);
  const low = Math.min(stock.week52.low, price);
  const high = Math.max(stock.week52.high, price);
  return { stock, price, change: { amount, pct }, range: { low, high, pos: high > low ? (price - low) / (high - low) : 0.5 } };
}

/** Stock cards: alphabetical, filtered by size. Never ranked by change (PLAN item 38). */
export function stockCards(market: MarketState, size: StockSize | null): StockQuote[] {
  return STOCKS.filter((s) => !size || s.sizeLabel === size)
    .map((s) => stockQuote(s, market))
    .sort((a, b) => a.stock.name.localeCompare(b.stock.name));
}

/** Watchlisted stocks in the order they were added, filtered by a search string. */
export function watchlistStocks(watchlist: string[], market: MarketState, query = ''): StockQuote[] {
  const q = query.trim().toLowerCase();
  return watchlist
    .map((id) => STOCKS.find((s) => s.id === id))
    .filter((s): s is Stock => !!s && (!q || `${s.name} ${s.ticker} ${s.sector}`.toLowerCase().includes(q)))
    .map((s) => stockQuote(s, market));
}

export type OrderRow = { id: string; date: string; asset: string; type: string; amount: number; status: string };

const ORDER_TYPE: Record<Order['type'], string> = {
  sip_first: 'SIP, first payment',
  one_time: 'One-time',
  buy: 'Buy',
  redeem: 'Withdraw',
};

/** Orders, newest first. */
export function orderRows(orders: Order[]): OrderRow[] {
  return [...orders]
    .sort((a, b) => (a.createdAt === b.createdAt ? b.id.localeCompare(a.id, undefined, { numeric: true }) : a.createdAt < b.createdAt ? 1 : -1))
    .map((o) => ({
      id: o.id,
      date: o.createdAt,
      asset: assetName(o.assetId),
      type: ORDER_TYPE[o.type],
      amount: o.amount,
      status: o.status === 'done' ? 'Done' : 'Processing',
    }));
}
