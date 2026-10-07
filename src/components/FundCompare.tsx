// Pro side-by-side compare of two funds (Stage 6b). Plain numbers, no winner.
import { useId, useState } from 'react';
import { FUNDS, getFund } from '../data/funds';
import { formatINR, formatPct } from '../lib/format';
import type { Fund } from '../state/types';
import { Card } from './Card';

function defaultOther(fund: Fund): Fund {
  return FUNDS.find((f) => f.id !== fund.id && f.category === fund.category) ?? FUNDS.find((f) => f.id !== fund.id)!;
}

const ROWS: { label: string; get: (f: Fund) => string }[] = [
  { label: 'Category', get: (f) => f.category },
  { label: 'Risk (1 low, 5 high)', get: (f) => `${f.risk} of 5` },
  { label: 'Time frame', get: (f) => f.horizonLabel },
  { label: 'Start a SIP from', get: (f) => formatINR(f.minSip) },
  { label: 'Expense ratio', get: (f) => `${f.expenseRatio}% a year` },
  { label: '1-year, illustrative', get: (f) => formatPct(f.illustrativeReturns.y1) },
  { label: '3-year, illustrative', get: (f) => formatPct(f.illustrativeReturns.y3) },
  { label: '5-year, illustrative', get: (f) => formatPct(f.illustrativeReturns.y5) },
];

export function FundCompare({ fund }: { fund: Fund }) {
  const selectId = useId();
  const [otherId, setOtherId] = useState(() => defaultOther(fund).id);
  const other = getFund(otherId) ?? defaultOther(fund);
  return (
    <Card pad="lg" aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-lg font-semibold text-ink">
        Compare two funds
      </h2>
      <div className="mt-3 max-w-sm">
        <label htmlFor={selectId} className="block text-sm font-medium text-ink">
          Compare with
        </label>
        <select
          id={selectId}
          value={other.id}
          onChange={(e) => setOtherId(e.target.value as Fund['id'])}
          className="mt-1 min-h-tap w-full rounded-card-sm border border-border bg-surface px-3 text-base text-ink focus:border-brand"
        >
          {FUNDS.filter((f) => f.id !== fund.id).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <caption className="sr-only">
            {fund.name} and {other.name}, side by side
          </caption>
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th scope="col" className="py-2 pr-2 font-medium">
                <span className="sr-only">Measure</span>
              </th>
              <th scope="col" className="px-2 py-2 font-semibold text-ink">
                {fund.name}
              </th>
              <th scope="col" className="px-2 py-2 font-semibold text-ink">
                {other.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="py-2 pr-2 font-medium text-ink-muted">
                  {r.label}
                </th>
                <td className="px-2 py-2 tabular-nums text-ink">{r.get(fund)}</td>
                <td className="px-2 py-2 tabular-nums text-ink">{r.get(other)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-muted">Sample figures, side by side. A bigger number isn’t a better fit: check the risk and time frame first.</p>
    </Card>
  );
}
