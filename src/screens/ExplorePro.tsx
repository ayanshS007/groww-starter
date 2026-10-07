// S31 Explore in Pro view (README 9 item 22, PLAN S31 and item 38), after the
// Groww web pattern in design-refs/03–05: underline sub-tabs, a sample index
// strip labelled "Sample data", stock cards with size chips (alphabetical,
// never ranked by change), dense fund rows, a watchlist table.
// Market green/red is allowed here for market prices only; the user's own
// holdings stay neutral/amber (ChangeText).
import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ChangeText } from '../components/ChangeText';
import { Chip } from '../components/Chip';
import { Disclaimer } from '../components/Disclaimer';
import { EmptyState } from '../components/EmptyState';
import { FundRow } from '../components/FundRow';
import { Icon } from '../components/Icon';
import { IndexStrip } from '../components/IndexStrip';
import { LetterAvatar } from '../components/LetterAvatar';
import { MarketChange } from '../components/MarketChange';
import { RangeBar52w } from '../components/RangeBar52w';
import { Sparkline } from '../components/Sparkline';
import { StockCard } from '../components/StockCard';
import { UnderlineTabs } from '../components/UnderlineTabs';
import { FUNDS, getFund } from '../data/funds';
import { STOCKS } from '../data/stocks';
import { planFundIds } from '../lib/explore';
import { dateLabel, formatINR } from '../lib/format';
import { holdingRows } from '../lib/portfolio';
import { indexQuotes, orderRows, parseProTab, PRO_TABS, stockCards, watchlistStocks, type ProTab, type StockQuote } from '../lib/proView';
import { buildPath } from '../lib/routes';
import { Link } from '../router';
import { useStore } from '../state/store';
import type { StockSize } from '../state/types';

const SIZES: StockSize[] = ['Large', 'Mid', 'Small'];
const sectionTitle = 'text-xl font-bold text-ink';

function useWatch() {
  const { state, dispatch } = useStore();
  return {
    watchlist: state.watchlist,
    toggle: (id: string) => dispatch({ type: 'toggleWatchlist', assetId: id }),
  };
}

