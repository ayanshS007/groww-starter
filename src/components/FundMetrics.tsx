// Pro extra fund numbers (Stage 6b): expense ratio and 1/3/5-year illustrative returns.
import { formatPct } from '../lib/format';
import type { Fund } from '../state/types';
import { Card } from './Card';
import { Term } from './Term';

export function FundMetrics({ fund }: { fund: Fund }) {
  const r = fund.illustrativeReturns;
  return (
    <Card pad="lg" aria-labelledby="metrics-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="metrics-title" className="text-lg font-semibold text-ink">
          Fund numbers
        </h2>
        <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-muted">
            <Term id="expense-ratio">Expense ratio</Term>
          </dt>
          <dd className="text-lg font-semibold tabular-nums text-ink">{fund.expenseRatio}% a year</dd>
        </div>
        {([['1-year', r.y1], ['3-year', r.y3], ['5-year', r.y5]] as const).map(([label, v]) => (
          <div key={label}>
            <dt className="text-ink-muted">{label} return</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{formatPct(v)} a year</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-ink-muted">Sample figures for funds of this type. Past results don’t tell you what comes next.</p>
    </Card>
  );
}
