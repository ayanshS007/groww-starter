// ₹ amount field with an aria-live error and an optional soft note.
import { useId } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  note?: string;
  autoFocus?: boolean;
};

export function AmountInput({ label, value, onChange, error, note, autoFocus }: Props) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={`mt-2 flex min-h-[56px] items-center rounded-card-sm border-2 bg-surface px-4 focus-within:border-brand ${
          error ? 'border-caution' : 'border-border'
        }`}
      >
        <span aria-hidden className="mr-1 text-2xl font-semibold text-ink-muted">
          ₹
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ''))}
          aria-invalid={!!error}
          aria-describedby={msgId}
          className="w-full bg-transparent text-2xl font-semibold tabular-nums text-ink outline-none"
        />
      </div>
      <p id={msgId} aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
        {error ? (
          <span className="text-caution">{error}</span>
        ) : note ? (
          <span className="text-ink-muted">{note}</span>
        ) : null}
      </p>
    </div>
  );
}
