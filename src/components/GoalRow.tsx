// Goal progress row (README 9 item 21 "progress rows like design-refs/01",
// PLAN ProgressRow). Used on the Dashboard, Portfolio and the Goals list.
// Monthly needed is always labelled "Without counting returns". Never red.
import { dateLabel, formatINR } from '../lib/format';
import { goalSummary, WITHOUT_RETURNS } from '../lib/goals';
import { simToday } from '../lib/market';
import { Link } from '../router';
import type { Goal, State } from '../state/types';
import { Icon } from './Icon';
import { GoalRing } from './GoalRing';

export function goalNeedText(needed: number | null): string {
  if (needed === null) return 'The date has passed. Pick a new one to keep tracking it.';
  if (needed === 0) return 'Target reached.';
  return `${formatINR(needed)}/month needed`;
}

export function GoalRow({ goal, state, tone = 'surface2' }: { goal: Goal; state: State; tone?: 'surface' | 'surface2' }) {
  const s = goalSummary(state, goal, simToday(state.market));
  const pct = Math.round(s.pct);
  const needsLook = s.warnings.length > 0;
  return (
    <Link
      to={`/portfolio/goal/${goal.id}`}
      className={`block rounded-card-sm p-4 transition hover:brightness-[0.98] ${tone === 'surface' ? 'border border-border bg-surface' : 'bg-surface2'}`}
    >
      <span className="flex items-center gap-3">
        <GoalRing pct={s.pct} label={`${goal.name}: ${pct}% of target`} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-ink">
              <span className="truncate">{goal.name}</span>
              {goal.isCushion && <span className="shrink-0 rounded-full bg-sky px-2 py-0.5 text-xs font-medium text-ink">Emergency fund</span>}
            </span>
            <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
          </span>
          <span className="mt-1 block text-sm tabular-nums text-ink">
            {formatINR(s.value)} of {formatINR(goal.target)} · by {dateLabel(goal.byDate, { short: true })}
          </span>
        </span>
      </span>
      <span className="mt-2 block text-sm text-ink">
        {goalNeedText(s.needed)}
        {s.needed !== null && s.needed > 0 && <span className="block text-xs text-ink-muted">{WITHOUT_RETURNS}</span>}
      </span>
      {needsLook && (
        <span className="mt-2 flex items-center gap-1 text-sm font-medium text-caution">
          <Icon name="caution" size={16} /> Needs a look
        </span>
      )}
    </Link>
  );
}
