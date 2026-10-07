// Starter plan summary: Home card and the desktop sidebar "Your plan" card.
import { getFund } from '../data/funds';
import { dateLabel, formatINR } from '../lib/format';
import { upcomingSips } from '../lib/nextStep';
import { buildPath } from '../lib/routes';
import { Link } from '../router';
import type { State } from '../state/types';
import { ButtonLink } from './Button';
import { SplitBar } from './SplitBar';

export function PlanSummaryCard({ state, compact = false }: { state: State; compact?: boolean }) {
  const plan = state.plan;
  const next = upcomingSips(state)[0];

  if (!plan) {
    const to = state.user.signedUp ? '/checkin/1' : buildPath('/signup', { next: '/checkin/1' });
    return (
      <section aria-label="Your plan" className={`rounded-card bg-mint ${compact ? 'p-4' : 'p-5'}`}>
        <h2 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-ink`}>Your plan</h2>
        <p className="mt-1 text-sm text-ink">No plan yet. Six questions get you a starter shortlist.</p>
        <Link to={to} className="mt-2 inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
          Take the check-in
        </Link>
      </section>
    );
  }

  if (compact) {
    return (
      <section aria-label="Your plan" className="rounded-card bg-mint p-4">
        <h2 className="text-sm font-semibold text-ink">Your plan</h2>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
          {formatINR(plan.monthly)}
          <span className="text-sm font-medium text-ink-muted"> /month</span>
        </p>
        <div className="mt-3">
          <SplitBar plan={plan} size="sm" />
        </div>
        <p className="mt-3 text-sm text-ink">
          {next ? (
            <>
              Next SIP: <span className="font-semibold">{dateLabel(next.date, { short: true })}</span>
            </>
          ) : (
            'No SIP running yet'
          )}
        </p>
        <Link to="/plan" className="mt-1 inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
          View plan
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="plan-card-title" className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="plan-card-title" className="text-lg font-semibold text-ink">
            Your starter plan
          </h2>
          <p className="text-sm text-ink-muted">{plan.label}</p>
        </div>
        <p className="text-right text-2xl font-bold tabular-nums text-ink">
          {formatINR(plan.monthly)}
          <span className="block text-sm font-medium text-ink-muted">a month</span>
        </p>
      </div>
      <div className="mt-4">
        <SplitBar plan={plan} />
      </div>
      <ul className="mt-4 space-y-2">
        {plan.buckets.map((b) => (
          <li key={b.role} className="flex items-center justify-between gap-3 rounded-card-sm bg-surface2 px-4 py-3 text-sm">
            <span>
              <span className="block font-semibold text-ink">{getFund(b.fundId)?.name}</span>
              <span className="text-ink-muted">{b.role === 'cushion' ? 'Cushion' : 'Grow'}</span>
            </span>
            <span className="font-semibold tabular-nums text-ink">{formatINR(b.amount)}</span>
          </li>
        ))}
      </ul>
      <ButtonLink to="/plan" variant="secondary" className="mt-4">
        View plan
      </ButtonLink>
    </section>
  );
}
