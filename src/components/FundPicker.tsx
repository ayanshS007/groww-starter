// "Pick a fund" list for one part of the plan (Stage 7a). The plan names a category;
// the user picks the fund. Sorted by name, nothing preselected, and the label says it isn't advice.
import { getFund } from '../data/funds';
import { formatINR, formatPct } from '../lib/format';
import { Link } from '../router';
import type { PlanBucket, FundId } from '../state/types';
import { OptionTiles } from './OptionTile';

export const PICK_LABEL = "Funds in this category. Pick any. This isn't a recommendation.";

type Props = {
  bucket: PlanBucket;
  /** The fund picked (or already run as a SIP). Undefined means nothing is picked. */
  value: FundId | undefined;
  onChange: (fundId: FundId) => void;
  /** Unique within the screen, so two lists never share a radio group. */
  name: string;
};

export function FundPicker({ bucket, value, onChange, name }: Props) {
  const funds = bucket.candidateFundIds.map((id) => getFund(id)!).filter(Boolean);
  return (
    <div>
      <OptionTiles
        dense
        name={name}
        legend={
          <>
            <span className="block">Pick a fund</span>
            <span className="mt-0.5 block text-sm font-normal text-ink-muted">{PICK_LABEL}</span>
          </>
        }
        legendClassName="mb-2 text-base font-semibold text-ink"
        options={funds.map((f) => ({
          value: f.id,
          label: f.name,
          hint: `Starts at ${formatINR(f.minSip)} a month · Costs ${formatPct(f.expenseRatio, 2)} a year`,
        }))}
        value={value}
        onChange={onChange}
      />
      <ul className="mt-2 flex flex-wrap gap-x-4">
        {funds.map((f) => (
          <li key={f.id}>
            <Link
              to={`/fund/${f.id}?from=plan`}
              className="inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              Read about {f.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
