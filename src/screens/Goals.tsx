// S22 Goals list and S23 Goal detail (README 8.8, 9 item 15, PLAN items 34).
// Monthly needed is always "without counting returns". No projections, no
// comparison with others, never red when behind.
import { useState } from 'react';
import { BackLink } from '../components/BackLink';
import { BottomSheet } from '../components/BottomSheet';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { EmptyState } from '../components/EmptyState';
import { GoalFormSheet } from '../components/GoalFormSheet';
import { GoalRow } from '../components/GoalRow';
import { Icon } from '../components/Icon';
import { Note } from '../components/Note';
import { ProgressBar } from '../components/ProgressBar';
import { SipStatusPill } from '../components/StatusPill';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getFund } from '../data/funds';
import { dateLabel, formatINR, ordinal } from '../lib/format';
import { goalSummary, linkableSips, STEADIER_FUNDS_ROUTE, WITHOUT_RETURNS } from '../lib/goals';
import { simToday } from '../lib/market';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';

export function Goals() {
  const { state } = useStore();
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink fallback="/portfolio">Portfolio</BackLink>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Goals</h1>
          <p className="mt-1 text-base text-ink-muted">Name what you’re saving for. We show what a month takes, without counting returns.</p>
        </div>
        {state.goals.length > 0 && (
          <Button onClick={() => setCreating(true)} aria-haspopup="dialog">
            <Icon name="plus" size={20} /> Create a goal
          </Button>
        )}
      </header>
      {state.goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          body="A laptop, a trip, course fees or an emergency cushion. Pick one and see what it takes each month."
          action={
            <Button className="mt-2" onClick={() => setCreating(true)} aria-haspopup="dialog">
              Create a goal
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {state.goals.map((g) => (
            <li key={g.id}>
              <GoalRow goal={g} state={state} tone="surface" />
            </li>
          ))}
        </ul>
      )}
      <Disclaimer />
      <GoalFormSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(id) => {
          toast.show('Goal created.');
          navigate(`/portfolio/goal/${id}`);
        }}
      />
    </div>
  );
}

type Sheet = 'edit' | 'date' | 'link' | 'delete' | null;

