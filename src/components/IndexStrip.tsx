// Pro-only strip of sample indices (README 9 item 22), labelled "Sample data".
// Fictional names; levels move with the simulated week. Starter never shows it.
import { formatINR } from '../lib/format';
import type { IndexQuote } from '../lib/proView';
import { MarketChange } from './MarketChange';

export function IndexStrip({ quotes }: { quotes: IndexQuote[] }) {
  return (
    <section aria-labelledby="index-strip-title" className="-mx-4 border-b border-border px-4 py-3 lg:mx-0 lg:px-0">
      <div className="flex items-center gap-2">
        <h2 id="index-strip-title" className="text-sm font-semibold text-ink">
          Indices
        </h2>
        <span className="rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-ink-muted">Sample data</span>
        <span className="text-xs text-ink-muted">Change is this simulated week</span>
      </div>
      <ul className="relative mt-2 flex gap-6 overflow-x-auto pb-1">
        {quotes.map((q) => (
          <li key={q.id} className="flex shrink-0 flex-col text-sm lg:flex-row lg:items-baseline lg:gap-2">
            <span className="font-semibold text-ink">{q.name}</span>
            <span className="tabular-nums text-ink">{formatINR(q.level, 2).replace('₹', '')}</span>
            <MarketChange change={q.change} className="text-xs" />
          </li>
        ))}
      </ul>
    </section>
  );
}
