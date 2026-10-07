// Linear progress with an accessible value.
type Props = { value: number; max?: number; label: string; className?: string };

export function ProgressBar({ value, max = 100, label, className = '' }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface2 ${className}`}
    >
      <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