export function GoalDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [keep, setKeep] = useState(false);
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return null;
  const today = simToday(state.market);
  const s = goalSummary(state, goal, today);
  const pct = Math.round(s.pct);
  const past = s.warnings.some((w) => w.kind === 'past_date');
  const activeLinked = s.linkedSips.filter((x) => x.status === 'active');
  const bump = activeLinked[0];
  const bumpTo = bump ? bump.amount + s.shortfall : 0;
  const canBump = !!bump && s.shortfall > 0 && bumpTo <= 100_000;
  const linkable = linkableSips(state, goal);

  const increase = () => {
    if (!bump) return;
    const before = bump.amount;
    dispatch({ type: 'editSip', sipId: bump.id, amount: bumpTo });
    toast.show(`SIP is now ${formatINR(bumpTo)} a month.`, { undo: () => dispatch({ type: 'editSip', sipId: bump.id, amount: before }) });
  };

  const link = (sipId: string) => {
    dispatch({ type: 'linkSipToGoal', sipId, goalId: goal.id });
    setSheet(null);
    toast.show(`Linked. It now counts toward ${goal.name}.`);
  };

  const remove = () => {
    navigate('/portfolio/goals', { replace: true });
    dispatch({ type: 'deleteGoal', goalId: goal.id });
    toast.show('Goal deleted. Your SIPs keep running.');
  };

  let primary: { label: string; onClick: () => void };
  if (past) primary = { label: 'Pick a new date', onClick: () => setSheet('date') };
  else if (s.linkedSips.length === 0) primary = { label: 'Link a SIP', onClick: () => setSheet('link') };
  else if (canBump && !keep) primary = { label: `Increase SIP to ${formatINR(bumpTo)}`, onClick: increase };
  else primary = { label: 'Done', onClick: () => navigate('/portfolio/goals') };
  const primaryButton =
    primary.label === 'Link a SIP' && linkable.length === 0 ? (
      <ButtonLink to="/explore/funds" block>
        Find a fund
      </ButtonLink>
    ) : (
      <Button block onClick={primary.onClick}>
        {primary.label}
      </Button>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-8">
        <BackLink fallback="/portfolio/goals">Goals</BackLink>
        <header>
          <h1 className="text-3xl font-bold text-ink">{goal.name}</h1>
          <p className="mt-1 text-base text-ink-muted">
            {formatINR(goal.target)} by {dateLabel(goal.byDate)}
            {goal.isCushion ? ' · your emergency cushion' : ''}
          </p>
        </header>

        {s.warnings.map((w) => (
          <Note key={w.kind} tone="caution">
            <p>{w.text}</p>
            {w.kind === 'short_equity' ? (
              <>
                <p className="mt-1">Money you need within a year is safer in a steadier fund.</p>
                <Link to={STEADIER_FUNDS_ROUTE} className="mt-1 inline-flex min-h-tap items-center gap-1 font-semibold text-brand-text underline-offset-4 hover:underline">
                  {w.action} <Icon name="chevronRight" size={16} />
                </Link>
              </>
            ) : (
              <button type="button" onClick={() => setSheet('date')} className="mt-1 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
                Update the date
              </button>
            )}
          </Note>
        ))}

        <Card pad="lg" aria-labelledby="goal-progress">
          <div className="flex items-center justify-between gap-3">
            <h2 id="goal-progress" className="text-lg font-semibold text-ink">
              Progress
            </h2>
            <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-ink-muted">Illustrative values</span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tabular-nums text-ink">{formatINR(s.value)}</p>
          <p className="mt-1 text-base tabular-nums text-ink-muted">
            of {formatINR(goal.target)} · {pct}%
          </p>
          <ProgressBar className="mt-3" value={pct} label={`${goal.name}: ${pct}% of target`} />
          <p className="mt-3 text-sm text-ink-muted">Counts the value of the funds behind your linked SIPs.</p>
        </Card>

        <Card pad="lg" tint="mint" aria-labelledby="goal-month">
          <h2 id="goal-month" className="text-lg font-semibold text-ink">
            Each month
          </h2>
          {s.needed === null ? (
            <p className="mt-2 text-base text-ink">The date has passed, so there’s no monthly amount. Pick a new date to keep tracking it.</p>
          ) : s.needed === 0 ? (
            <p className="mt-2 text-base text-ink">Target reached. Nothing more needed.</p>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                {formatINR(s.needed)}/month needed, without counting returns
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatINR(Math.max(0, goal.target - s.value))} to go over {s.monthsLeft} month{s.monthsLeft === 1 ? '' : 's'}. {WITHOUT_RETURNS}: real values can go up or down.
              </p>
            </>
          )}
          {s.needed !== null && s.needed > 0 && (
            <p className="mt-3 text-base text-ink">
              {s.linkedSips.length === 0
                ? 'No SIP counts toward this goal yet.'
                : s.shortfall > 0
                  ? `Your linked SIPs put in ${formatINR(s.linkedTotal)} a month: ${formatINR(s.shortfall)} short.`
                  : `Your linked SIPs put in ${formatINR(s.linkedTotal)} a month. That covers it.`}
            </p>
          )}
          {s.shortfall > 0 && s.linkedSips.length > 0 && !keep && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Ways to close the gap">
              {!canBump && <p className="w-full text-sm text-ink-muted">Start or resume a linked SIP to raise the monthly amount.</p>}
              <Button variant="secondary" onClick={() => setSheet('date')} aria-haspopup="dialog">
                Extend date
              </Button>
              <Button variant="quiet" onClick={() => setKeep(true)}>
                Keep as is
              </Button>
            </div>
          )}
          {keep && s.shortfall > 0 && <p className="mt-3 text-sm text-ink-muted">Kept as is. Any amount still moves you forward.</p>}
          {/* Phone and tablet: the next step sits here, not after the disclaimer. */}
          <div className="mt-4 lg:hidden">{primaryButton}</div>
        </Card>

        <Card pad="lg" aria-labelledby="goal-sips">
          <h2 id="goal-sips" className="text-lg font-semibold text-ink">
            Linked <Term id="sip">SIPs</Term>
          </h2>
          {s.linkedSips.length === 0 ? (
            <p className="mt-2 text-base text-ink-muted">None yet. Linking a SIP counts its fund toward this goal.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {s.linkedSips.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-card-sm bg-surface2 p-3">
                  <Link to={`/portfolio/sip/${x.id}`} className="flex min-h-tap min-w-0 flex-1 items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{getFund(x.fundId)?.name}</span>
                      <span className="block text-sm text-ink-muted">
                        {formatINR(x.amount)} on the {ordinal(x.dayOfMonth)}
                      </span>
                    </span>
                    <SipStatusPill status={x.status} />
                  </Link>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      dispatch({ type: 'linkSipToGoal', sipId: x.id, goalId: null });
                      toast.show('Unlinked. The SIP keeps running.');
                    }}
                  >
                    Unlink<span className="sr-only"> {getFund(x.fundId)?.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {s.linkedSips.length > 0 && linkable.length > 0 && (
            <Button variant="secondary" className="mt-3" onClick={() => setSheet('link')} aria-haspopup="dialog">
              Link another SIP
            </Button>
          )}
          {linkable.length === 0 && s.linkedSips.length === 0 && (
            <p className="mt-2 text-sm text-ink-muted">
              You have no running SIP to link.{' '}
              <Link to="/explore/funds" className="font-semibold text-brand-text underline-offset-4 hover:underline">
                Find a fund
              </Link>
            </p>
          )}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSheet('edit')} aria-haspopup="dialog">
            Edit goal
          </Button>
          <Button variant="quiet" onClick={() => setSheet('delete')} aria-haspopup="dialog">
            Delete goal
          </Button>
        </div>
        <Disclaimer />
      </div>

      <aside className="hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <Card pad="lg" className="lg:sticky lg:top-24" aria-label="Next step">
          <p className="mb-3 text-sm text-ink-muted">By {dateLabel(goal.byDate, { short: true })}</p>
          {primaryButton}
        </Card>
      </aside>

      <GoalFormSheet open={sheet === 'edit'} goal={goal} onClose={() => setSheet(null)} onSaved={() => toast.show('Goal updated.')} />
      <GoalFormSheet open={sheet === 'date'} goal={goal} dateOnly onClose={() => setSheet(null)} onSaved={() => toast.show('New date saved.')} />

      <BottomSheet open={sheet === 'link'} onClose={() => setSheet(null)} title="Link a SIP">
        <p className="text-base text-ink-muted">Its fund’s value counts toward {goal.name}. A fund can back one goal at a time.</p>
        <ul className="mt-4 space-y-2">
          {linkable.map((x) => {
            const other = x.goalId ? state.goals.find((g) => g.id === x.goalId)?.name : undefined;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => link(x.id)}
                  className="flex min-h-[56px] w-full items-center gap-3 rounded-card-sm border border-border bg-surface p-3 text-left hover:bg-surface2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{getFund(x.fundId)?.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {formatINR(x.amount)}/month{other ? ` · now counts toward ${other}` : ''}
                    </span>
                  </span>
                  <Icon name="plus" size={20} className="shrink-0 text-brand-text" />
                </button>
              </li>
            );
          })}
        </ul>
        {linkable.length === 0 && <p className="mt-4 text-base text-ink">No running SIP to link.</p>}
      </BottomSheet>

      <BottomSheet open={sheet === 'delete'} onClose={() => setSheet(null)} title="Delete this goal?">
        <p className="text-base text-ink">Your SIPs and money stay as they are. Only the goal goes.</p>
        <div className="mt-5 flex flex-col gap-3">
          <Button variant="secondary" block onClick={remove}>
            Delete goal
          </Button>
          <Button variant="quiet" block onClick={() => setSheet(null)}>
            Keep it
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
