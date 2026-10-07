// Pro stock card (design-refs/03–04): letter avatar, name, sample price and
// change. Sorted alphabetically by the caller, never ranked by change.
import { formatINR } from '../lib/format';
import type { StockQuote } from '../lib/proView';
import { Icon } from './Icon';
import { LetterAvatar } from './LetterAvatar';
import { MarketChange } from './MarketChange';

export function StockCard({ quote, watched, onToggle }: { quote: StockQuote; watched: boolean; onToggle: () => void }) {
  const { stock } = quote;
  return (
    <article aria-label={stock.name} className="flex h-full flex-col rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <LetterAvatar name={stock.name} />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={watched}
          aria-label={watched ? `Remove ${stock.name} from watchlist` : `Add ${stock.name} to watchlist`}
          className={`flex min-h-tap min-w-tap items-center justify-center rounded-full transition hover:bg-surface2 ${watched ? 'text-brand-text' : 'text-ink-muted'}`}
        >
          <Icon name="bookmark" size={20} fill={watched ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="mt-3 font-semibold text-ink">{stock.name}</p>
      <p className="text-xs text-ink-muted">
        {stock.sector} · {stock.sizeLabel}
      </p>
      <p className="mt-auto pt-4 text-lg font-bold tabular-nums text-ink">{formatINR(quote.price, 2)}</p>
      <MarketChange change={quote.change} className="text-sm" />
    </article>
  );
}
