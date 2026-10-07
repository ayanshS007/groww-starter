// Portfolio split bar. Labels with ₹ and % carry the meaning; fills are tints only.
import { formatINR } from '../lib/format';
import type { AssetSlice, SliceId } from '../lib/portfolio';

const FILL: Record<SliceId, string> = { cushion: 'bg-brand/35', goals: 'bg-chart-cushion/45', grow: 'bg-brand', stocks: 'bg-ink/45' };

export function AssetBar({ slices }: { slices: AssetSlice[] }) {
  if (slices.length === 0) return null;
  return (
    <div>
      <div aria-hidden className="flex h-3 w-full gap-1 overflow-hidden rounded-full">
        {slices.map((s) => (
          <div key={s.id} className={`h-full rounded-full ${FILL[s.id]}`} style={{ width: `${Math.max(s.pct, 2)}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {slices.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${FILL[s.id]}`} />
            <span className="text-ink-muted">{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">
              {formatINR(s.value)} · {Math.round(s.pct)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
