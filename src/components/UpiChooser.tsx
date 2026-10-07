// Generic UPI tiles (PLAN item 24): no real app names or logos.
import { checkUpiId, UPI_TILES } from '../lib/invest';
import type { UpiApp } from '../state/types';
import { OptionTiles } from './OptionTile';

type Props = {
  value: UpiApp | undefined;
  onChange: (v: UpiApp) => void;
  upiId: string;
  onUpiId: (v: string) => void;
  error?: string;
};

export function UpiChooser({ value, onChange, upiId, onUpiId, error }: Props) {
  return (
    <div className="space-y-4">
      <OptionTiles
        name="upi"
        legend="Pay with UPI"
        options={UPI_TILES.map((t) => ({
          value: t.value,
          label: t.label,
          hint: t.value === 'upi_id' ? 'Type your own UPI ID' : 'Opens your app (simulated)',
        }))}
        value={value}
        onChange={onChange}
        columns={2}
      />
      {value === 'upi_id' && (
        <div>
          <label htmlFor="upi-id" className="block text-sm font-semibold text-ink">
            UPI ID
          </label>
          <input
            id="upi-id"
            value={upiId}
            onChange={(e) => onUpiId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="name@bank"
            aria-invalid={!!error}
            aria-describedby="upi-id-msg"
            className={`mt-2 min-h-[56px] w-full rounded-card-sm border-2 bg-surface px-4 text-lg text-ink outline-none focus:border-brand ${
              error ? 'border-caution' : 'border-border'
            }`}
          />
        </div>
      )}
      <p id="upi-id-msg" aria-live="polite" className="min-h-[1.25rem] text-sm text-caution">
        {error}
      </p>
    </div>
  );
}

export { checkUpiId };