// ---------- Explore tab ----------
function ExploreTab() {
  const { state } = useStore();
  const { watchlist, toggle } = useWatch();
  const [size, setSize] = useState<StockSize | null>(null);
  const cards = stockCards(state.market, size);
  const inPlan = planFundIds(state);
  return (
    <div className="space-y-8">
      <section aria-labelledby="stocks-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="stocks-title" className={sectionTitle}>
            Stocks
          </h2>
          <span className="text-sm text-ink-muted">Sample companies, A to Z. Prices are sample data.</span>
        </div>
        <div role="group" aria-label="Company size" className="mt-3 flex flex-wrap gap-2">
          <Chip selected={size === null} onClick={() => setSize(null)}>
            All
          </Chip>
          {SIZES.map((s) => (
            <Chip key={s} selected={size === s} onClick={() => setSize(size === s ? null : s)}>
              {s}
            </Chip>
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((q) => (
            <li key={q.stock.id}>
              <StockCard quote={q} watched={watchlist.includes(q.stock.id)} onToggle={() => toggle(q.stock.id)} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-muted">Tap the bookmark to follow a company in your watchlist.</p>
      </section>

      <section aria-labelledby="pro-funds-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pro-funds-title" className={sectionTitle}>
            Mutual funds
          </h2>
          <Link to="/explore/funds" className="inline-flex min-h-tap items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline">
            Search and filter <Icon name="chevronRight" size={18} />
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink-muted">1Y, 3Y and 5Y are illustrative sample returns, not a ranking. Expense is the yearly cost.</p>
        <ul className="mt-3 space-y-2">
          {FUNDS.map((f) => (
            <li key={f.id}>
              <FundRow fund={f} inPlan={inPlan.has(f.id)} saved={watchlist.includes(f.id)} from="link" dense />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Holdings tab: the user's own money, never red ----------
function HoldingsTab() {
  const { state } = useStore();
  const rows = holdingRows(state);
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No holdings yet"
        body="What you invest in shows up here."
        action={
          <ButtonLink to="/explore/funds" className="mt-2">
            Browse mutual funds
          </ButtonLink>
        }
      />
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.holding.id}>
          <Link
            to={`/portfolio/holding/${r.holding.id}`}
            className="flex items-center gap-3 rounded-card-sm border border-border bg-surface px-4 py-3 transition hover:bg-surface2"
          >
            <LetterAvatar name={r.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{r.name}</span>
              <span className="block text-xs text-ink-muted">
                {r.sub} · you put in {formatINR(r.invested)}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-bold tabular-nums text-ink">{formatINR(r.value)}</span>
              <ChangeText change={r.change} className="text-xs" />
            </span>
            <Icon name="chevronRight" className="shrink-0 text-ink-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------- Orders tab ----------
function OrdersTab() {
  const { state } = useStore();
  const rows = orderRows(state.orders);
  if (rows.length === 0) {
    return <EmptyState title="No orders yet" body="Each SIP payment, one-time investment and withdrawal you make shows up here." />;
  }
  return (
    <Card pad="sm">
      <ul className="divide-y divide-border lg:hidden">
        {rows.map((o) => (
          <li key={o.id} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{o.asset}</span>
              <span className="block text-xs text-ink-muted">
                {o.type} · {dateLabel(o.date, { short: true })}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-semibold tabular-nums text-ink">{formatINR(o.amount)}</span>
              <span className="block text-xs text-ink-muted">{o.status}</span>
            </span>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-border text-ink-muted">
            <th scope="col" className="px-2 py-2 font-medium">Date</th>
            <th scope="col" className="px-2 py-2 font-medium">Fund or stock</th>
            <th scope="col" className="px-2 py-2 font-medium">Type</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
            <th scope="col" className="px-2 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((o) => (
            <tr key={o.id}>
              <td className="whitespace-nowrap px-2 py-3 text-ink-muted">{dateLabel(o.date)}</td>
              <td className="px-2 py-3 font-medium text-ink">{o.asset}</td>
              <td className="px-2 py-3 text-ink">{o.type}</td>
              <td className="px-2 py-3 text-right font-semibold tabular-nums text-ink">{formatINR(o.amount)}</td>
              <td className="px-2 py-3 text-ink">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------- Watchlist tab (design-refs/05) ----------
type SortKey = 'name' | 'price' | 'change';

function sortQuotes(list: StockQuote[], key: SortKey | null, dir: 1 | -1): StockQuote[] {
  if (!key) return list;
  const val = (q: StockQuote) => (key === 'name' ? q.stock.name : key === 'price' ? q.price : q.change.pct);
  return [...list].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * dir;
  });
}

function SortHeader({ k, label, sort, onSort, right }: { k: SortKey; label: string; sort: { key: SortKey | null; dir: 1 | -1 }; onSort: (k: SortKey) => void; right?: boolean }) {
  const on = sort.key === k;
  return (
    <th scope="col" aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={`px-2 py-1 font-medium ${right ? 'text-right' : ''}`}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex min-h-tap items-center gap-1 text-ink-muted hover:text-ink">
        {label}
        <Icon name={on && sort.dir === -1 ? 'arrowDown' : 'arrowUp'} size={14} className={on ? 'text-ink' : 'opacity-40'} />
      </button>
    </th>
  );
}

function WatchlistTab() {
  const { state } = useStore();
  const { watchlist, toggle } = useWatch();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey | null; dir: 1 | -1 }>({ key: null, dir: 1 });
  const stocks = sortQuotes(watchlistStocks(watchlist, state.market, q), sort.key, sort.dir);
  const anyStocks = watchlist.some((id) => STOCKS.some((s) => s.id === id));
  const funds = watchlist.map((id) => getFund(id)).filter((f) => !!f);
  const onSort = (k: SortKey) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 1 ? -1 : 1 } : { key: k, dir: 1 }));
  const removeBtn = (id: string, name: string) => (
    <Button variant="secondary" onClick={() => toggle(id)} aria-label={`Remove ${name}`} className="px-3 text-sm">
      Remove
    </Button>
  );

  return (
    <div className="space-y-6">
      <Card pad="md" aria-labelledby="watch-title">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="watch-title" className="mr-auto text-lg font-semibold text-ink">
            Your watchlist
          </h2>
          <Button variant="secondary" onClick={() => setAdding(true)} aria-haspopup="dialog">
            <Icon name="plus" size={18} /> Add stocks
          </Button>
          {anyStocks && (
            <Button variant="secondary" onClick={() => setEditing(!editing)} aria-pressed={editing}>
              {editing ? 'Done' : 'Edit'}
            </Button>
          )}
        </div>
        {anyStocks ? (
          <>
            <div className="relative mt-4 max-w-sm">
              <label htmlFor="watch-search" className="sr-only">
                Search your watchlist
              </label>
              <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="watch-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your watchlist"
                autoComplete="off"
                className="min-h-tap w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base text-ink outline-none placeholder:text-ink-muted focus:border-brand"
              />
            </div>
            {stocks.length === 0 && <p className="mt-4 text-base text-ink-muted">No company in your watchlist matches “{q}”.</p>}

            {/* Phone and tablet: compact list. */}
            <ul className="mt-3 divide-y divide-border lg:hidden">
              {stocks.map((s) => (
                <li key={s.stock.id} className="flex items-center gap-3 py-3">
                  <LetterAvatar name={s.stock.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{s.stock.name}</span>
                    <RangeBar52w low={s.range.low} high={s.range.high} pos={s.range.pos} className="mt-1 max-w-[160px]" />
                  </span>
                  {editing ? (
                    removeBtn(s.stock.id, s.stock.name)
                  ) : (
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums text-ink">{formatINR(s.price, 2)}</span>
                      <MarketChange change={s.change} className="text-xs" />
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop: table with trend, price, 1D change and 52-week range. */}
            {stocks.length > 0 && (
              <table className="mt-4 hidden w-full text-left text-sm lg:table">
                <thead className="bg-surface2">
                  <tr>
                    <SortHeader k="name" label={`Company (${stocks.length})`} sort={sort} onSort={onSort} />
                    <th scope="col" className="px-2 py-1 font-medium text-ink-muted">
                      Trend
                    </th>
                    <SortHeader k="price" label="Mkt price" sort={sort} onSort={onSort} right />
                    <SortHeader k="change" label="1D change" sort={sort} onSort={onSort} right />
                    <th scope="col" className="px-2 py-1 font-medium text-ink-muted">
                      52W range
                    </th>
                    {editing && (
                      <th scope="col" className="px-2 py-1">
                        <span className="sr-only">Remove</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stocks.map((s) => (
                    <tr key={s.stock.id}>
                      <td className="px-2 py-3">
                        <span className="flex items-center gap-3">
                          <LetterAvatar name={s.stock.name} />
                          <span>
                            <span className="block font-semibold text-ink">{s.stock.name}</span>
                            <span className="block text-xs text-ink-muted">{s.stock.sector}</span>
                          </span>
                        </span>
                      </td>
                      <td className="w-36 px-2 py-3">
                        <Sparkline points={s.stock.sparkline} label={`Sample trend for ${s.stock.name}`} height={32} />
                      </td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-ink">{formatINR(s.price, 2)}</td>
                      <td className="px-2 py-3 text-right">
                        <MarketChange change={s.change} />
                      </td>
                      <td className="w-44 px-2 py-3">
                        <RangeBar52w low={s.range.low} high={s.range.high} pos={s.range.pos} />
                      </td>
                      {editing && <td className="px-2 py-3 text-right">{removeBtn(s.stock.id, s.stock.name)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-ink-muted">Sample data. Prices and changes are illustrative, not live.</p>
          </>
        ) : (
          <p className="mt-3 text-base text-ink-muted">No companies yet. Tap Add stocks, or the bookmark on any stock card.</p>
        )}
      </Card>

      <Card pad="md" aria-labelledby="saved-funds-title">
        <h2 id="saved-funds-title" className="text-lg font-semibold text-ink">
          Saved funds
        </h2>
        {funds.length === 0 ? (
          <p className="mt-2 text-base text-ink-muted">
            None yet. Open a fund and tap Save.{' '}
            <Link to={buildPath('/explore', { tab: 'explore' })} className="font-semibold text-brand-text underline-offset-4 hover:underline">
              See funds
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {funds.map((f) => (
              <li key={f!.id}>
                <FundRow fund={f!} inPlan={planFundIds(state).has(f!.id)} saved from="link" dense />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <BottomSheet open={adding} onClose={() => setAdding(false)} title="Add stocks to your watchlist">
        <p className="text-sm text-ink-muted">Sample companies. Following one only adds it to this list.</p>
        <ul className="mt-3 divide-y divide-border">
          {[...STOCKS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => {
              const on = watchlist.includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <LetterAvatar name={s.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{s.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {s.sector} · {s.sizeLabel}
                    </span>
                  </span>
                  <Button variant={on ? 'quiet' : 'secondary'} aria-pressed={on} onClick={() => toggle(s.id)} className="px-4 text-sm">
                    {on ? (
                      <>
                        <Icon name="check" size={16} /> Added
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </li>
              );
            })}
        </ul>
        <Button block className="mt-4" onClick={() => setAdding(false)}>
          Done
        </Button>
      </BottomSheet>
    </div>
  );
}

export function ExplorePro({ query }: { query: Record<string, string> }) {
  const { state } = useStore();
  const tab: ProTab = parseProTab(query.tab);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold text-ink">Explore</h1>
        <p className="mt-1 text-base text-ink-muted">Pro view. Everything here is sample data, and nothing here is a tip.</p>
      </header>
      <UnderlineTabs tabs={PRO_TABS} active={tab} to={(id) => buildPath('/explore', { tab: id === 'explore' ? undefined : id })} label="Explore sections" />
      {tab === 'explore' && <IndexStrip quotes={indexQuotes(state.market)} />}
      {tab === 'explore' && <ExploreTab />}
      {tab === 'holdings' && <HoldingsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'watchlist' && <WatchlistTab />}
      <Disclaimer />
    </div>
  );
}
