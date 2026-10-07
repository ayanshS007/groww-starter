// "Value vs invested" (README 9 item 21, PLAN item 37). Hand-written SVG:
// invested as a dashed step line, value as a filled line from a zero baseline,
// a dot on every down week, "You stayed invested" on the latest dip.
// Hover, tap or arrow keys move a crosshair + tooltip. Never red.
import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ChartPoint } from '../lib/dashboard';
import { compactINR, dateLabel, formatINR, formatSigned } from '../lib/format';
import { useWidth } from './useWidth';

const H = 240;
const M = { top: 16, right: 16, bottom: 28, left: 48 };

function niceMax(n: number): number {
  if (n <= 0) return 1000;
  const mag = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s * 4 >= n) ?? 10 * mag;
  return step * 4;
}

export function AreaChart({ points, dip }: { points: ChartPoint[]; dip?: ChartPoint }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <p className="flex h-[160px] items-center justify-center rounded-card-sm bg-surface2 px-4 text-center text-sm text-ink-muted" ref={ref}>
        The chart fills in after your first full week invested.
      </p>
    );
  }

  const innerW = width - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const yMax = niceMax(Math.max(...points.map((p) => Math.max(p.value, p.invested))));
  const x = (i: number) => M.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => M.top + innerH - (v / yMax) * innerH;
  const base = y(0);

  const valueLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${valueLine} L${x(points.length - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`;
  const invested = points
    .map((p, i) => (i === 0 ? `M${x(0).toFixed(1)} ${y(p.invested).toFixed(1)}` : `H${x(i).toFixed(1)} V${y(p.invested).toFixed(1)}`))
    .join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);
  const xLabels = [...new Set([0, Math.round((points.length - 1) / 2), points.length - 1])];
  const dipIndex = dip ? points.findIndex((p) => p.week === dip.week) : -1;

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - M.left;
    setActive(Math.max(0, Math.min(points.length - 1, Math.round((px / innerW) * (points.length - 1)))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = points.length - 1;
    const cur = active ?? last;
    const next =
      e.key === 'ArrowLeft' ? Math.max(0, cur - 1) : e.key === 'ArrowRight' ? Math.min(last, cur + 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (next === null) {
      if (e.key === 'Escape') setActive(null);
      return;
    }
    e.preventDefault();
    setActive(next);
  };

  const a = active !== null ? points[active] : undefined;
  const tipLeft = a ? Math.min(Math.max(x(active!) - 90, 0), width - 180) : 0;
  const labelRight = dipIndex >= 0 && x(dipIndex) > width - 140;

  return (
    <div ref={ref} className="relative">
      <div
        tabIndex={0}
        role="group"
        aria-label="Value vs invested chart. Use left and right arrow keys to read each week."
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        className="rounded-card-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg width={width} height={H} aria-hidden onPointerMove={pick} onPointerDown={pick} onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)} className="block touch-pan-y">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                {compactINR(t)}
              </text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              className="fill-ink-muted text-[11px]"
            >
              {dateLabel(points[i].date, { short: true })}
            </text>
          ))}
          <path d={area} className="fill-brand/20" />
          <path d={valueLine} fill="none" className="stroke-brand-text" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={invested} fill="none" className="stroke-chart-invested" strokeWidth={2} strokeDasharray="5 4" />
          {a && <line x1={x(active!)} x2={x(active!)} y1={M.top} y2={base} className="stroke-ink-muted" strokeWidth={1} />}
          {points.map((p, i) =>
            p.down ? (
              <circle key={p.week} cx={x(i)} cy={y(p.value)} r={5} className="fill-caution-icon stroke-surface" strokeWidth={2} />
            ) : null,
          )}
          {a && <circle cx={x(active!)} cy={y(a.value)} r={5} className="fill-brand-text stroke-surface" strokeWidth={2} />}
        </svg>
      </div>

      {dip && dipIndex >= 0 && dip.stayedInvested && (
        <span
          aria-hidden
          className="pointer-events-none absolute whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-ink shadow-sm"
          style={{
            top: Math.max(0, y(dip.value) - 34),
            left: labelRight ? undefined : Math.max(0, x(dipIndex) - 16),
            right: labelRight ? Math.max(0, width - x(dipIndex) - 16) : undefined,
          }}
        >
          You stayed invested
        </span>
      )}

      {a && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 w-[180px] rounded-card-sm border border-border bg-surface p-3 text-sm shadow-lg"
          style={{ left: tipLeft }}
        >
          <p className="font-semibold text-ink">Week of {dateLabel(a.date, { short: true })}</p>
          <p className="mt-1 flex justify-between gap-2 text-ink">
            <span className="text-ink-muted">Value</span>
            <span className="font-semibold tabular-nums">{formatINR(a.value)}</span>
          </p>
          <p className="flex justify-between gap-2 text-ink">
            <span className="text-ink-muted">Invested</span>
            <span className="font-semibold tabular-nums">{formatINR(a.invested)}</span>
          </p>
          {active! > 0 && (
            <p className="flex justify-between gap-2 text-ink">
              <span className="text-ink-muted">Market move</span>
              <span className="font-semibold tabular-nums">{formatSigned(a.move)}</span>
            </p>
          )}
          {a.down && <p className="mt-1 text-xs font-semibold text-caution">{a.stayedInvested ? 'Down week. You stayed invested.' : 'Down week.'}</p>}
        </div>
      )}

      <div className="sr-only">
        <table>
          <caption>Value and amount invested each week (illustrative)</caption>
          <thead>
            <tr>
              <th scope="col">Week of</th>
              <th scope="col">Value</th>
              <th scope="col">Invested</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.week}>
                <td>{dateLabel(p.date)}</td>
                <td>{formatINR(p.value)}</td>
                <td>{formatINR(p.invested)}</td>
                <td>{p.down ? (p.stayedInvested ? 'Down week, you stayed invested' : 'Down week') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Legend for the chart: text labels, never colour alone. */
export function AreaLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      <li className="flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden>
          <line x1="0" x2="18" y1="4" y2="4" className="stroke-brand-text" strokeWidth={2} />
        </svg>
        Value
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden>
          <line x1="0" x2="18" y1="4" y2="4" className="stroke-chart-invested" strokeWidth={2} strokeDasharray="5 4" />
        </svg>
        Invested
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="10" height="10" aria-hidden>
          <circle cx="5" cy="5" r="4" className="fill-caution-icon" />
        </svg>
        Down week
      </li>
    </ul>
  );
}
