// S14 Holding detail with the Withdraw sheet (README 9 item 11). Funds: Invest
// more (primary) and Withdraw. Stocks: Sell only until the stock screens land.
import { useState } from 'react';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChangeText } from '../components/ChangeText';
import { Disclaimer } from '../components/Disclaimer';
import { LetterAvatar } from '../components/LetterAvatar';
import { Sparkline } from '../components/Sparkline';
import { StatusPill } from '../components/StatusPill';
import { Term } from '../components/Term';
import { WithdrawSheet } from '../components/WithdrawSheet';
import { getFund } from '../data/funds';
import { getStock } from '../data/stocks';
import { formatINR, formatUnits, ordinal } from '../lib/format';
import { singleDraft } from '../lib/invest';
import { navSeries } from '../lib/market';
import { holdingRow } from '../lib/portfolio';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';

export function HoldingDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const [sheet, setSheet] = useState(false);
  const h = state.holdings.find((x) => x.id === id);
  if (!h) return null;
  const row = holdingRow(h, state.market);
  const isStock = h.kind === 'stock';
  const fund = getFund(h.assetId);
  const sips = state.sips.filter((s) => s.fundId === h.assetId && s.status !== 'stopped');
  const series = state.market.history.length >= 2 ? navSeries(h.assetId, state.market.history) : (fund?.sparkline ?? getStock(h.assetId)?.sparkline ?? []);

  const investMore = () => {
    if (!fund) return;
    dispatch({ type: 'startInvestDraft', draft: singleDraft(fund.id, { type: 'sip' }) });
    navigate(`/invest/${fund.id}`);
  };

  const actions = (
    <div className="flex flex-col gap-3">
      {!isStock && (
        <Button block onClick={investMore}>
          Invest more
        </Button>
      )}
      <Button block variant="secondary" onClick={() => setSheet(true)} aria-haspopup="dialog">
        {isStock ? 'Sell' : 'Withdraw'}
      </Button>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-8">
        <BackLink fallback="/portfolio">Portfolio</BackLink>
        <header className="flex items-center gap-4">
          <LetterAvatar name={row.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-ink">{row.name}</h1>
            <p className="text-base text-ink-muted">{row.sub}</p>
          </div>
        </header>

        <Card pad="lg" aria-labelledby="hd-value">
          <div className="flex items-center justify-between gap-3">
            <h2 id="hd-value" className="text-lg font-semibold text-ink">
              What you hold
            </h2>
            <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative values</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tabular-nums text-ink">{formatINR(row.value)}</p>
          <p className="mt-1">
            <ChangeText change={row.change} />
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">{isStock ? 'Shares' : <Term id="units">Units</Term>}</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatUnits(h.units)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">You put in</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(row.invested)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{isStock ? 'Average price' : <Term id="average-nav">Average NAV</Term>}</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(row.avgNav, 2)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{isStock ? 'Price now' : <Term id="nav">NAV now</Term>}</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(row.nav, 2)}</dd>
            </div>
          </dl>
        </Card>

        <div className="lg:hidden">{actions}</div>

        {series.length >= 2 && (
          <Card pad="lg" aria-labelledby="hd-trend">
            <h2 id="hd-trend" className="text-lg font-semibold text-ink">
              Price trend (sample)
            </h2>
            <Sparkline className="mt-3" height={72} points={series} label={`Sample price trend for ${row.name}. Illustrative data.`} />
          </Card>
        )}

        {sips.length > 0 && (
          <Card pad="lg" aria-labelledby="hd-sip">
            <h2 id="hd-sip" className="text-lg font-semibold text-ink">
              Your SIP in this fund
            </h2>
            <ul className="mt-3 space-y-2">
              {sips.map((s) => (
                <li key={s.id}>
                  <Link to={`/portfolio/sip/${s.id}`} className="flex min-h-tap items-center justify-between gap-3 rounded-card-sm bg-surface2 p-4">
                    <span className="text-base text-ink">
                      <span className="font-semibold tabular-nums">{formatINR(s.amount)}</span> on the {ordinal(s.dayOfMonth)}
                    </span>
                    {s.status === 'paused' ? (
                      <StatusPill tone="watch" icon="pause">Paused</StatusPill>
                    ) : (
                      <StatusPill tone="good" icon="check">Active</StatusPill>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {fund && (
          <p className="text-sm text-ink-muted">
            <Link to={`/fund/${fund.id}?from=portfolio`} className="font-semibold text-brand-text underline-offset-4 hover:underline">
              Read about this fund
            </Link>
          </p>
        )}
        <Disclaimer />
      </div>

      <aside className="hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <Card pad="lg" className="lg:sticky lg:top-24" aria-label="Actions">
          <h2 className="text-lg font-semibold text-ink">What would you like to do?</h2>
          <p className="mb-5 mt-1 text-sm text-ink-muted">Add more, take some out, or leave it be. All three are fine.</p>
          {actions}
        </Card>
      </aside>

      <WithdrawSheet holding={h} open={sheet} onClose={() => setSheet(false)} hasSip={sips.length > 0} />
    </div>
  );
}
