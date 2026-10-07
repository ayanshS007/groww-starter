// S17 Learn hub (README 9 item 17). Glossary entry + Stocks vs funds. No points,
// badges or view counts. Tip Check (P1) and 60-second cards (P2) are not built yet.
import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { getTerm } from '../data/glossary';
import { STOCKS_VS_FUNDS } from '../data/learn';
import { buildPath } from '../lib/routes';
import { Link } from '../router';

const POPULAR = ['sip', 'nav', 'expense-ratio', 'exit-load', 'liquid-fund', 'index'];

export function Learn() {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink">Learn</h1>
        <p className="mt-1 text-base text-ink-muted">Look up any word before you decide. One line each, with an everyday example.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card tint="mint" pad="lg" className="flex flex-col">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-brand-text">
            <Icon name="book" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ink">Glossary</h2>
          <p className="mt-1 text-base text-ink">Every term used in the app, in plain English.</p>
          <ButtonLink to="/learn/glossary" className="mt-5 self-start">
            Open glossary
          </ButtonLink>
        </Card>
        <Card tint="lavender" pad="lg" className="flex flex-col">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink">
            <Icon name="portfolio" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ink">{STOCKS_VS_FUNDS.title}</h2>
          <p className="mt-1 text-base text-ink">The difference in three lines.</p>
          <Button variant="secondary" className="mt-5 self-start" onClick={() => setSheet(true)}>
            Read it
          </Button>
        </Card>
      </div>
      <section aria-labelledby="popular-title">
        <h2 id="popular-title" className="text-lg font-semibold text-ink">
          Words people look up first
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {POPULAR.map((id) => (
            <li key={id}>
              <Link
                to={buildPath('/learn/glossary', { term: id })}
                className="inline-flex min-h-tap items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface2"
              >
                {getTerm(id)?.term}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={STOCKS_VS_FUNDS.title}>
        <ul className="space-y-3">
          {STOCKS_VS_FUNDS.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-base text-ink">
              <Icon name="check" size={20} className="mt-0.5 shrink-0 text-brand-text" />
              {b}
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
