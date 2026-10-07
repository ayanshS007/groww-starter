// "What made you pick this?" (README 8.7, PLAN S10/S26). Optional, one tap.
// "A friend or social media" or "Not sure" brings an inline, skippable offer of
// a 30-second Tip Check. It never blocks the order.
import { PICK_REASONS, offersTipCheck } from '../lib/tipCheck';
import type { PickReason } from '../state/types';
import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';

type Props = {
  value?: PickReason;
  onChange: (v: PickReason | undefined) => void;
  /** The offer was taken or skipped; hide it. */
  offerDone: boolean;
  onRunTipCheck: () => void;
  onSkipOffer: () => void;
};

export function PickReasonChips({ value, onChange, offerDone, onRunTipCheck, onSkipOffer }: Props) {
  const showOffer = offersTipCheck(value) && !offerDone;
  return (
    <section aria-labelledby="pick-title" className="rounded-card border border-border bg-surface p-4">
      <h2 id="pick-title" className="text-base font-semibold text-ink">
        What made you pick this? <span className="font-normal text-ink-muted">(optional)</span>
      </h2>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="pick-title">
        {PICK_REASONS.map((r) => (
          <Chip key={r.id} selected={value === r.id} onClick={() => onChange(value === r.id ? undefined : r.id)}>
            {value === r.id && <Icon name="check" size={16} />}
            {r.label}
          </Chip>
        ))}
      </div>
      <div aria-live="polite">
        {showOffer && (
          <div className="mt-4 rounded-card-sm bg-info-fill p-4">
            <p className="flex items-start gap-2 text-base text-ink">
              <Icon name="shield" size={20} className="mt-0.5 shrink-0 text-info" />
              Run a 30-second Tip Check? Six yes/no questions. Your order stays as it is.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onRunTipCheck}>
                Run Tip Check
              </Button>
              <Button variant="quiet" onClick={onSkipOffer}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
