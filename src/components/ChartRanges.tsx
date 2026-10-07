// Pro chart ranges (1W / 1M / 1Y / All) under a sample chart (Stage 6b).
import { CHART_RANGES, type ChartRange } from '../lib/chartRanges';
import { Chip } from './Chip';

export function ChartRanges({ value, onChange }: { value: ChartRange; onChange: (r: ChartRange) => void }) {
  return (
    <div role="group" aria-label="Chart range" className="flex flex-wrap gap-2">
      {CHART_RANGES.map((r) => (
        <Chip key={r} selected={value === r} onClick={() => onChange(r)}>
          {r}
        </Chip>
      ))}
    </div>
  );
}
