// The user's own gain or loss (Stage 6a rule): up is green with ▲, down is a
// soft rose with ▼, both with a sign and a spoken word (never colour alone).
// Never alarm red: marketDown is for Pro market prices only.
import { formatSigned } from '../lib/format';
import { changeDirection, type Change } from '../lib/market';

export const OWN_CHANGE_TONE = { up: 'text-brand-text', down: 'text-own-down', flat: 'text-ink' } as const;
export const OWN_CHANGE_MARK = { up: '▲', down: '▼', flat: '' } as const;

export function ChangeText({ change, className = '' }: { change: Change; className?: string }) {
  const dir = changeDirection(change);
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${OWN_CHANGE_TONE[dir]} ${className}`}>
      {dir !== 'flat' && (
        <span aria-hidden className="text-[0.8em] leading-none">
          {OWN_CHANGE_MARK[dir]}
        </span>
      )}
      {formatSigned(change.amount)} ({formatSigned(change.pct, 'pct')})
      <span className="sr-only">{dir === 'flat' ? ', no change' : dir === 'down' ? ', down' : ', up'}</span>
    </span>
  );
}
