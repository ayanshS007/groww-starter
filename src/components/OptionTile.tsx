// Large radio tiles (check-in answers). A real radio group: arrow keys work,
// and the selected tile shows a check icon as well as a border (never colour alone).
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export type Option<T extends string | number> = { value: T; label: string; hint?: string };

type Props<T extends string | number> = {
  name: string;
  legend: ReactNode;
  legendClassName?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  columns?: 1 | 2;
};

export function OptionTiles<T extends string | number>({ name, legend, legendClassName, options, value, onChange, columns = 1 }: Props<T>) {
  return (
    <fieldset>
      <legend className={legendClassName ?? 'mb-3 text-base font-semibold text-ink'}>{legend}</legend>
      <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={String(o.value)}
              className={`relative flex min-h-[56px] cursor-pointer items-center gap-3 rounded-card-sm border-2 px-4 py-3 transition focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus ${
                checked ? 'border-brand bg-mint' : 'border-border bg-surface hover:bg-surface2'
              }`}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(o.value)}
              />
              <span className="flex-1">
                <span className="block font-semibold text-ink">{o.label}</span>
                {o.hint && <span className="block text-sm text-ink-muted">{o.hint}</span>}
              </span>
              <span
                aria-hidden
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  checked ? 'border-brand bg-brand text-on-brand' : 'border-border'
                }`}
              >
                {checked && <Icon name="check" size={16} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
