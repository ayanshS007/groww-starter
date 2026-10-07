// S5 Home (README 9 item 5, PLAN C6): "What should I do next?" One primary
// action (the Next-step card). P1: "Got paid? Split it" and a calm milestone
// card. No news, indices, gainers/losers or banners.
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { Icon, type IconName } from '../components/Icon';
import { InsightLine } from '../components/InsightCard';
import { MilestoneCard } from '../components/MilestoneCard';
import { NextStepCard } from '../components/NextStepCard';
import { PlanSummaryCard } from '../components/PlanSummaryCard';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getFund } from '../data/funds';
import { dateLabel, formatINR, formatSigned } from '../lib/format';
import { insightFromState } from '../lib/insight';
import { overallChange, portfolioValue, totalInvested } from '../lib/market';
import { nextUnseen } from '../lib/milestones';
import { greeting, nextStep, quietRestart, statusLine, upcomingSips } from '../lib/nextStep';
import { Link } from '../router';
import { useStore } from '../state/store';

function Snapshot() {
  const { state } = useStore();
  if (!state.holdings.some((h) => h.units > 0)) return null;
  const value = portfolioValue(state);
  const invested = totalInvested(state);
  const change = overallChange(state);
  const down = change.amount < 0;
  const insight = insightFromState(state);
  return (
    <Card pad="lg" aria-labelledby="snapshot-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="snapshot-title" className="text-lg font-semibold text-ink">
          Your money
        </h2>
        <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative values</span>
      </div>
      <p className="mt-3 text-4xl font-extrabold tabular-nums text-ink">{formatINR(value)}</p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-ink-muted">You put in</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatINR(invested)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Change so far</dt>
          <dd className={`flex items-center gap-1 font-semibold tabular-nums ${down ? 'text-caution' : 'text-brand-text'}`}>
            <Icon name={down ? 'arrowDown' : 'arrowUp'} size={16} />
            {formatSigned(change.amount)} ({formatSigned(change.pct, 'pct')})
            <span className="sr-only">{down ? ', down' : ', up'}</span>
          </dd>
        </div>
      </dl>
      <InsightLine insight={insight} />
      <Link to="/portfolio" className="mt-4 inline-flex min-h-tap items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline">
        Open portfolio <Icon name="chevronRight" size={18} />
      </Link>
    </Card>
  );
}

/** When nothing is due because every live SIP is paused, say so and offer Resume. */
function PausedSip() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const sip = state.sips.find((x) => x.status === 'paused');
  if (!sip) return null;
  const fund = getFund(sip.fundId);
  return (
    <Card pad="lg" aria-labelledby="paused-title">
      <h2 id="paused-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Icon name="pause" size={20} className="text-caution" /> SIP paused
      </h2>
      <p className="mt-2 text-base text-ink">
        {formatINR(sip.amount)} into {fund?.name}
        {sip.pausedUntil ? ` restarts after ${dateLabel(sip.pausedUntil, { short: true })}` : ' is paused'}. Nothing to do.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => {
            dispatch({ type: 'resumeSip', sipId: sip.id });
            toast.show('SIP resumed. It runs on its usual date.');
          }}
        >
          Resume now
        </Button>
        <ButtonLink to={`/portfolio/sip/${sip.id}`} variant="quiet" className="w-full sm:w-auto">
          Manage SIP
        </ButtonLink>
      </div>
    </Card>
  );
}

function UpcomingSip() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const next = upcomingSips(state)[0];
  if (!next) return <PausedSip />;
  const fund = getFund(next.sip.fundId);
  const sipId = next.sip.id;
  return (
    <Card pad="lg" aria-labelledby="upcoming-title">
      <h2 id="upcoming-title" className="text-lg font-semibold text-ink">
        Upcoming <Term id="sip">SIP</Term>
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-card-sm bg-peach text-ink">
          <span className="text-lg font-bold leading-none">{dateLabel(next.date, { short: true }).split(' ')[0]}</span>
          <span className="text-xs">{dateLabel(next.date, { short: true }).split(' ')[1]}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold tabular-nums text-ink">{formatINR(next.sip.amount)}</p>
          <p className="text-sm text-ink-muted">{fund?.name}</p>
        </div>
        {next.skippedDate ? (
          <Button variant="quiet" className="w-full sm:w-auto" onClick={() => dispatch({ type: 'undoSkip', sipId })}>
            Undo skip
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              dispatch({ type: 'skipNext', sipId });
              toast.show(`Skipped ${dateLabel(next.date, { short: true })}. Your plan stays alive.`, {
                undo: () => dispatch({ type: 'undoSkip', sipId }),
              });
            }}
          >
            Skip this one
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        {next.skippedDate
          ? `${dateLabel(next.skippedDate, { short: true })} is skipped. Skipping is free.`
          : 'Skip any month, free. Nothing resets.'}
      </p>
    </Card>
  );
}

/** README 9 item 5 (P1): "Got paid? Split it" → Payday Split. */
function PaydayCard() {
  return (
    <Card tint="sky" pad="lg" aria-labelledby="payday-title">
      <h2 id="payday-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Icon name="wallet" size={20} /> Got paid? Split it
      </h2>
      <p className="mt-2 text-base text-ink">See what’s already going to SIPs, a small cushion top-up, and what’s yours to spend.</p>
      <ButtonLink to="/payday" variant="secondary" className="mt-4 w-full sm:w-auto">
        Split my pay
      </ButtonLink>
    </Card>
  );
}

const BROWSE: { to: string; icon: IconName; title: string; body: string; tint: string }[] = [
  { to: '/explore', icon: 'explore', title: 'Look at funds', body: 'Sample funds with plain-English notes.', tint: 'bg-lavender' },
  { to: '/learn/glossary', icon: 'book', title: 'Learn the words', body: 'SIP, NAV and more, in one line each.', tint: 'bg-peach' },
];

export function Home() {
  const { state } = useStore();
  const step = nextStep(state);
  const hasPlan = !!state.plan;
  const quiet = quietRestart(state);
  const milestone = nextUnseen(state);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-7">
        <header>
          <h1 className="text-3xl font-bold text-ink">{greeting(state.user.name, new Date().getHours())}</h1>
          <p className="mt-1 text-base text-ink-muted">{statusLine(state)}</p>
        </header>
        <NextStepCard step={step} />
        {quiet && (
          <p className="-mt-2 text-sm text-ink-muted">
            {quiet.text}{' '}
            <Link to={quiet.to} className="inline-flex min-h-tap items-center font-semibold text-brand-text underline underline-offset-4">
              {quiet.linkText}
            </Link>
          </p>
        )}
        <Snapshot />
        {!hasPlan && (
          <div className="grid gap-4 sm:grid-cols-2">
            {BROWSE.map((b) => (
              <Link key={b.to} to={b.to} className={`flex items-start gap-3 rounded-card ${b.tint} p-5 transition hover:brightness-[0.98]`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                  <Icon name={b.icon} size={20} />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{b.title}</span>
                  <span className="block text-sm text-ink-muted">{b.body}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-6 lg:col-span-5">
        {hasPlan && <PlanSummaryCard state={state} />}
        {hasPlan && <PaydayCard />}
        {milestone && <MilestoneCard id={milestone} />}
        <UpcomingSip />
      </div>
      <Disclaimer className="lg:col-span-12" />
    </div>
  );
}
