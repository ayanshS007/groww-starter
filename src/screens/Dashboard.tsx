// S30 Dashboard (README 9 item 21, PLAN S30 and item 37). One glance at the
// user's own money and plan, never the market: no indices, gainers/losers,
// other users or projections. Layout cues from design-refs/01 in Groww green.
// Mobile order: tiles → insight → chart → donut → plan health → SIPs → goals → activity.
import { useState } from 'react';
import { AreaChart, AreaLegend } from '../components/AreaChart';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ChangeText } from '../components/ChangeText';
import { Chip } from '../components/Chip';
import { Disclaimer } from '../components/Disclaimer';
import { Donut } from '../components/Donut';
import { Icon, type IconName } from '../components/Icon';
import { INSIGHT_TONE } from '../components/InsightCard';
import { KpiTile } from '../components/KpiTile';
import { ProgressBar } from '../components/ProgressBar';
import { StatusPill, type PillTone } from '../components/StatusPill';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getFund } from '../data/funds';
import { activeSipTotal } from '../lib/activity';
import {
  ACTIVITY_PREVIEW,
  activityRows,
  allocation,
  chartPoints,
  hasDashboardData,
  healthLink,
  latestDip,
  monthSips,
  periodPoints,
  PERIODS,
  splitLine,
  type ActivityRow,
  type MonthSipStatus,
  type Period,
} from '../lib/dashboard';
import { dateLabel, formatINR, formatSigned, keepSignsTogether } from '../lib/format';
import { goalProgress, goalValue, monthlyNeeded, WITHOUT_RETURNS } from '../lib/goals';
import { insightFromState } from '../lib/insight';
import { overallChange, portfolioValue, simToday, totalInvested, weekChange } from '../lib/market';
import { nextStep, upcomingSips } from '../lib/nextStep';
import { planHealth, STATUS_TEXT, type HealthStatus } from '../lib/planHealth';
import { Link } from '../router';
import { useStore } from '../state/store';
import type { State } from '../state/types';

const cardTitle = 'text-lg font-semibold text-ink';
const textLink = 'inline-flex min-h-tap items-center gap-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline';

// ---------- header ----------
function Header({ period, onPeriod }: { period?: Period; onPeriod?: (p: Period) => void }) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-ink">Your money at a glance</h1>
        <p className="mt-1 text-base text-ink-muted">Only your own money and plan. Illustrative values.</p>
      </div>
      {onPeriod && (
        <div role="group" aria-label="Period for charts" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {PERIODS.map((p) => (
            <Chip key={p.id} selected={period === p.id} className="shrink-0" onClick={() => onPeriod(p.id)}>
              {p.label}
            </Chip>
          ))}
        </div>
      )}
    </header>
  );
}

// ---------- KPI tiles ----------
function NextSipTile({ state }: { state: State }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const next = upcomingSips(state)[0];
  const month = monthSips(state);
  const done = month.filter((r) => r.status === 'done').length;
  const due = month.filter((r) => r.status === 'done' || r.status === 'upcoming').length;

  if (!next) {
    const paused = state.sips.find((s) => s.status === 'paused');
    return (
      <KpiTile tint="sky" icon="calendar" label="Next SIP" value="None scheduled" sub={paused ? 'Your SIPs are paused for now.' : 'No SIP is running.'}>
        {paused && (
          <Link to={`/portfolio/sip/${paused.id}`} className={textLink}>
            Manage SIP <Icon name="chevronRight" size={16} />
          </Link>
        )}
      </KpiTile>
    );
  }
  const sipId = next.sip.id;
  const fund = getFund(next.sip.fundId);
  return (
    <KpiTile
      tint="sky"
      icon="calendar"
      label="Next SIP"
      value={dateLabel(next.date, { short: true })}
      sub={
        <>
          <span className="font-semibold tabular-nums">{formatINR(next.sip.amount)}</span> · {fund?.name}
        </>
      }
    >
      {next.skippedDate ? (
        <p className="mt-1 text-sm text-ink">
          {dateLabel(next.skippedDate, { short: true })} skipped.{' '}
          <button type="button" className={textLink} onClick={() => dispatch({ type: 'undoSkip', sipId })}>
            Undo skip
          </button>
        </p>
      ) : (
        <button
          type="button"
          className={`${textLink} self-start`}
          onClick={() => {
            dispatch({ type: 'skipNext', sipId });
            toast.show(`Skipped ${dateLabel(next.date, { short: true })}. Your plan stays alive.`, {
              undo: () => dispatch({ type: 'undoSkip', sipId }),
            });
          }}
        >
          Skip this one, free
        </button>
      )}
      {due > 0 && (
        <div className="mt-auto pt-3">
          <ProgressBar value={done} max={due} label={`This month: ${done} of ${due} SIP payments done`} />
          <p className="mt-1 text-xs text-ink-muted">
            This month: {done} of {due} done
          </p>
        </div>
      )}
    </KpiTile>
  );
}

