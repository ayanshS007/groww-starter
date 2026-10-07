// What the Pro watchlist table looks like, shown behind the lock in the Explore hub
// (Stage 6b). Three sample companies, never the user's own list.
import { STOCKS } from '../data/stocks';
import { formatINR } from '../lib/format';
import { watchlistStocks } from '../lib/proView';
import { useStore } from '../state/store';
import { Card } from './Card';
import { LetterAvatar } from './LetterAvatar';
import { MarketChange } from './MarketChange';
import { RangeBar52w } from './RangeBar52w';

export function WatchlistSample() {
  const { state } = useStore();
  const rows = watchlistStocks(STOCKS.slice(0, 3).map((s) => s.id), state.market);
  return (
    <Card pad="md" aria-labelledby="watch-sample-title">
      <h2 id="watch-sample-title" className="text-lg font-semibold text-ink">
        Your watchlist
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {rows.map((s) => (
          <li key={s.stock.id} className="flex items-center gap-3 py-3">
            <LetterAvatar name={s.stock.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{s.stock.name}</span>
              <RangeBar52w low={s.range.low} high={s.range.high} pos={s.range.pos} className="mt-1 max-w-[160px]" />
            </span>
            <span className="text-right">
              <span className="block font-semibold tabular-nums text-ink">{formatINR(s.price, 2)}</span>
              <MarketChange change={s.change} className="text-xs" />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">Sample data. Prices and 52-week ranges are illustrative.</p>
    </Card>
  );
}
