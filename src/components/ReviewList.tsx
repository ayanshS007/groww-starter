// Invest review (README 9 item 9): one or two buckets, key risk, one required
// checkbox that is never pre-ticked.
import { getFund } from '../data/funds';
import { formatINR } from '../lib/format';
import { scheduleLine, type ReviewRow } from '../lib/invest';
import { ROLE_LABEL } from '../lib/planner';
import { Icon } from './Icon';
import { LetterAvatar } from './LetterAvatar';
import { RiskMeter } from './RiskMeter';

type Props = {
  rows: ReviewRow[];
  monthly: boolean;
  day?: number;
  acked: boolean;
  onAck: (v: boolean) => void;
  onChangeAmount?: () => void;
  onChangeDate?: () => void;
};

const link = 'inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline';

export function ReviewList({ rows, monthly, day, acked, onAck, onChangeAmount, onChangeDate }: Props) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const funds = rows.map((r) => getFund(r.fundId)!).filter(Boolean);
  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {rows.map((r) => {
          const fund = getFund(r.fundId)!;
          return (
            <li key={r.fundId} className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <LetterAvatar name={fund.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{fund.name}</p>
                  {r.role && <p className="text-sm text-ink-muted">{ROLE_LABEL[r.role]} part of your plan</p>}
                </div>
                <p className="text-right text-lg font-bold tabular-nums text-ink">
                  {formatINR(r.amount)}
                  <span className="block text-xs font-medium text-ink-muted">{monthly ? 'a month' : 'one time'}</span>
                </p>
              </div>
              <RiskMeter risk={fund.risk} className="mt-3" />
              <p className="mt-2 text-sm text-ink">
                <span className="font-semibold">Main risk: </span>
                {fund.mainRisk}
              </p>
            </li>
          );
        })}
      </ul>

      <dl className="divide-y divide-border rounded-card border border-border bg-surface text-sm">
        {rows.length > 1 && (
          <div className="flex items-center justify-between gap-3 p-4">
            <dt className="text-ink-muted">{monthly ? 'Total each month' : 'Total'}</dt>
            <dd className="font-bold tabular-nums text-ink">{formatINR(total)}</dd>
          </div>
        )}
        {monthly && day !== undefined && (
          <div className="flex items-center justify-between gap-3 p-4">
            <dt className="text-ink-muted">SIP date</dt>
            <dd className="flex items-center gap-3 font-semibold text-ink">
              {scheduleLine(day)}
              {onChangeDate && (
                <button type="button" onClick={onChangeDate} className={link}>
                  Change<span className="sr-only"> date</span>
                </button>
              )}
            </dd>
          </div>
        )}
        {onChangeAmount && (
          <div className="flex items-center justify-between gap-3 p-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd>
              <button type="button" onClick={onChangeAmount} className={link}>
                Change<span className="sr-only"> amount</span>
              </button>
            </dd>
          </div>
        )}
      </dl>

      <label
        className={`flex min-h-[56px] cursor-pointer items-start gap-3 rounded-card-sm border-2 p-4 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus ${
          acked ? 'border-brand bg-mint' : 'border-border bg-surface'
        }`}
      >
        <input type="checkbox" className="sr-only" checked={acked} onChange={(e) => onAck(e.target.checked)} />
        <span
          aria-hidden
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
            acked ? 'border-brand bg-brand text-on-brand' : 'border-ink-muted'
          }`}
        >
          {acked && <Icon name="check" size={16} strokeWidth={3} />}
        </span>
        <span className="text-base text-ink">
          {funds.length === 1
            ? `I understand the main risk: ${funds[0].mainRisk}`
            : 'I understand the main risk of each fund above.'}
        </span>
      </label>
    </div>
  );
}
