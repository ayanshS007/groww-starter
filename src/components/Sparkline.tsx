// Inline SVG mini line (README 6.1: no chart library). Values are sample data;
// the label says so for screen readers.
type Props = { points: number[]; label: string; height?: number; className?: string };

export function Sparkline({ points, label, height = 56, className = '' }: Props) {
  if (points.length < 2) return null;
  const w = 240;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((p, i): [number, number] => [
    (i / (points.length - 1)) * w,
    pad + (1 - (p - min) / span) * (height - pad * 2),
  ]);
  const line = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${height} L0 ${height} Z`;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={`block w-full text-brand-text ${className}`}
      style={{ height }}
    >
      <path d={area} className="fill-brand/15" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
