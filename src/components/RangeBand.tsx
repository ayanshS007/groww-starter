// Illustrative 1-year range band (README 9 item 8). A bar from the low to the
// high end with a zero tick. Always labelled sample data; never a promise.
import { formatSigned } from '../lib/format';

type Props = { low: number; high: number; className?: string };

export function RangeBand({ low, high, className = '' }: Props) {
  const min = Math.floor((Math.min(low, 0) - 5) / 5) * 5;
  const max = Math.ceil((Math.max(high, 0) + 5) / 5) * 5;
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <figure className={className}>
      <div className="relative h-4 rounded-full bg-surface2" aria-hidden>
        <div
          className="absolute inset-y-0 rounded-full bg-brand/60"
          style={{ left: `${pos(low)}%`, width: `${Math.max(2, pos(high) - pos(low))}%` }}
        />
        <div className="absolute inset-y-[-3px] w-0.5 bg-ink/50" style={{ left: `${pos(0)}%` }} />
      </div>
      <figcaption className="mt-2 text-sm">
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-ink-muted">Low end</span>
            <span className="font-semibold tabular-nums text-ink">{formatSigned(low, 'pct', 0)}</span>
          </span>
          <span className="text-right">
            <span className="block text-ink-muted">High end</span>
            <span className="font-semibold tabular-nums text-ink">{formatSigned(high, 'pct', 0)}</span>
          </span>
        </span>
        <span className="mt-2 block text-xs text-ink-muted">The tick marks 0%.</span>
      </figcaption>
    </figure>
  );
}
