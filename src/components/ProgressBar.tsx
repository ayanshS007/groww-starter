// Linear progress with an accessible value. `from` animates the fill from an
// earlier value on mount (check-in steps are separate routes, so each mounts fresh).
import type { CSSProperties } from 'react';

type Props = { value: number; max?: number; from?: number; label: string; className?: string };

const clampPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));

export function ProgressBar({ value, max = 100, from, label, className = '' }: Props) {
  const pct = clampPct(value, max);
  const style: CSSProperties & Record<'--from', string> = { width: `${pct}%`, '--from': `${from === undefined ? pct : clampPct(from, max)}%` };
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface2 ${className}`}
    >
      <div className={`h-full rounded-full bg-brand transition-[width] duration-300 ${from !== undefined ? 'anim-bar' : ''}`} style={style} />
    </div>
  );
}