function Tiles({ state, period }: { state: State; period: Period }) {
  const points = periodPoints(chartPoints(state), period);
  const value = portfolioValue(state);
  const week = weekChange(state);
  const down = week.amount <= -1;
  const sipTotal = activeSipTotal(state.sips);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiTile
        tint="mint"
        icon="wallet"
        iconTone="brand"
        label="Current value"
        value={formatINR(value)}
        sub={
          <>
            <ChangeText change={overallChange(state)} className="text-sm" /> <span className="text-ink-muted">since start</span>
          </>
        }
        spark={{ points: points.map((p) => p.value), label: 'Value each week (illustrative)' }}
      />
      <KpiTile
        tint="lavender"
        icon="portfolio"
        label="Invested so far"
        value={formatINR(totalInvested(state))}
        sub={sipTotal > 0 ? `${formatINR(sipTotal)} a month in SIPs` : 'No SIP running'}
        spark={{ points: points.map((p) => p.invested), label: 'Amount invested each week' }}
      />
      <KpiTile
        tint="peach"
        icon={down ? 'arrowDown' : 'arrowUp'}
        iconTone={down ? 'caution' : 'brand'}
        label="This week"
        value={keepSignsTogether(formatSigned(week.amount))}
        sub={
          <span className={down ? 'font-semibold text-caution' : 'font-semibold text-brand-text'}>
            {keepSignsTogether(formatSigned(week.pct, 'pct'))}
            <span className="sr-only">{down ? ', down' : ', up or flat'}</span>
            <span className="font-normal text-ink-muted"> market move</span>
          </span>
        }
        spark={{ points: points.slice(1).map((p) => p.move), label: 'Market move each week (illustrative)' }}
      />
      <NextSipTile state={state} />
    </div>
  );
}

// ---------- insight banner ----------
function InsightBanner({ state }: { state: State }) {
  const insight = insightFromState(state);
  const tone = insight ? INSIGHT_TONE[insight.tone] : undefined;
  return (
    <section aria-label="This week" aria-live="polite" className="rounded-card-lg bg-gradient-to-r from-mint to-sky p-5 lg:p-6">
      {insight && tone && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface">
            <Icon name={tone.icon} size={24} className={insight.tone === 'caution' ? 'text-caution' : 'text-brand-text'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{tone.label}</p>
            <p className="mt-1 text-base font-semibold text-ink">{keepSignsTogether(insight.headline)}</p>
            <p className="mt-1 text-base text-ink">{insight.body}</p>
          </div>
          <ButtonLink to="/plan" className="shrink-0 self-start lg:self-center">
            Review my plan
          </ButtonLink>
        </div>
      )}
    </section>
  );
}

// ---------- chart and donut ----------
function ValueCard({ state, period }: { state: State; period: Period }) {
  const points = periodPoints(chartPoints(state), period);
  const dip = latestDip(points);
  const label = PERIODS.find((p) => p.id === period)?.label;
  return (
    <Card pad="md" aria-labelledby="value-title" className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="value-title" className={cardTitle}>
          Value vs invested
        </h2>
        <span className="text-xs text-ink-muted">{label} · illustrative</span>
      </div>
      <div className="mt-2">
        <AreaLegend />
      </div>
      <div className="mt-3">
        <AreaChart points={points} dip={dip} />
      </div>
      {dip?.stayedInvested && (
        <p className="mt-2 text-sm text-ink-muted">
          Week of {dateLabel(dip.date, { short: true })} was a down week, and you stayed invested.
        </p>
      )}
    </Card>
  );
}

function MoneyCard({ state }: { state: State }) {
  const { total, slices } = allocation(state);
  return (
    <Card pad="md" aria-labelledby="where-title" className="h-full">
      <h2 id="where-title" className={cardTitle}>
        Where your money is
      </h2>
      <div className="mt-4">
        <Donut total={total} slices={slices} />
      </div>
      <p className="mt-4 rounded-card-sm bg-surface2 px-4 py-3 text-sm text-ink">
        {splitLine(state)}
        <span className="block text-xs text-ink-muted">Cushion / grow, in %. Cushion means liquid funds.</span>
      </p>
    </Card>
  );
}

