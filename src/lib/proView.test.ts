import { describe, expect, it } from 'vitest';
import { SAMPLE_INDICES } from '../data/indices';
import { STOCKS } from '../data/stocks';
import { advance, fresh, oneTime } from '../test/fixtures';
import { indexQuotes, orderRows, parseProTab, stockCards, stockQuote, watchlistStocks } from './proView';

describe('Pro view', () => {
  it('parses sub-tabs, defaulting to Explore', () => {
    expect(parseProTab('watchlist')).toBe('watchlist');
    expect(parseProTab('orders')).toBe('orders');
    expect(parseProTab('gainers')).toBe('explore');
    expect(parseProTab(undefined)).toBe('explore');
  });
  it('sample indices are fictional and labelled (sample)', () => {
    for (const ix of SAMPLE_INDICES) expect(ix.name).toMatch(/\(sample\)$/);
    expect(SAMPLE_INDICES.map((i) => i.name).join(' ')).not.toMatch(/nifty|sensex/i);
  });
  it('index moves follow the simulated week', () => {
    expect(indexQuotes(fresh().market).every((q) => q.change.amount === 0)).toBe(true);
    const down = indexQuotes(advance(fresh(), 1, 'dip_sharp').market);
    expect(down.every((q) => q.change.pct < 0)).toBe(true);
    expect(down[0].change.pct).toBeCloseTo(-8, 6);
    const up = indexQuotes(advance(fresh(), 1, 'up').market);
    expect(up.every((q) => q.change.pct > 0)).toBe(true);
  });
  it('stock cards are alphabetical and filtered by size, never ranked by change', () => {
    const m = fresh().market;
    const all = stockCards(m, null).map((q) => q.stock.name);
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b)));
    expect(all).toHaveLength(STOCKS.length);
    for (const size of ['Large', 'Mid', 'Small'] as const) {
      const cards = stockCards(m, size);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((q) => q.stock.sizeLabel === size)).toBe(true);
    }
  });
  it('52-week range always contains the price', () => {
    const m = advance(fresh(), 6, 'dip_sharp').market;
    for (const s of STOCKS) {
      const q = stockQuote(s, m);
      expect(q.range.low).toBeLessThanOrEqual(q.price);
      expect(q.range.high).toBeGreaterThanOrEqual(q.price);
      expect(q.range.pos).toBeGreaterThanOrEqual(0);
      expect(q.range.pos).toBeLessThanOrEqual(1);
      expect(Math.sign(q.change.amount)).toBe(Math.sign(s.dayChangePct));
    }
  });
  it('watchlist keeps stocks in the order added, skips funds, and searches', () => {
    const m = fresh().market;
    const list = ['stk_voltara', 'index50', 'stk_tealeaf'];
    expect(watchlistStocks(list, m).map((q) => q.stock.id)).toEqual(['stk_voltara', 'stk_tealeaf']);
    expect(watchlistStocks(list, m, 'tea').map((q) => q.stock.id)).toEqual(['stk_tealeaf']);
    expect(watchlistStocks(list, m, 'power').map((q) => q.stock.id)).toEqual(['stk_voltara']);
  });
  it('orders are listed newest first with plain type names', () => {
    let s = oneTime(fresh(), 'liquid1', 500);
    s = advance(s, 1);
    s = oneTime(s, 'gold1', 700);
    const rows = orderRows(s.orders);
    expect(rows[0]).toMatchObject({ asset: 'Gold Fund of Fund', type: 'One-time', amount: 700 });
    expect(rows[1].asset).toBe('Liquid Fund – A');
  });
});
