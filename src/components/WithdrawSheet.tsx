// Withdraw (README 9 item 11, PLAN items 21–22). A bottom sheet on Holding
// detail: an amount or "Withdraw all", plain exit-load note, timing, and the
// shortened Confidence Layer. Stocks sell whole shares through the same sheet.
import { useState } from 'react';
import { getFund } from '../data/funds';
import { formatINR, formatUnits } from '../lib/format';
import { currentNav } from '../lib/market';
import { checkWithdraw } from '../lib/portfolio';
import { navigate } from '../router';
import { useStore } from '../state/store';
import type { Holding } from '../state/types';
import { AmountInput } from './AmountInput';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { ConfidenceBlock } from './ConfidenceBlock';
import { Term } from './Term';
import { useToast } from './Toast';

type Props = { holding: Holding; open: boolean; onClose: () => void; hasSip: boolean };

export function WithdrawSheet({ holding, open, onClose, hasSip }: Props) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = useState('');
  const [all, setAll] = useState(false);
  const [error, setError] = useState<string>();
  const isStock = holding.kind === 'stock';
  const fund = getFund(holding.assetId);
  const nav = currentNav(holding.assetId, state.market);
  const value = holding.units * nav;
  const verb = isStock ? 'Sell' : 'Withdraw';

  const check = all || text !== '' ? checkWithdraw(text, { kind: holding.kind, units: holding.units, nav }, all) : undefined;
  const label = check?.ok ? `${verb} ${formatINR(check.amount)}` : verb;

  const close = () => {
    setText('');
    setAll(false);
    setError(undefined);
    onClose();
  };

  const submit = () => {
    const c = checkWithdraw(text, { kind: holding.kind, units: holding.units, nav }, all);
    if (!c.ok) return setError(c.error);
    // When everything goes, the holding disappears: leave its page first.
    if (c.all) navigate('/portfolio', { replace: true });
    dispatch({ type: 'withdraw', holdingId: holding.id, units: c.all ? undefined : c.units, all: c.all });
    toast.show(`${formatINR(c.amount)} is on its way. It reaches your bank in 1–3 working days.`);
    close();
  };

  return (
    <BottomSheet open={open} onClose={close} title={isStock ? 'Sell shares' : 'Withdraw money'}>
      <div className="space-y-5">
        <p className="text-base text-ink">
          You hold <span className="font-semibold tabular-nums">{formatINR(value)}</span>
          {isStock ? ` (${formatUnits(holding.units)} shares)` : ` (${formatUnits(holding.units)} units)`}. Sample value.
        </p>

        {!all && (
          <AmountInput
            label={isStock ? 'Shares to sell' : 'Amount to withdraw'}
            value={text}
            onChange={(v) => {
              setText(v);
              setError(undefined);
            }}
            error={error}
            note={isStock ? 'Whole shares only.' : 'Any amount up to what you hold.'}
          />
        )}
        {all && (
          <p className="rounded-card-sm bg-mint p-4 text-base text-ink" aria-live="polite">
            All of it: about <span className="font-semibold tabular-nums">{formatINR(value)}</span>.
          </p>
        )}
        <Button variant="quiet" block onClick={() => { setAll(!all); setError(undefined); }}>
          {all ? 'Enter an amount instead' : isStock ? 'Sell all shares' : 'Withdraw all'}
        </Button>

        <dl className="space-y-3 text-sm">
          {fund && (
            <div>
              <dt className="font-semibold text-ink">
                <Term id="exit-load">Exit load</Term>
              </dt>
              <dd className="text-ink-muted">{fund.exitLoad}</dd>
            </div>
          )}
          <div>
            <dt className="font-semibold text-ink">When you get it</dt>
            <dd className="text-ink-muted">Money reaches your bank in 1–3 working days.</dd>
          </div>
        </dl>

        <ConfidenceBlock
          compact
          what={<>{verb === 'Sell' ? 'Selling' : 'Withdrawing'} turns some or all of your holding back into money in your bank.</>}
          why="You tapped this yourself. We never suggest selling. Taking money out is your call."
          next={
            <>
              Your units drop right away. {hasSip ? 'Your SIP in this fund keeps running unless you stop it. ' : ''}You can invest again whenever you like.
            </>
          }
        />

        <p className="text-xs text-ink-muted">Illustrative prototype. Amounts are sample data.</p>
        <Button block onClick={submit} aria-label={label}>
          {label}
        </Button>
      </div>
    </BottomSheet>
  );
}
