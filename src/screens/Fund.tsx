// S9 Fund detail (README 9 item 8, PLAN item 28). All three Confidence blocks
// visible without tabs (Starter view), a fit banner when the fund differs from
// the plan, illustrative range band, costs as Terms, sticky actions.
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Disclaimer } from '../components/Disclaimer';
import { Icon } from '../components/Icon';
import { LetterAvatar } from '../components/LetterAvatar';
import { Note } from '../components/Note';
import { RangeBand } from '../components/RangeBand';
import { RiskMeter } from '../components/RiskMeter';
import { Sparkline } from '../components/Sparkline';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getFund } from '../data/funds';
import { fundFit, parseFrom } from '../lib/explore';
import { formatINR } from '../lib/format';
import { singleDraft, type InvestType } from '../lib/invest';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import { CategoryLabel } from './Plan';

export function FundDetail({ id, query }: { id: string; query: Record<string, string> }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const fund = getFund(id)!;
  const fit = fundFit(fund, state, parseFrom(query.from));
  const confidence = (
    <ConfidenceBlock
      what={fund.whatItIs}
      why={fit.why}
      next={
        <ol className="list-decimal space-y-1 pl-4">
          {fund.whatHappensNext.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      }
    />
  );
  const saved = state.watchlist.includes(fund.id);

  const start = (type: InvestType) => {
    const planAmount = type === 'sip' && fit.bucket && fit.bucket.amount >= fund.minSip ? fit.bucket.amount : undefined;
    dispatch({ type: 'startInvestDraft', draft: singleDraft(fund.id, { type, amount: planAmount }) });
    navigate(`/invest/${fund.id}`);
  };

  const toggleSave = () => {
    dispatch({ type: 'toggleWatchlist', assetId: fund.id });
    toast.show(saved ? 'Removed from Saved.' : 'Saved. Find it under Collections → Saved.');
  };

  const saveButton = (
    <Button variant="quiet" block onClick={toggleSave} aria-pressed={saved}>
      <Icon name="bookmark" size={20} className={saved ? 'fill-current' : ''} />
      {saved ? 'Saved' : 'Save to watchlist'}
    </Button>
  );

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-12 lg:gap-8 lg:pb-0">
      <div className="space-y-6 lg:col-span-8">
        <BackLink fallback="/explore/funds">Funds</BackLink>

        <header className="flex items-start gap-4">
          <LetterAvatar name={fund.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-ink">{fund.name}</h1>
            <p className="mt-1 text-base text-ink-muted">
              <CategoryLabel fund={fund} /> · {fund.oneLiner}
            </p>
            {fit.bucket && (
              <p className="mt-2 inline-flex rounded-full bg-mint px-3 py-1 text-sm font-semibold text-ink">
                In your plan · {fit.bucket.role === 'cushion' ? 'Cushion' : 'Grow'}
              </p>
            )}
          </div>
        </header>

        {fit.banners.length > 0 && (
          <div className="space-y-3">
            {fit.banners.map((b) => (
              <Note key={b.text} tone={b.tone}>
                <p>{b.text}</p>
                {b.cta && (
                  <Link to={b.cta.to} className="mt-1 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
                    {b.cta.label}
                  </Link>
                )}
              </Note>
            ))}
          </div>
        )}

        <Card pad="lg" aria-labelledby="at-a-glance">
          <h2 id="at-a-glance" className="sr-only">
            At a glance
          </h2>
          <RiskMeter risk={fund.risk} />
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">Suits money you need in</dt>
              <dd className="font-semibold text-ink">{fund.horizonLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Start a SIP from</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(fund.minSip)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">One-time from</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(fund.minOneTime)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">
                <Term id="nav">Price (NAV)</Term>, sample
              </dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(fund.baseNav)}</dd>
            </div>
          </dl>
        </Card>

        <Card pad="lg" aria-labelledby="trend-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="trend-title" className="text-lg font-semibold text-ink">
              How it moved (sample)
            </h2>
            <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative</span>
          </div>
          <Sparkline
            className="mt-3"
            height={72}
            points={fund.sparkline}
            label={`Sample price trend for ${fund.name}, 24 points. Illustrative data.`}
          />
          <h3 className="mt-6 text-base font-semibold text-ink">A year can look like this</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Sample 1-year range for funds of this type. Real results differ, and a year can fall outside it.
          </p>
          <RangeBand className="mt-4" low={fund.illustrativeRange1y.low} high={fund.illustrativeRange1y.high} />
        </Card>

        {state.prefs.view === 'pro' ? (
          // Pro view keeps the Confidence Layer one tap away (README 9, Starter vs Pro).
          <details className="group rounded-card border border-border bg-surface">
            <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold text-brand-text">
              Why this? What it is and what happens next
              <Icon name="chevronDown" size={20} className="shrink-0 transition group-open:rotate-180" />
            </summary>
            <div className="px-2 pb-2">{confidence}</div>
          </details>
        ) : (
          confidence
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card tint="mint" pad="lg" aria-labelledby="good-for">
            <h2 id="good-for" className="text-base font-semibold text-ink">
              Good for
            </h2>
            <p className="mt-2 text-base text-ink">{fund.goodFor}</p>
          </Card>
          <Card tint="peach" pad="lg" aria-labelledby="not-ideal">
            <h2 id="not-ideal" className="text-base font-semibold text-ink">
              Not ideal for
            </h2>
            <p className="mt-2 text-base text-ink">{fund.notIdealFor}</p>
          </Card>
        </div>

        <Card pad="lg" aria-labelledby="risk-costs">
          <h2 id="risk-costs" className="text-lg font-semibold text-ink">
            Main risk and costs
          </h2>
          <p className="mt-2 text-base text-ink">
            <span className="font-semibold">Main risk: </span>
            {fund.mainRisk}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-ink">
                <Term id="expense-ratio">Expense ratio</Term>
              </dt>
              <dd className="text-ink-muted">{fund.expenseRatio}% a year, taken from the fund’s value. Sample figure.</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">
                <Term id="exit-load">Exit load</Term>
              </dt>
              <dd className="text-ink-muted">{fund.exitLoad}</dd>
            </div>
          </dl>
        </Card>

        <Disclaimer />
      </div>

      {/* Desktop: sticky action card on the right. */}
      <aside className="hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <Card pad="lg" className="lg:sticky lg:top-24" aria-labelledby="act-title">
          <h2 id="act-title" className="text-lg font-semibold text-ink">
            Invest in this fund
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            A <Term id="sip">SIP</Term> sends the same amount each month. Skip any month, free.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button block onClick={() => start('sip')}>
              Start SIP
            </Button>
            <Button block variant="secondary" onClick={() => start('one_time')}>
              One-time
            </Button>
            {saveButton}
          </div>
        </Card>
      </aside>

      {/* Mobile: sticky bar above the tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2">
          <Button variant="quiet" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? 'Saved. Tap to remove' : 'Save to watchlist'} className="!px-3">
            <Icon name="bookmark" size={22} className={saved ? 'fill-current' : ''} />
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => start('one_time')}>
            One-time
          </Button>
          <Button className="flex-1" onClick={() => start('sip')}>
            Start SIP
          </Button>
        </div>
      </div>
    </div>
  );
}
