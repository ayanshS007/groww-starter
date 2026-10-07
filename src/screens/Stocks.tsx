// S24 Stocks list and S25 Stock detail (README 8.9, 9 item 16, PLAN S24–S25).
// Beginner mode: sample companies, delivery only, "₹1,000 buys n shares" (0
// allowed), main risk, stock budget status, "Why is intraday hidden?".
// No gainers/losers, most bought, target prices, tips, F&O or intraday buttons.
import { useState } from 'react';
import { ChartRanges } from '../components/ChartRanges';
import { MoreOrderTypes } from '../components/MoreOrderTypes';
import { ProGate, useProMode } from '../components/ProGate';
import { sliceRange, type ChartRange } from '../lib/chartRanges';
import { AmountInput } from '../components/AmountInput';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Disclaimer } from '../components/Disclaimer';
import { HiddenTradingSheet } from '../components/HiddenTradingSheet';
import { Icon } from '../components/Icon';
import { LetterAvatar } from '../components/LetterAvatar';
import { Note } from '../components/Note';
import { Sparkline } from '../components/Sparkline';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getStock, STOCKS } from '../data/stocks';
import { proViewOn } from '../lib/pro';
import { searchStocks } from '../lib/explore';
import { formatINR, formatPct, formatUnits } from '../lib/format';
import { currentNav, portfolioValue, stockValue } from '../lib/market';
import { buildPath } from '../lib/routes';
import { buysLine, EXAMPLE_AMOUNT, sharesFor, ZERO_SHARES_NOTE } from '../lib/stockBuy';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import type { StockSize } from '../state/types';

const SIZES: StockSize[] = ['Large', 'Mid', 'Small'];

export const SIZE_TEXT: Record<StockSize, string> = {
  Large: 'Large company: among the biggest listed. Usually steadier, still can fall.',
  Mid: 'Mid-sized company: more room to grow, bigger swings.',
  Small: 'Small company: can rise or fall a lot, sometimes quickly.',
};

