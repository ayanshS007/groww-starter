// Market price change, Pro view only (README 9 item 22): conventional green/red
// with +/− signs and an arrow. Never used for the user's own money.
import { formatSigned, keepSignsTogether } from '../lib/format';
import type { MarketChange as Change } from '../lib/proView';
import { Icon } from './Icon';

export function MarketChange({ change, decimals = 2, className = '' }: { change: Change; decimals?: number; className?: string }) {
  const flat = Math.abs(change.pct) < 0.005;
  const up = change.amount > 0;
  const tone = flat ? 'text-ink-muted' : up ? 'text-market-up' : 'text-market-down';
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${tone} ${className}`}>
      {!flat && <Icon name={up ? 'arrowUp' : 'arrowDown'} size={14} />}
      {keepSignsTogether(`${formatSigned(change.amount, 'inr', decimals)} (${formatSigned(change.pct, 'pct', 2)})`)}
      <span className="sr-only">{flat ? ', no change' : up ? ', up' : ', down'}</span>
    </span>
  );
}
