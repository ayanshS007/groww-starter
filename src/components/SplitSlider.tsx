// Adjust split (PLAN item 9, C7): cushion 0–100 % in steps of 10, starting at
// the rule's suggestion. One plain trade-off line; it never blocks.
import { useId } from 'react';
import { formatINR } from '../lib/format';
import { ROLE_LABEL } from '../lib/planner';
import type { StarterPlan } from '../state/types';

type Props = { plan: StarterPlan; onChange: (cushionPct: number) => void };

export function SplitSlider({ plan, onChange }: Props) {
  const id = useId();
  const growPct = 100 - plan.cushionPct;
  const cushion = plan.buckets.find((b) => b.role === 'cushion')?.amount ?? 0;
  const grow = plan.buckets.find((b) => b.role === 'grow')?.amount ?? 0;
  const atSuggestion = plan.cushionPct === plan.suggestedCushionPct;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-base font-semibold text-ink">
          Adjust split
        </label>
        <span className="text-sm text-ink-muted">
          Suggested: {plan.suggestedCushionPct}% {ROLE_LABEL.cushion.toLowerCase()}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={10}
        value={plan.cushionPct}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${ROLE_LABEL.cushion} ${plan.cushionPct}%, ${formatINR(cushion)}. ${ROLE_LABEL.grow} ${growPct}%, ${formatINR(grow)}.`}
        className="split-range mt-3 w-full"
        style={{ ['--fill' as string]: `${plan.cushionPct}%` }}
      />
      <div className="mt-1 flex justify-between text-sm font-medium text-ink" aria-hidden>
        <span>{ROLE_LABEL.cushion} {plan.cushionPct}%</span>
        <span>{ROLE_LABEL.grow} {growPct}%</span>
      </div>
      <p aria-live="polite" className="mt-3 min-h-[1.5rem] text-sm text-ink">
        {plan.splitNote ?? ''}
      </p>
      {!atSuggestion && (
        <button
          type="button"
          onClick={() => onChange(plan.suggestedCushionPct)}
          className="mt-1 min-h-tap text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
        >
          Back to the suggested {plan.suggestedCushionPct}%
        </button>
      )}
    </div>
  );
}