export function StocksList({ query = {} }: { query?: Record<string, string> }) {
  const { state } = useStore();
  const [size, setSize] = useState<StockSize | null>(null);
  const [q, setQ] = useState(query.q ?? '');
  const list = searchStocks(STOCKS, q).filter((s) => !size || s.sizeLabel === size);
  const starter = !proViewOn(state);

  return (
    <div className="space-y-6">
      <BackLink fallback="/explore">Explore</BackLink>
      <header>
        <h1 className="text-3xl font-bold text-ink">Stocks</h1>
        <p className="mt-1 text-base text-ink-muted">Sample companies, A to Z. Delivery only: what you buy is yours until you sell.</p>
      </header>

      {starter && (
        <Link
          to={buildPath('/learn/glossary', { term: 'stocks-vs-funds' })}
          className="flex items-center gap-3 rounded-card bg-lavender p-5 transition hover:brightness-[0.98]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
            <Icon name="book" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">New to stocks? ‘Stocks vs funds’ in 60 seconds</span>
            <span className="block text-sm text-ink-muted">What changes when you own one company instead of many.</span>
          </span>
          <Icon name="chevronRight" className="shrink-0 text-ink-muted" />
        </Link>
      )}

      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="stock-search" className="sr-only">
            Search sample companies
          </label>
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="stock-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or sector"
            autoComplete="off"
            className="min-h-[52px] w-full rounded-full border-2 border-border bg-surface pl-11 pr-4 text-base text-ink outline-none placeholder:text-ink-muted focus:border-brand"
          />
        </div>
        <div role="group" aria-label="Company size" className="flex flex-wrap gap-2">
          <Chip selected={size === null} onClick={() => setSize(null)}>
            All sizes
          </Chip>
          {SIZES.map((s) => (
            <Chip key={s} selected={size === s} onClick={() => setSize(size === s ? null : s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {list.length} {list.length === 1 ? 'company' : 'companies'} · Sample data
      </p>
      {list.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-base text-ink">No sample company matches “{q.trim()}”.</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              setQ('');
              setSize(null);
            }}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((s) => {
            const price = currentNav(s.id, state.market);
            return (
              <li key={s.id}>
                <Link to={`/stock/${s.id}`} className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition hover:bg-surface2">
                  <LetterAvatar name={s.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{s.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {s.sector} · {s.sizeLabel}
                    </span>
                  </span>
                  <span className="hidden w-20 sm:block">
                    <Sparkline points={s.sparkline} height={32} label={`Sample trend for ${s.name}`} />
                  </span>
                  <span className="text-right">
                    <span className="block font-bold tabular-nums text-ink">{formatINR(price, 2)}</span>
                    <span className="block text-xs text-ink-muted">sample price</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Disclaimer />
    </div>
  );
}

export function StockDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [why, setWhy] = useState(false);
  const [range, setRange] = useState<ChartRange>('All');
  const live = useProMode() === 'live';
  const [amountText, setAmountText] = useState(String(EXAMPLE_AMOUNT));
  const stock = getStock(id)!;
  const price = currentNav(stock.id, state.market);
  const amount = Number(amountText.replace(/,/g, '')) || 0;
  const n = sharesFor(amount, price);
  const saved = state.watchlist.includes(stock.id);
  const holding = state.holdings.find((h) => h.assetId === stock.id && h.units > 0);
  const total = portfolioValue(state);
  const stockPct = total > 0 ? (stockValue(state) / total) * 100 : 0;
  const limit = state.prefs.stockBudgetPct;

  const toggleSave = () => {
    dispatch({ type: 'toggleWatchlist', assetId: stock.id });
    toast.show(saved ? 'Removed from your watchlist.' : 'Added to your watchlist.');
  };
  const buy = () => navigate(`/stock/${stock.id}/buy`);

  const actions = (
    <div className="flex flex-col gap-3">
      <Button block onClick={buy}>
        Buy
      </Button>
      <Button variant="quiet" block onClick={toggleSave} aria-pressed={saved}>
        <Icon name="bookmark" size={20} className={saved ? 'fill-current' : ''} />
        {saved ? 'In your watchlist' : 'Save to watchlist'}
      </Button>
    </div>
  );

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-12 lg:gap-8 lg:pb-0">
      <div className="space-y-6 lg:col-span-8">
        <BackLink fallback="/explore/stocks">Stocks</BackLink>
        <header className="flex items-start gap-4">
          <LetterAvatar name={stock.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-ink">{stock.name}</h1>
            <p className="mt-1 text-base text-ink-muted">
              {stock.sector} · {stock.ticker}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-surface2 px-3 py-1 text-sm font-semibold text-ink">{stock.sizeLabel} company</p>
          </div>
        </header>

        <Card pad="lg" aria-labelledby="price-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="price-title" className="text-lg font-semibold text-ink">
              Price (sample)
            </h2>
            <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tabular-nums text-ink">{formatINR(price, 2)}</p>
          <p className="text-sm text-ink-muted">per share, sample data</p>
          <Sparkline className="mt-4" height={72} points={live ? sliceRange(stock.sparkline, range) : stock.sparkline} label={`Sample price trend for ${stock.name}, 24 points. Illustrative data.`} />
        </Card>

        <ProGate label="More chart ranges" className="-mt-3">
          <ChartRanges value={range} onChange={setRange} />
        </ProGate>

        <Card pad="lg" tint="mint" aria-labelledby="buys-title">
          <h2 id="buys-title" className="text-lg font-semibold text-ink">
            What your money buys
          </h2>
          <div className="mt-3 max-w-xs">
            <AmountInput label="Try an amount" value={amountText} onChange={setAmountText} />
          </div>
          <p className="text-2xl font-bold tabular-nums text-ink" aria-live="polite">
            {buysLine(amount, price)}
          </p>
          {n === 0 && amount > 0 ? (
            <p className="mt-2 text-base text-ink">
              {ZERO_SHARES_NOTE} One share costs {formatINR(price, 2)}. A <Term id="mutual-fund">fund</Term> lets you start with ₹100.
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Whole shares only, at the sample price.</p>
          )}
        </Card>

        <Card pad="lg" aria-labelledby="what-title">
          <h2 id="what-title" className="text-lg font-semibold text-ink">
            What they do
          </h2>
          <p className="mt-2 text-base text-ink">{stock.whatTheyDo}</p>
          <p className="mt-3 text-sm text-ink-muted">{SIZE_TEXT[stock.sizeLabel]}</p>
          <p className="mt-4 text-base text-ink">
            <span className="font-semibold">Main risk: </span>
            {stock.mainRisk}
          </p>
          <p className="mt-2 text-sm text-ink-muted">One company can fall a lot, even when markets are fine.</p>
        </Card>

        <Card pad="lg" aria-labelledby="budget-title">
          <h2 id="budget-title" className="text-lg font-semibold text-ink">
            Your stock budget
          </h2>
          <p className="mt-2 text-base text-ink">
            Stocks are {formatPct(stockPct, 0)} of your portfolio. Your limit is {formatPct(limit, 0)}.
          </p>
          {holding && (
            <p className="mt-2 text-base text-ink">
              You hold {formatUnits(holding.units)} share{holding.units === 1 ? '' : 's'}.{' '}
              <Link to={`/portfolio/holding/${holding.id}`} className="font-semibold text-brand-text underline-offset-4 hover:underline">
                See holding
              </Link>
            </p>
          )}
          <Link to="/you/trading" className="mt-2 inline-flex min-h-tap items-center gap-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
            Change my limit <Icon name="chevronRight" size={16} />
          </Link>
        </Card>

        <Note tone="info">
          <p>
            Delivery only. <Term id="delivery-vs-intraday">Intraday</Term> and F&amp;O are hidden in beginner mode.
          </p>
          <button type="button" onClick={() => setWhy(true)} aria-haspopup="dialog" className="mt-1 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
            Why is intraday hidden?
          </button>
        </Note>

        <ProGate label="More order types">
          <MoreOrderTypes />
        </ProGate>

        <Disclaimer />
      </div>

      <aside className="hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <Card pad="lg" className="lg:sticky lg:top-24" aria-labelledby="act-title">
          <h2 id="act-title" className="text-lg font-semibold text-ink">
            Buy shares
          </h2>
          <p className="mb-5 mt-1 text-sm text-ink-muted">Pick how many on the next screen. Nothing is bought until you confirm.</p>
          {actions}
        </Card>
      </aside>

      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2">
          <Button variant="quiet" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? 'In your watchlist. Tap to remove' : 'Save to watchlist'} className="!px-3">
            <Icon name="bookmark" size={22} className={saved ? 'fill-current' : ''} />
          </Button>
          <Button className="flex-1" onClick={buy}>
            Buy
          </Button>
        </div>
      </div>

      <HiddenTradingSheet open={why} onClose={() => setWhy(false)} />
    </div>
  );
}
