// "Where your money is" donut (design-refs/01, 02): centre total, legend with
// ₹ and %, 2 px gaps between segments. Identity is in the legend text, never
// colour alone.
import type { AllocationId, AllocationSlice } from '../lib/dashboard';
import { formatINR } from '../lib/format';

const STROKE: Record<AllocationId, string> = {
  cushion: 'stroke-chart-cushion',
  grow: 'stroke-chart-grow',
  stocks: 'stroke-chart-stocks',
  gold: 'stroke-chart-gold',
};

export const SWATCH: Record<AllocationId, string> = {
  cushion: 'bg-chart-cushion',
  grow: 'bg-chart-grow',
  stocks: 'bg-chart-stocks',
  gold: 'bg-chart-gold',
};

const SIZE = 176;
const R = 68;
const W = 22;
const C = 2 * Math.PI * R;

export function Donut({ total, slices }: { total: number; slices: AllocationSlice[] }) {
  const shown = slices.filter((s) => s.pct >= 0.05);
  const gap = shown.length > 1 ? 3 : 0;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch 2xl:flex-row 2xl:items-center">
      <div className="relative shrink-0 self-center" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" className="stroke-surface2" strokeWidth={W} />
          {shown.map((s) => {
            const len = (s.pct / 100) * C;
            const seg = (
              <circle
                key={s.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                className={STROKE[s.id]}
                strokeWidth={W}
                strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-extrabold tabular-nums text-ink">{formatINR(total)}</span>
          <span className="text-xs text-ink-muted">Total</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${SWATCH[s.id]} ${s.value <= 0 ? 'opacity-30' : ''}`} />
            <span className={`flex-1 whitespace-nowrap ${s.value > 0 ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">{formatINR(s.value)}</span>
            <span className="w-12 text-right tabular-nums text-ink-muted">{Math.round(s.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
