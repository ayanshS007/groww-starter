// S8 Fund list (README 9 item 7). Search, collections, category chips, filter
// sheet. Rows keep the data order: never sorted by returns, no rankings.
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { FilterSheet } from '../components/FilterSheet';
import { FundRow } from '../components/FundRow';
import { Icon } from '../components/Icon';
import { Disclaimer } from '../components/Disclaimer';
import { COLLECTIONS, FUNDS, type CollectionId } from '../data/funds';
import {
  filterFunds,
  FUND_CATEGORIES,
  hasAnyFilter,
  NO_FILTERS,
  planFundIds,
  sheetFilterCount,
  type From,
  type FundFilters,
} from '../lib/explore';
import { useStore } from '../state/store';

function initialFilters(query: Record<string, string>): FundFilters {
  const c = query.collection;
  const collection = c === 'saved' || COLLECTIONS.some((x) => x.id === c) ? (c as CollectionId | 'saved') : null;
  return { ...NO_FILTERS, query: query.q ?? '', collection };
}

export function Funds({ query }: { query: Record<string, string> }) {
  const { state } = useStore();
  const [filters, setFilters] = useState<FundFilters>(() => initialFilters(query));
  const [sheet, setSheet] = useState(false);

  // The desktop top-bar search and Explore chips arrive as query changes.
  useEffect(() => {
    setFilters((f) => ({ ...f, ...initialFilters(query) }));
  }, [query.q, query.collection]);

  const results = useMemo(() => filterFunds(FUNDS, filters, state.watchlist), [filters, state.watchlist]);
  const inPlan = planFundIds(state);
  const from: From = filters.query.trim() ? 'search' : filters.collection ? 'collection' : 'link';
  const extra = sheetFilterCount(filters);
  const pro = state.prefs.view === 'pro';
  const collections = [...COLLECTIONS.map((c) => ({ id: c.id as CollectionId | 'saved', label: c.label })), { id: 'saved' as const, label: 'Saved' }];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold text-ink">Mutual funds</h1>
        <p className="mt-1 text-base text-ink-muted">
          Sample funds. Tap one to read what it is and what could go wrong.
          {pro && ' Returns are illustrative sample figures, not a ranking.'}
        </p>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="fund-search" className="sr-only">
            Search funds
          </label>
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="fund-search"
            type="search"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search by name or type, like “gold”"
            autoComplete="off"
            className="min-h-[52px] w-full rounded-full border-2 border-border bg-surface pl-11 pr-4 text-base text-ink outline-none placeholder:text-ink-muted focus:border-brand"
          />
        </div>
        <Button variant="secondary" onClick={() => setSheet(true)} aria-haspopup="dialog" className="shrink-0">
          Filters{extra > 0 ? ` (${extra})` : ''}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Collections</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {collections.map((c) => (
            <Chip
              key={c.id}
              selected={filters.collection === c.id}
              className="shrink-0"
              onClick={() => setFilters({ ...filters, collection: filters.collection === c.id ? null : c.id })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Type</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip selected={filters.category === null} className="shrink-0" onClick={() => setFilters({ ...filters, category: null })}>
            All
          </Chip>
          {FUND_CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={filters.category === c}
              className="shrink-0"
              onClick={() => setFilters({ ...filters, category: filters.category === c ? null : c })}
            >
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-ink-muted">
        {results.length} fund{results.length === 1 ? '' : 's'}
        {hasAnyFilter(filters) ? ' match' : ''}
      </p>

      {results.length > 0 ? (
        <ul className={pro ? 'space-y-2' : 'grid gap-3 lg:grid-cols-2'}>
          {results.map((f) => (
            <li key={f.id}>
              <FundRow fund={f} inPlan={inPlan.has(f.id)} saved={state.watchlist.includes(f.id)} from={from} dense={pro} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={filters.collection === 'saved' && !filters.query ? 'Nothing saved yet' : 'No funds match'}
          body={
            filters.collection === 'saved' && !filters.query
              ? 'Open a fund and tap Save to keep it here.'
              : 'Try fewer words, or start from one of these ideas.'
          }
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {COLLECTIONS.slice(0, 3).map((c) => (
                <Chip key={c.id} onClick={() => setFilters({ ...NO_FILTERS, collection: c.id })}>
                  {c.label}
                </Chip>
              ))}
              <Button variant="quiet" onClick={() => setFilters(NO_FILTERS)}>
                Clear search and filters
              </Button>
            </div>
          }
        />
      )}

      <Disclaimer />
      <FilterSheet open={sheet} onClose={() => setSheet(false)} filters={filters} onChange={setFilters} resultCount={results.length} />
    </div>
  );
}
