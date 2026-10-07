// Risk + minimum SIP filters (README 9 item 7). Applies as you tap; "Show funds" closes.
import { MIN_SIP_OPTIONS, RISK_BANDS, sheetFilterCount, type FundFilters, type RiskBandId } from '../lib/explore';
import { formatINR } from '../lib/format';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Chip } from './Chip';

type Props = { open: boolean; onClose: () => void; filters: FundFilters; onChange: (f: FundFilters) => void; resultCount: number };

export function FilterSheet({ open, onClose, filters, onChange, resultCount }: Props) {
  const toggleRisk = (id: RiskBandId) =>
    onChange({ ...filters, risks: filters.risks.includes(id) ? filters.risks.filter((r) => r !== id) : [...filters.risks, id] });
  return (
    <BottomSheet open={open} onClose={onClose} title="Filter funds">
      <div className="space-y-6">
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Risk</legend>
          <p className="mt-1 text-sm text-ink-muted">Pick any. Higher risk means bigger ups and downs.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RISK_BANDS.map((b) => (
              <Chip key={b.id} selected={filters.risks.includes(b.id)} onClick={() => toggleRisk(b.id)}>
                {b.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Smallest SIP you can start with</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip selected={filters.maxMinSip === null} onClick={() => onChange({ ...filters, maxMinSip: null })}>
              Any
            </Chip>
            {MIN_SIP_OPTIONS.map((v) => (
              <Chip key={v} selected={filters.maxMinSip === v} onClick={() => onChange({ ...filters, maxMinSip: v })}>
                Up to {formatINR(v)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <p aria-live="polite" className="text-sm text-ink-muted">
          {resultCount} fund{resultCount === 1 ? '' : 's'} match.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button block onClick={onClose}>
            Show funds
          </Button>
          {sheetFilterCount(filters) > 0 && (
            <Button block variant="secondary" onClick={() => onChange({ ...filters, risks: [], maxMinSip: null })}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
