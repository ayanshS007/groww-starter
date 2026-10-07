// Goal progress ring (Stage 6a). The arc warms from mint to Groww green as the
// goal fills (a brand arc fades in over a mint one) and gets a calm, still glow
// at 100%. The number is always written inside; colour is never the only cue.
import { ringGlows, ringWarmth } from '../lib/goals';

type Props = { pct: number; label: string; size?: number; className?: string };

export function GoalRing({ pct, label, size = 56, className = '' }: Props) {
  const shown = Math.max(0, Math.min(100, Math.round(pct)));
  const stroke = size >= 80 ? 9 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = `${(c * shown) / 100} ${c}`;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      className={`relative inline-flex shrink-0 items-center justify-center ${ringGlows(pct) ? 'goal-ring-glow' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface2" />
        {shown > 0 && (
          <>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={dash} className="stroke-ring-start" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dash}
              className="stroke-brand transition-opacity duration-300"
              style={{ opacity: ringWarmth(pct) }}
            />
          </>
        )}
      </svg>
      <span aria-hidden className={`absolute font-bold tabular-nums text-ink ${size >= 80 ? 'text-lg' : 'text-xs'}`}>
        {shown}%
      </span>
    </span>
  );
}
