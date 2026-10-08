// Emergency fund vs Long-term investing bar with ₹ labels (README 9 item 4). Labels carry the meaning.
// `animate` fills each part in from the left on mount (Stage 6a plan reveal).
import type { CSSProperties } from 'react';
import { formatINR } from '../lib/format';
import { ROLE_LABEL } from '../lib/planner';
import type { StarterPlan } from '../state/types';

export function SplitBar({ plan, size = 'md', labels = true, animate = false }: { plan: StarterPlan; size?: 'sm' | 'md'; labels?: boolean; animate?: boolean }) {
  const cushion = plan.buckets.find((b) => b.role === 'cushion')?.amount ?? 0;
  const grow = plan.buckets.find((b) => b.role === 'grow')?.amount ?? 0;
  const total = cushion + grow || 1;
  const h = size === 'sm' ? 'h-2' : 'h-4';
  return (
    <div>
      <div className={`flex ${h} w-full gap-1 overflow-hidden rounded-full`} aria-hidden>
        {cushion > 0 && (
          <div className="h-full transition-[width] duration-300" style={{ width: `${(cushion / total) * 100}%` }}>
            <div className={`h-full rounded-full bg-brand/35 ${animate ? 'anim-fill' : ''}`} />
          </div>
        )}
        {grow > 0 && (
          <div className="h-full transition-[width] duration-300" style={{ width: `${(grow / total) * 100}%` }}>
            <div className={`h-full rounded-full bg-brand ${animate ? 'anim-fill' : ''}`} style={{ '--delay': '150ms' } as CSSProperties} />
          </div>
        )}
      </div>
      {labels && <dl className={`mt-2 flex ${size === 'sm' ? 'flex-col gap-1 text-xs' : 'justify-between gap-3 text-sm'}`}>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand/35" />
          <dt className="text-ink-muted">{ROLE_LABEL.cushion}</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatINR(cushion)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand" />
          <dt className="text-ink-muted">{ROLE_LABEL.grow}</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatINR(grow)}</dd>
        </div>
      </dl>}
    </div>
  );
}
