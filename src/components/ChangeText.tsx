// The user's own gain or loss. Never red: up is link green, down is amber, and
// both carry an arrow and a spoken word (never colour alone).
import { formatSigned } from '../lib/format';
import { changeDirection, type Change } from '../lib/market';
import { Icon } from './Icon';

export function ChangeText({ change, className = '' }: { change: Change; className?: string }) {
  const dir = changeDirection(change);
  const flat = dir === 'flat';
  const down = dir === 'down';
  const tone = flat ? 'text-ink' : down ? 'text-caution' : 'text-brand-text';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${tone} ${className}`}>
      {!flat && <Icon name={down ? 'arrowDown' : 'arrowUp'} size={16} />}
      {formatSigned(change.amount)} ({formatSigned(change.pct, 'pct')})
      <span className="sr-only">{flat ? ', no change' : down ? ', down' : ', up'}</span>
    </span>
  );
}
