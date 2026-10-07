// Pill choice/filter chip. Selection is announced with aria-pressed.
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean };

export function Chip({ selected = false, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-tap items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
        selected ? 'border-brand bg-mint text-ink' : 'border-border bg-surface text-ink hover:bg-surface2'
      } ${className}`}
      {...rest}
    />
  );
}
