// S13 Portfolio (README 9 item 10). Numbers, the weekly insight right under
// them, holdings, SIPs, goals (P1), empty state, disclaimer, Reviewer tools link.
// The user's own dips are amber with an arrow and a word, never red.
import { AssetBar } from '../components/AssetBar';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ChangeText } from '../components/ChangeText';
import { Disclaimer } from '../components/Disclaimer';
import { EmptyState } from '../components/EmptyState';
import { GoalRow } from '../components/GoalRow';
import { Icon } from '../components/Icon';
import { InsightCard } from '../components/InsightCard';
import { LetterAvatar } from '../components/LetterAvatar';
import { SipStatusPill } from '../components/StatusPill';
import { Term } from '../components/Term';
import { getFund } from '../data/funds';
import { dateLabel, formatINR, ordinal } from '../lib/format';
import { insightFromState } from '../lib/insight';
import { overallChange, portfolioValue, PROCESSING_NOTE, totalInvested } from '../lib/market';
import { nextStep, upcomingSips } from '../lib/nextStep';
import { assetSplit, holdingRows } from '../lib/portfolio';
import { Link } from '../router';
import { useStore } from '../state/store';

export function Portfolio() {
  const { state } = useStore();
  const rows = holdingRows(state);

  if (rows.length === 0) {
    const step = nextStep(state);
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink">Portfolio</h1>
        <EmptyState
          title="Nothing here yet"
          body="Your portfolio fills in after your first investment. You can start with ₹100."
          action={
            <ButtonLink to={step.to} className="mt-2">
              {step.cta}
            </ButtonLink>
          }
        />
        <Disclaimer />
        <ReviewerLink />
      </div>
    );
  }

  const value = portfolioValue(state);
  const invested = totalInvested(state);
  const change = overallChange(state);
  const insight = insightFromState(state);
  const upcoming = new Map(upcomingSips(state).map((u) => [u.sip.id, u]));
  const live = state.sips.filter((s) => s.status !== 'stopped');
  const manage = state.sips.find((s) => s.status === 'active') ?? state.sips.find((s) => s.status === 'paused');

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-7">
        <h1 className="text-3xl font-bold text-ink">Portfolio</h1>

        <Card pad="lg" aria-labelledby="pf-numbers">
          <div className="flex items-center justify-between gap-3">
            <h2 id="pf-numbers" className="text-lg font-semibold text-ink">
              Your money
            </h2>
            <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative values</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tabular-nums text-ink">{formatINR(value)}</p>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Invested</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(invested)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Overall change</dt>
              <dd>
                <ChangeText change={change} />
              </dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-border pt-5">
            <AssetBar slices={assetSplit(state)} />
          </div>
        </Card>

        <InsightCard insight={insight} />

        <section aria-labelledby="holdings-title">
          <h2 id="holdings-title" className="text-lg font-semibold text-ink">
            Holdings
          </h2>
          <ul className="mt-3 space-y-3">
            {rows.map((r) => (
              <li key={r.holding.id}>
                <Link
                  to={`/portfolio/holding/${r.holding.id}`}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition hover:bg-surface2"
                >
                  <LetterAvatar name={r.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{r.name}</span>
                    <span className="block text-sm text-ink-muted">{r.sub}</span>
                    {r.processing && <span className="block text-sm text-ink-muted">{PROCESSING_NOTE}</span>}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold tabular-nums text-ink">{formatINR(r.value)}</span>
                    {!r.processing && <ChangeText change={r.change} className="text-xs" />}
                  </span>
                  <Icon name="chevronRight" className="shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card pad="lg" aria-labelledby="sips-title">
          <h2 id="sips-title" className="text-lg font-semibold text-ink">
            Your <Term id="sip">SIPs</Term>
          </h2>
          {live.length === 0 ? (
            <p className="mt-2 text-base text-ink-muted">No SIP is running. You can start one from any fund.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {live.map((s) => {
                const u = upcoming.get(s.id);
                return (
                  <li key={s.id}>
                    <Link
                      to={`/portfolio/sip/${s.id}`}
                      className="flex items-center gap-3 rounded-card-sm bg-surface2 p-4 transition hover:brightness-[0.98]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{getFund(s.fundId)?.name}</span>
                        <span className="block text-sm text-ink-muted">
                          {formatINR(s.amount)} on the {ordinal(s.dayOfMonth)} ·{' '}
                          {s.status === 'paused' && s.pausedUntil
                            ? `back on ${dateLabel(s.pausedUntil, { short: true })}`
                            : u?.skippedDate
                              ? `skipping ${dateLabel(u.skippedDate, { short: true })}`
                              : u
                                ? `next ${dateLabel(u.date, { short: true })}`
                                : ''}
                        </span>
                        {s.stepUpPct && <span className="block text-sm text-ink-muted">{`Step-up +${s.stepUpPct}% yearly is on`}</span>}
                      </span>
                      <SipStatusPill status={s.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4">
            {manage ? (
              <ButtonLink to={`/portfolio/sip/${manage.id}`} block>
                Manage my SIP
              </ButtonLink>
            ) : (
              <ButtonLink to="/explore/funds" block>
                Find a fund
              </ButtonLink>
            )}
          </div>
          <p className="mt-3 text-sm text-ink-muted">Skip a month, free, up to 3 working days before the debit. Nothing resets.</p>
        </Card>

        <Card pad="lg" aria-labelledby="pf-goals-title">
          <h2 id="pf-goals-title" className="text-lg font-semibold text-ink">
            Goals
          </h2>
          {state.goals.length === 0 ? (
            <p className="mt-2 text-base text-ink-muted">Saving for a laptop, a trip or a cushion? A goal shows what a month takes.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {state.goals.map((g) => (
                <li key={g.id}>
                  <GoalRow goal={g} state={state} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/portfolio/goals" className="mt-3 inline-flex min-h-tap items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline">
            {state.goals.length === 0 ? 'Create a goal' : 'All goals'} <Icon name="chevronRight" size={18} />
          </Link>
        </Card>
      </div>

      <div className="space-y-3 lg:col-span-12">
        <Disclaimer />
        <ReviewerLink />
      </div>
    </div>
  );
}

function ReviewerLink() {
  return (
    <p className="text-xs text-ink-muted">
      <Link to="/review" className="underline underline-offset-4 hover:text-ink">
        Reviewer tools
      </Link>
    </p>
  );
}
