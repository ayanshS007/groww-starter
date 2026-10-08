// "Why is intraday hidden?" (README 8.9). Beginner mode is delivery only;
// intraday and F&O are hidden, and F&O is not available in this prototype.
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Term } from './Term';

export function HiddenTradingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Why is intraday hidden?">
      <div className="space-y-4 text-base text-ink">
        <p>
          Here you buy for <Term id="delivery-vs-intraday">delivery</Term>: the shares are yours until you decide to sell. No deadline.
        </p>
        <p>
          <span className="font-semibold">Intraday</span> means buying and selling on the same day, betting on small moves. Most people who start
          that way lose money, and it trains quick trading rather than investing.
        </p>
        <p>
          <span className="font-semibold">
            <Term id="f-and-o">F&amp;O</Term>
          </span>{' '}
          uses borrowed bets that can lose more than you put in. It isn’t available in this prototype.
        </p>
        <p className="text-sm text-ink-muted">Nothing is locked forever. This keeps the first steps simple.</p>
        <Button block onClick={onClose}>
          Got it
        </Button>
      </div>
    </BottomSheet>
  );
}
