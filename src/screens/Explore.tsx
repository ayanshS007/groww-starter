// S7 Explore hub (README 9 item 7). Starter view: hub tiles (funds, stocks), one plain
// "Markets this week" line, collections preview. No index strip, no movers.
// Pro view (README 9 item 22, PLAN S31) lives in ExplorePro.
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { COLLECTIONS, FUNDS } from '../data/funds';
import { STOCKS } from '../data/stocks';
import { MARKETS_THIS_WEEK } from '../lib/market';
import { MARKETS_RESTING } from '../lib/mood';
import { useAmbience } from '../components/useAmbience';
import { buildPath } from '../lib/routes';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import { ExplorePro } from './ExplorePro';

export function Explore({ query = {} }: { query?: Record<string, string> }) {
  const { state } = useStore();
  if (state.prefs.view === 'pro') return <ExplorePro query={query} />;
  return <ExploreStarter />;
}

function ExploreStarter() {
  const { state } = useStore();
  const { weekend } = useAmbience();
  const saved = state.watchlist.filter((id) => FUNDS.some((f) => f.id === id)).length;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink">Explore</h1>
        <p className="mt-1 text-base text-ink-muted">Look around at your own pace. Nothing here is a tip.</p>
      </header>

      <Card tint="mint" pad="lg" aria-labelledby="funds-tile">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
            <Icon name="portfolio" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="funds-tile" className="text-xl font-bold text-ink">
              Mutual funds
            </h2>
            <p className="mt-1 text-base text-ink">
              {FUNDS.length} sample funds, each explained in plain words. Start from ₹100.
            </p>
            <ButtonLink to="/explore/funds" className="mt-4">
              Browse mutual funds
              <Icon name="chevronRight" size={20} />
            </ButtonLink>
          </div>
        </div>
      </Card>

      <Card tint="lavender" pad="lg" aria-labelledby="stocks-tile">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
            <Icon name="dashboard" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="stocks-tile" className="text-xl font-bold text-ink">
              Stocks
            </h2>
            <p className="mt-1 text-base text-ink">
              {STOCKS.length} sample companies in beginner mode: delivery only, with your own stock budget.
            </p>
            <ButtonLink to="/explore/stocks" variant="secondary" className="mt-4">
              Browse stocks
              <Icon name="chevronRight" size={20} />
            </ButtonLink>
          </div>
        </div>
      </Card>

      <p aria-live="polite" className="flex items-start gap-2 rounded-card-sm bg-surface2 p-4 text-sm text-ink">
        <Icon name={weekend ? 'moon' : 'info'} size={18} className="mt-0.5 shrink-0 text-ink-muted" />
        <span>
          {weekend && <span className="font-semibold">{MARKETS_RESTING} </span>}
          {MARKETS_THIS_WEEK[state.market.scenario]} <span className="text-ink-muted">Sample data.</span>
        </span>
      </p>

      <section aria-labelledby="collections-title">
        <h2 id="collections-title" className="text-lg font-semibold text-ink">
          Start from an idea
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Filters, not advice. Tap one to see the funds that match.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLLECTIONS.map((c) => (
            <Chip key={c.id} onClick={() => navigate(buildPath('/explore/funds', { collection: c.id }))}>
              {c.label}
            </Chip>
          ))}
          {saved > 0 && <Chip onClick={() => navigate(buildPath('/explore/funds', { collection: 'saved' }))}>Saved ({saved})</Chip>}
        </div>
      </section>

      <p className="text-sm text-ink-muted">
        Not sure what a word means?{' '}
        <Link to="/learn/glossary" className="font-semibold text-brand-text underline-offset-4 hover:underline">
          Open the glossary
        </Link>
        .
      </p>
    </div>
  );
}
