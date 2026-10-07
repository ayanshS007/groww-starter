// 52-week low–high bar (design-refs/05). The marker shows where today's sample
// price sits; the numbers are in the label for screen readers.
import { formatINR } from '../lib/format';

export function RangeBar52w({ low, high, pos, className = '' }: { low: number; high: number; pos: number; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, pos)) * 100);
  return (
    <div
      role="img"
      aria-label={`52-week range ${formatINR(low)} to ${formatINR(high)}; today is ${pct}% of the way from low to high`}
      className={`flex items-center gap-2 text-xs text-ink-muted ${className}`}
    >
      <span aria-hidden>L</span>
      <span aria-hidden className="relative h-1 flex-1 rounded-full bg-border">
        <span className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${pct}%` }} />
      </span>
      <span aria-hidden>H</span>
    </div>
  );
}
