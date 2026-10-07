// Header inside flows (sign-up, check-in, KYC): back, step count, close (README 4.1).
import { Link } from '../router';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';

type Props = {
  onBack?: () => void;
  backTo?: string;
  closeTo: string;
  closeLabel?: string;
  step?: number;
  steps?: number;
  title?: string;
};

const iconBtn = 'flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink hover:bg-surface2';

export function FlowHeader({ onBack, backTo, closeTo, closeLabel = 'Close', step, steps, title }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-bg/95 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2">
        {onBack ? (
          <button type="button" onClick={onBack} className={iconBtn} aria-label="Back">
            <Icon name="back" />
          </button>
        ) : backTo ? (
          <Link to={backTo} className={iconBtn} aria-label="Back">
            <Icon name="back" />
          </Link>
        ) : (
          <span className="min-w-tap" />
        )}
        <p className="flex-1 text-center text-sm font-medium text-ink-muted">
          {step && steps ? `Step ${step} of ${steps}` : title}
        </p>
        <Link to={closeTo} className={iconBtn} aria-label={closeLabel}>
          <Icon name="close" />
        </Link>
      </div>
      {step && steps ? (
        <div className="mx-auto max-w-tablet px-safe pb-2">
          <ProgressBar value={step} max={steps} label={`Step ${step} of ${steps}`} />
        </div>
      ) : null}
    </header>
  );
}
