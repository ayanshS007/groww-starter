// Fund list row (README 9 item 7): risk label and illustrative 1-year return.
// The whole row is the link. Never sorted or framed by returns.
import { formatSigned, formatINR } from '../lib/format';
import type { From } from '../lib/explore';
import { Link } from '../router';
import type { Fund } from '../state/types';
import { Icon } from './Icon';
import { LetterAvatar } from './LetterAvatar';
import { RiskMeter } from './RiskMeter';

const tag = 'rounded-full px-2.5 py-0.5 text-xs font-semibold text-ink';

type Props = { fund: Fund; inPlan: boolean; saved: boolean; from: From; dense?: boolean };

export function FundRow({ fund, inPlan, saved, from, dense = false }: Props) {
  if (dense) return <DenseFundRow fund={fund} inPlan={inPlan} saved={saved} from={from} />;
  return (
    <Link
      to={`/fund/${fund.id}?from=${from}`}
      className="block rounded-card border border-border bg-surface p-4 transition hover:bg-surface2 lg:p-5"
    >
      <span className="flex items-start gap-3">
        <LetterAvatar name={fund.name} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold text-ink">{fund.name}</span>
            {inPlan && <span className={`${tag} bg-mint`}>In your plan</span>}
            {saved && (
              <span className={`${tag} inline-flex items-center gap-1 bg-lavender`}>
                <Icon name="bookmark" size={12} />
                Saved
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {fund.category} fund · from {formatINR(fund.minSip)} a month
          </span>
        </span>
        <Icon name="chevronRight" className="mt-2 shrink-0 text-ink-muted" />
      </span>
      <span className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pl-14">
        <RiskMeter risk={fund.risk} />
        <span className="text-sm text-ink-muted">
          1-yr sample return{' '}
          <span className="font-semibold tabular-nums text-ink">{formatSigned(fund.illustrativeReturns.y1, 'pct')}</span>
          <span className="sr-only"> (illustrative)</span>
          <span aria-hidden> · illustrative</span>
        </span>
      </span>
    </Link>
  );
}

const RETURN_COLS = [
  ['y1', '1Y'],
  ['y3', '3Y'],
  ['y5', '5Y'],
] as const;

/**
 * Pro view row (README 9, Starter vs Pro): denser, with expense ratio and
 * 1/3/5-yr illustrative returns. Data order, never sorted by returns.
 */
function DenseFundRow({ fund, inPlan, saved, from }: Omit<Props, 'dense'>) {
  const cell = 'flex flex-col text-right';
  return (
    <Link
      to={`/fund/${fund.id}?from=${from}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card-sm border border-border bg-surface px-4 py-3 transition hover:bg-surface2"
    >
      <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
        <LetterAvatar name={fund.name} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{fund.name}</span>
          <span className="block text-xs text-ink-muted">
            {fund.category} · risk {fund.risk} of 5{inPlan ? ' · In your plan' : ''}
            {saved ? ' · Saved' : ''}
          </span>
        </span>
      </span>
      <span className="grid flex-1 basis-64 grid-cols-4 gap-2 text-sm">
        <span className={cell}>
          <span className="text-xs text-ink-muted">Expense</span>
          <span className="font-semibold tabular-nums text-ink">{fund.expenseRatio.toFixed(2)}%</span>
        </span>
        {RETURN_COLS.map(([k, label]) => (
          <span key={k} className={cell}>
            <span className="text-xs text-ink-muted">
              {label}
              <span className="sr-only"> illustrative sample return</span>
            </span>
            <span className="font-semibold tabular-nums text-ink">{formatSigned(fund.illustrativeReturns[k], 'pct')}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}
