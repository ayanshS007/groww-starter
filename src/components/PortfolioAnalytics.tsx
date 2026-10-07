// Pro portfolio analytics on the Dashboard (Stage 6b): category mix and one
// illustrative yearly figure, labelled as sample data and not a forecast.
import { categoryMix, illustrativeYearlyReturn } from '../lib/analytics';
import { formatPct } from '../lib/format';
import type { State } from '../state/types';
import { Card } from './Card';
import { ProGate } from './ProGate';

const SLOT = 'lg:order-7 lg:col-span-12';

function Analytics({ state }: { state: State }) {
  const mix = categoryMix(state);
  const ret = illustrativeYearlyReturn(state);
  return (
    <Card pad="md" aria-labelledby="analytics-title" className={SLOT}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="analytics-title" className="text-lg font-semibold text-ink">
          Portfolio analytics
        </h2>
        <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative, sample data</span>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold text-ink">Category mix</h3>
          <ul className="mt-3 space-y-3">
            {mix.map((m) => (
              <li key={m.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink">{m.label}</span>
                  <span className="tabular-nums text-ink">{formatPct(m.pct, 0)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${m.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink">Illustrative yearly return of your mix</h3>
          {ret ? (
            <>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">{formatPct(ret.pct)} a year</p>
              <p className="mt-2 text-sm text-ink-muted">
                Each fund’s sample 1-year figure, weighted by what you hold
                {ret.coverage < 0.995 ? ` (funds only: ${formatPct(ret.coverage * 100, 0)} of your portfolio)` : ''}. It describes the sample figures. It is not your own
                return and not a forecast.
              </p>
            </>
          ) : (
            <p className="mt-2 text-base text-ink-muted">Shows once you hold a fund.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PortfolioAnalytics({ state }: { state: State }) {
  return (
    <ProGate label="Portfolio analytics" className={SLOT}>
      <Analytics state={state} />
    </ProGate>
  );
}
