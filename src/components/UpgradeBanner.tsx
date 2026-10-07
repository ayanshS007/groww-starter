// The only "Upgrade to Pro" banner: top of the Explore hub, while locked (Stage 6b).
// No prices, no payment. It opens the same "What Pro adds" sheet as every lock.
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { useProSheet } from './ProSheet';

export function UpgradeBanner() {
  const sheet = useProSheet();
  return (
    <Card tint="sky" pad="lg" aria-labelledby="upgrade-title">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
          <Icon name="lock" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="upgrade-title" className="text-xl font-bold text-ink">
            Upgrade to Pro
          </h2>
          <p className="mt-1 text-base text-ink">Extra charts, a fund comparison and portfolio analytics. You earn it with a 5-question quick check. Nothing to pay.</p>
          <Button variant="secondary" className="mt-4" onClick={sheet.open} aria-haspopup="dialog">
            See what Pro adds
          </Button>
        </div>
      </div>
    </Card>
  );
}
