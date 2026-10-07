// Pause 1, 2 or 3 months (README 9 item 12). One tap picks the length; the SIP
// restarts on its own afterwards. Used by SIP detail and the Stop coach.
import { dateLabel } from '../lib/format';
import { simToday } from '../lib/market';
import { pauseOptions, pauseToast, type PauseMonths } from '../lib/sip';
import { useStore } from '../state/store';
import type { Sip } from '../state/types';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useToast } from './Toast';

type Props = { sip: Sip; open: boolean; onClose: () => void; onPaused?: () => void };

export function PauseSheet({ sip, open, onClose, onPaused }: Props) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const options = pauseOptions(simToday(state.market));
  const paused = sip.status === 'paused';

  const pick = (months: PauseMonths, resumeOn: string) => {
    dispatch({ type: 'pauseSip', sipId: sip.id, months });
    toast.show(pauseToast(months, resumeOn));
    onClose();
    onPaused?.();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={paused ? 'Change the pause' : 'Pause this SIP'}>
      <div className="space-y-4">
        <p className="text-base text-ink">
          Pick how long. It restarts by itself, and you can resume sooner. Skipping or pausing never resets anything, and the units you own stay invested.
        </p>
        <ul className="space-y-3">
          {options.map((o) => (
            <li key={o.months}>
              <Button variant="secondary" block className="!justify-between" onClick={() => pick(o.months, o.resumeOn)}>
                <span>Pause for {o.label}</span>
                <span className="text-sm font-medium text-ink-muted">Restarts after {dateLabel(o.resumeOn, { short: true })}</span>
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="quiet" block onClick={onClose}>
          Not now
        </Button>
      </div>
    </BottomSheet>
  );
}
