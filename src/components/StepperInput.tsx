// +/− numeric stepper (SIP date, quantity). A spinbutton: arrow keys, Home and
// End work too, and the value is announced as it changes.
import { useId, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** Spoken and shown text for the current value, e.g. "the 10th". */
  format?: (v: number) => string;
  hint?: string;
};

const btn =
  'flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-40';

export function StepperInput({ label, value, min, max, onChange, format = String, hint }: Props) {
  const id = useId();
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(value + 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(value - 1);
    else if (e.key === 'Home') set(min);
    else if (e.key === 'End') set(max);
    else return;
    e.preventDefault();
  };
  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-semibold text-ink">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`${label}: one less`}>
          <Icon name="minus" />
        </button>
        <div
          role="spinbutton"
          tabIndex={0}
          aria-labelledby={`${id}-label`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={format(value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onKeyDown={key}
          className="flex min-h-[48px] min-w-[104px] items-center justify-center rounded-card-sm border-2 border-border bg-surface px-4 text-xl font-semibold tabular-nums text-ink"
        >
          {format(value)}
        </div>
        <button type="button" className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`${label}: one more`}>
          <Icon name="plus" />
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
