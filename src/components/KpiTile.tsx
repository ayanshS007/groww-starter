// Dashboard KPI tile (design-refs/01): pastel tint, icon circle, big number,
// small line under it, optional mini sparkline. Own money only.
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Sparkline } from './Sparkline';

export type KpiTint = 'mint' | 'lavender' | 'peach' | 'sky' | 'caution';

const TINT: Record<KpiTint, string> = {
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  peach: 'bg-peach',
  sky: 'bg-sky',
  caution: 'bg-caution-fill',
};

type Props = {
  tint: KpiTint;
  icon: IconName;
  /** Soft rose icon for the user's own down week (never alarm red). */
  iconTone?: 'ink' | 'down' | 'brand';
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  spark?: { points: number[]; label: string };
  children?: ReactNode;
};

export function KpiTile({ tint, icon, iconTone = 'ink', label, value, sub, spark, children }: Props) {
  const iconColour = iconTone === 'down' ? 'text-own-down' : iconTone === 'brand' ? 'text-brand-text' : 'text-ink';
  return (
    <div className={`flex min-w-0 flex-col rounded-card p-4 lg:p-5 ${TINT[tint]}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface ${iconColour}`}>
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-3 text-sm font-medium text-ink-muted">{label}</p>
      <div className="mt-1 text-xl font-extrabold tabular-nums text-ink lg:text-2xl">{value}</div>
      {sub && <div className="mt-1 text-sm text-ink">{sub}</div>}
      {children}
      {spark && spark.points.length > 1 && (
        <div className="mt-auto pt-3">
          <Sparkline points={spark.points} label={spark.label} height={36} />
        </div>
      )}
    </div>
  );
}
