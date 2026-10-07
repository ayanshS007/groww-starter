// Large radio tiles (check-in answers). A real radio group: arrow keys work,
// and the selected tile shows a check icon as well as a green ring (never colour alone).
// Options with an icon render as chunky tiles (Stage 6a check-in).
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type Option<T extends string | number> = { value: T; label: string; hint?: string; icon?: IconName };

type Props<T extends string | number> = {
  name: string;
  legend: ReactNode;
  legendClassName?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  columns?: 1 | 2;
  /** Tighter tiles (still ≥ 44 px tall) for screens that must fit above a fixed action row. */
  dense?: boolean;
};

export function OptionTiles<T extends string | number>({ name, legend, legendClassName, options, value, onChange, columns = 1, dense = false }: Props<T>) {
  return (
    <fieldset>
      <legend className={legendClassName ?? 'mb-3 text-base font-semibold text-ink'}>{legend}</legend>
      <div className={`grid ${dense ? 'gap-2' : 'gap-3'} ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o) => {
          const checked = value === o.value;
          const ring = checked
            ? 'border-brand bg-mint ring-4 ring-brand/30'
            : 'border-border bg-surface hover:border-brand/50 hover:bg-surface2';
          const base = `relative flex cursor-pointer rounded-card-sm border-2 transition-[border-color,background-color,box-shadow,transform] duration-150 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus active:scale-[0.98] motion-reduce:active:scale-100 ${ring}`;
          const input = (
            <input type="radio" name={name} className="sr-only" checked={checked} onChange={() => onChange(o.value)} />
          );
          if (o.icon) {
            const stacked = columns === 2;
            return (
              <label
                key={String(o.value)}
                className={`${base} ${stacked ? 'min-h-[112px] flex-col items-start gap-3 p-4' : 'min-h-[72px] items-center gap-4 py-4 pl-4 pr-12'}`}
              >
                {input}
                <span
                  aria-hidden
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card-sm transition-colors duration-150 ${
                    checked ? 'bg-brand text-on-brand' : 'bg-surface2 text-ink'
                  }`}
                >
                  <Icon name={o.icon} size={24} strokeWidth={2} />
                </span>
                <span className={stacked ? 'pr-6' : 'flex-1'}>
                  <span className="block text-lg font-bold leading-snug text-ink">{o.label}</span>
                  {o.hint && <span className="mt-0.5 block text-sm text-ink-muted">{o.hint}</span>}
                </span>
                <span
                  aria-hidden
                  className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                    checked ? 'border-brand bg-brand text-on-brand' : 'border-border bg-surface'
                  }`}
                >
                  {checked && <Icon name="check" size={16} strokeWidth={3} />}
                </span>
              </label>
            );
          }
          return (
            <label key={String(o.value)} className={`${base} ${dense ? 'min-h-[48px] py-2' : 'min-h-[56px] py-3'} items-center gap-3 px-4`}>
              {input}
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