// ---------- plan health, SIPs, goals ----------
const HEALTH_PILL: Record<HealthStatus, { tone: PillTone; icon: IconName }> = {
  good: { tone: 'good', icon: 'check' },
  watch: { tone: 'watch', icon: 'caution' },
  todo: { tone: 'neutral', icon: 'info' },
};

function HealthCard({ state }: { state: State }) {
  return (
    <Card pad="md" aria-labelledby="health-title">
      <h2 id="health-title" className={cardTitle}>
        Plan health
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {planHealth(state).map((c) => {
          const link = healthLink(c, state);
          const pill = HEALTH_PILL[c.status];
          return (
            <li key={c.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{c.label}</p>
                <StatusPill tone={pill.tone} icon={pill.icon}>
                  {STATUS_TEXT[c.status]}
                </StatusPill>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{c.detail}</p>
              <Link to={link.to} className={textLink}>
                {link.label} <Icon name="chevronRight" size={16} />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const MONTH_PILL: Record<MonthSipStatus, { tone: PillTone; icon: IconName; text: string }> = {
  done: { tone: 'good', icon: 'check', text: 'Done' },
  upcoming: { tone: 'neutral', icon: 'calendar', text: 'Upcoming' },
  skipped: { tone: 'neutral', icon: 'skip', text: 'Skipped' },
  paused: { tone: 'watch', icon: 'pause', text: 'Paused' },
};

function SipsCard({ state }: { state: State }) {
  const rows = monthSips(state);
  const month = dateLabel(simToday(state.market)).split(' ').slice(1).join(' ');
  return (
    <Card pad="md" aria-labelledby="month-title">
      <h2 id="month-title" className={cardTitle}>
        This month’s <Term id="sip">SIPs</Term>
      </h2>
      <p className="text-sm text-ink-muted">{month}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-base text-ink-muted">No SIP dates this month.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => {
            const pill = MONTH_PILL[r.status];
            return (
              <li key={r.key}>
                <Link to={`/portfolio/sip/${r.sipId}`} className="flex min-h-tap items-center gap-3 rounded-card-sm bg-surface2 px-3 py-2 transition hover:brightness-[0.98]">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-card-sm bg-surface text-ink">
                    <span className="text-base font-bold leading-none">{dateLabel(r.date, { short: true }).split(' ')[0]}</span>
                    <span className="text-xs">{dateLabel(r.date, { short: true }).split(' ')[1]}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold tabular-nums text-ink">{formatINR(r.amount)}</span>
                    <span className="block truncate text-sm text-ink-muted">{getFund(r.fundId)?.name}</span>
                  </span>
                  <StatusPill tone={pill.tone} icon={pill.icon}>
                    {pill.text}
                  </StatusPill>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-muted">Skip any month, free. Nothing resets.</p>
    </Card>
  );
}

function GoalsCard({ state }: { state: State }) {
  const today = simToday(state.market);
  return (
    <Card pad="md" aria-labelledby="goals-title">
      <h2 id="goals-title" className={cardTitle}>
        Goals
      </h2>
      {state.goals.length === 0 ? (
        <p className="mt-3 text-base text-ink-muted">No goals yet. You’ll be able to set one here soon.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {state.goals.map((g) => {
            const value = goalValue(state, g);
            const { pct } = goalProgress(g.target, value);
            const needed = monthlyNeeded(g, value, today);
            return (
              <li key={g.id} className="rounded-card-sm bg-surface2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-ink">{g.name}</p>
                  <p className="text-sm tabular-nums text-ink-muted">{Math.round(pct)}%</p>
                </div>
                <p className="mt-1 text-sm tabular-nums text-ink">
                  {formatINR(value)} of {formatINR(g.target)} · by {dateLabel(g.byDate, { short: true })}
                </p>
                <ProgressBar className="mt-2" value={Math.round(pct)} label={`${g.name}: ${Math.round(pct)}% of target`} />
                <p className="mt-2 text-sm text-ink">
                  {needed === null
                    ? 'The date has passed. Pick a new one to keep tracking it.'
                    : needed === 0
                      ? 'Target reached.'
                      : `${formatINR(needed)}/month needed`}
                  {needed !== null && needed > 0 && <span className="block text-xs text-ink-muted">{WITHOUT_RETURNS}</span>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------- recent activity ----------
const ACTIVITY_ICON: Record<string, IconName> = {
  Done: 'check',
  Skipped: 'skip',
  Paused: 'pause',
  Resumed: 'play',
  Stopped: 'close',
  Changed: 'info',
  Withdrawn: 'arrowDown',
  New: 'star',
};

function ActivityPill({ row }: { row: ActivityRow }) {
  return (
    <StatusPill tone={row.tone} icon={ACTIVITY_ICON[row.status] ?? 'info'}>
      {row.status}
    </StatusPill>
  );
}

function ActivityCard({ state }: { state: State }) {
  const [all, setAll] = useState(false);
  const rows = activityRows(state);
  const shown = all ? rows : rows.slice(0, ACTIVITY_PREVIEW);
  return (
    <Card pad="md" aria-labelledby="activity-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="activity-title" className={cardTitle}>
          Recent activity
        </h2>
        {rows.length > ACTIVITY_PREVIEW && (
          <Button variant="quiet" onClick={() => setAll(!all)} aria-expanded={all} aria-controls="activity-list">
            {all ? 'Show fewer' : `See all (${rows.length})`}
          </Button>
        )}
      </div>
      <div id="activity-list">
        {/* Phone and tablet: a simple list. */}
        <ul className="mt-2 divide-y divide-border lg:hidden">
          {shown.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{r.what}</p>
                <p className="truncate text-sm text-ink-muted">
                  {dateLabel(r.date, { short: true })}
                  {r.asset ? ` · ${r.asset}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {r.amount !== undefined && <span className="font-semibold tabular-nums text-ink">{formatINR(r.amount)}</span>}
                <ActivityPill row={r} />
              </div>
            </li>
          ))}
        </ul>
        {/* Desktop: a table, as in design-refs/01. */}
        <table className="mt-3 hidden w-full text-left text-sm lg:table">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Date</th>
              <th scope="col" className="py-2 pr-4 font-medium">What happened</th>
              <th scope="col" className="py-2 pr-4 font-medium">Fund or stock</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Amount</th>
              <th scope="col" className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap py-3 pr-4 text-ink-muted">{dateLabel(r.date)}</td>
                <td className="py-3 pr-4 font-medium text-ink">{r.what}</td>
                <td className="py-3 pr-4 text-ink">{r.asset ?? '—'}</td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums text-ink">{r.amount !== undefined ? formatINR(r.amount) : '—'}</td>
                <td className="py-3">
                  <ActivityPill row={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------- empty state ----------
function EmptyDashboard({ state }: { state: State }) {
  const step = nextStep(state);
  const block = 'rounded-card bg-surface2';
  return (
    <div className="space-y-6">
      <Header />
      <div className="relative">
        <div aria-hidden className="grid grid-cols-1 gap-4 opacity-60 lg:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4 lg:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${block} h-36`} />
            ))}
          </div>
          <div className={`${block} h-64 lg:col-span-7`} />
          <div className={`${block} hidden h-64 lg:col-span-5 lg:block`} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="max-w-md rounded-card-lg border border-border bg-surface p-6 text-center shadow-lg">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint text-brand-text">
              <Icon name="dashboard" size={24} />
            </span>
            <h2 className="mt-3 text-xl font-bold text-ink">Your dashboard fills in after your first investment</h2>
            <p className="mt-2 text-base text-ink-muted">Your value, your plan’s health and your SIPs will all show here.</p>
            <ButtonLink to={step.to} className="mt-4">
              {step.cta}
            </ButtonLink>
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}

export function Dashboard() {
  const { state } = useStore();
  const [period, setPeriod] = useState<Period>('12w');
  if (!hasDashboardData(state)) return <EmptyDashboard state={state} />;
  return (
    <div className="space-y-5 lg:space-y-6">
      <Header period={period} onPeriod={setPeriod} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:order-1 lg:col-span-12">
          <Tiles state={state} period={period} />
        </div>
        <div className="lg:order-8 lg:col-span-12">
          <InsightBanner state={state} />
        </div>
        <div className="lg:order-2 lg:col-span-7">
          <ValueCard state={state} period={period} />
        </div>
        <div className="lg:order-3 lg:col-span-5">
          <MoneyCard state={state} />
        </div>
        <div className="lg:order-4 lg:col-span-4">
          <HealthCard state={state} />
        </div>
        <div className="lg:order-6 lg:col-span-4">
          <SipsCard state={state} />
        </div>
        <div className="lg:order-5 lg:col-span-4">
          <GoalsCard state={state} />
        </div>
        <div className="lg:order-7 lg:col-span-12">
          <ActivityCard state={state} />
        </div>
        <Disclaimer className="lg:order-9 lg:col-span-12" />
      </div>
    </div>
  );
}
