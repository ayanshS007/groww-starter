// S26 Stock buy (README 8.7, 8.9, 9 item 16; PLAN S26 and item 35). Two steps:
// order (quantity stepper or amount, Market/Limit explained, delivery only,
// gentle budget sheet that never blocks) → review (key risk + checkbox, pick
// reason + Tip Check offer, KYC at payment) → "Order placed (simulated)".
// The order lives in the URL, so KYC and Tip Check return to it.
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AmountInput } from '../components/AmountInput';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Disclaimer } from '../components/Disclaimer';
import { FlowHeader } from '../components/FlowHeader';
import { HiddenTradingSheet } from '../components/HiddenTradingSheet';
import { Icon } from '../components/Icon';
import { LetterAvatar } from '../components/LetterAvatar';
import { Note } from '../components/Note';
import { OptionTiles } from '../components/OptionTile';
import { PickReasonChips } from '../components/PickReasonChips';
import { StepperInput } from '../components/StepperInput';
import { Term } from '../components/Term';
import { getStock } from '../data/stocks';
import { formatINR, formatPct } from '../lib/format';
import { currentNav, portfolioValue, stockValue } from '../lib/market';
import { buildPath } from '../lib/routes';
import {
  budgetCheck,
  buyPath,
  draftShares,
  fillPrice,
  MAX_SHARES,
  MORE_ORDER_TYPES,
  ORDER_TYPES,
  parseBuyQuery,
  sharesWithinBudget,
  validateLimit,
  ZERO_SHARES_NOTE,
  type BuyDraft,
} from '../lib/stockBuy';
import { Link, navigate } from '../router';
import { nextOrderId } from '../state/reducer';
import { useStore } from '../state/store';

const sharesText = (n: number) => `${n} share${n === 1 ? '' : 's'}`;

export function StockBuy({ id, query }: { id: string; query: Record<string, string> }) {
  const { state, dispatch } = useStore();
  const stock = getStock(id)!;
  const d = parseBuyQuery(query);
  const price = currentNav(stock.id, state.market);
  const [amountText, setAmountText] = useState(d.amount ? String(d.amount) : '1000');
  const [limitText, setLimitText] = useState(String(d.limit ?? Math.round(price)));
  const [budgetSheet, setBudgetSheet] = useState(false);
  const [why, setWhy] = useState(false);
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);

  // Changing the order asks the budget question again.
  const update = (patch: Partial<BuyDraft>, opts: { push?: boolean } = {}) => {
    const changesOrder = (['qty', 'mode', 'amount', 'orderType', 'limit'] as const).some((k) => k in patch && patch[k] !== d[k]);
    const budgetOk = 'budgetOk' in patch ? patch.budgetOk : changesOrder ? false : d.budgetOk;
    navigate(buyPath(stock.id, { ...d, ...patch, budgetOk: !!budgetOk }), { replace: !opts.push });
  };

  // Text fields keep what is typed; the URL keeps the last valid value.
  const limitCheck = validateLimit(limitText, price);
  const amountNum = Number(amountText.replace(/,/g, '')) || 0;
  useEffect(() => {
    const limit = limitCheck.ok ? limitCheck.value : undefined;
    const amount = amountNum > 0 ? Math.round(amountNum) : undefined;
    if ((d.mode === 'amount' && amount !== d.amount) || (d.orderType === 'limit' && limit !== d.limit)) {
      update({ amount: d.mode === 'amount' ? amount : d.amount, limit: d.orderType === 'limit' ? limit : d.limit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountText, limitText, d.mode, d.orderType]);

  const each = fillPrice(d, price);
  const shares = draftShares(d, price);
  const total = shares * each;
  const check = budgetCheck(state, total);
  const within = sharesWithinBudget(check, each);
  const limitError = d.orderType === 'limit' && touched && !limitCheck.ok ? limitCheck.error : undefined;
  const orderOk = shares >= 1 && (d.orderType === 'market' || limitCheck.ok);

  // New step: scroll up and focus the content.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [d.step]);

  const toReview = (budgetOk = d.budgetOk) => update({ step: 'review', budgetOk }, { push: true });

  const next = () => {
    setTouched(true);
    if (!orderOk) return;
    if (check.exceeds && !d.budgetOk) return setBudgetSheet(true);
    toReview();
  };

  const here = buyPath(stock.id, d);
  const place = () => {
    if (!ack || shares < 1) return;
    if (!state.user.signedUp) return navigate(buildPath('/signup', { next: buildPath('/kyc/1', { next: here }) }));
    if (state.user.kyc !== 'done') return navigate(buildPath('/kyc/1', { next: here }));
    const orderId = nextOrderId(state);
    flushSync(() => {
      navigate(`/invest/success/${orderId}`, { replace: true });
      dispatch({
        type: 'buyStock',
        stockId: stock.id,
        shares,
        orderType: d.orderType,
        limitPrice: d.orderType === 'limit' ? d.limit : undefined,
        pickReason: d.reason,
      });
    });
  };

  const banner = (
    <div className="flex items-center gap-3 rounded-card-sm bg-surface2 p-3">
      <LetterAvatar name={stock.name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{stock.name}</p>
        <p className="text-sm text-ink-muted">{stock.sector} · sample price {formatINR(price, 2)}</p>
      </div>
    </div>
  );

  const onBack = d.step === 'review' ? () => update({ step: 'order' }) : () => (window.history.length > 1 ? window.history.back() : navigate(`/stock/${stock.id}`));

  return (
    <>
      <FlowHeader onBack={onBack} closeTo={`/stock/${stock.id}`} closeLabel="Close, nothing is bought" step={d.step === 'order' ? 1 : 2} steps={2} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-tablet space-y-6 px-safe pb-10 pt-6 outline-none">
        {d.step === 'order' ? (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-ink">How many shares?</h1>
              <p className="mt-2 text-base text-ink-muted">Start small. You can buy more later.</p>
            </div>
            {banner}

            <div className="flex flex-wrap gap-2" role="group" aria-label="Buy by">
              <Chip selected={d.mode === 'shares'} onClick={() => update({ mode: 'shares', qty: Math.max(1, d.qty) })}>
                Number of shares
              </Chip>
              <Chip selected={d.mode === 'amount'} onClick={() => update({ mode: 'amount', amount: amountNum > 0 ? Math.round(amountNum) : undefined })}>
                Amount in ₹
              </Chip>
            </div>

            {d.mode === 'shares' ? (
              <StepperInput label="Shares" value={d.qty} min={1} max={MAX_SHARES} format={sharesText} onChange={(v) => update({ qty: v })} hint="Whole shares only." />
            ) : (
              <div>
                <AmountInput label="Amount you want to spend" value={amountText} onChange={setAmountText} />
                <p className="text-lg font-semibold text-ink" aria-live="polite">
                  {formatINR(amountNum)} buys {sharesText(shares)}
                  {shares > 0 && <span className="font-normal text-ink-muted"> ({formatINR(total, 2)})</span>}
                </p>
                {shares === 0 && amountNum > 0 && (
                  <div className="mt-3">
                    <Note tone="info">
                      <p>
                        {ZERO_SHARES_NOTE} One share costs {formatINR(each, 2)}, so {formatINR(amountNum)} buys 0 shares.
                      </p>
                      <button
                        type="button"
                        onClick={() => update({ mode: 'shares', qty: 1 })}
                        className="mt-1 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline"
                      >
                        Buy 1 share instead
                      </button>
                    </Note>
                  </div>
                )}
              </div>
            )}

            <OptionTiles
              name="order-type"
              legend={
                <>
                  Order type: <Term id="market-order">market</Term> or <Term id="limit-order">limit</Term>
                </>
              }
              columns={2}
              value={d.orderType}
              onChange={(v) => update({ orderType: v, limit: v === 'limit' && limitCheck.ok ? limitCheck.value : d.limit })}
              options={ORDER_TYPES}
            />
            {d.orderType === 'limit' && (
              <div>
                <AmountInput label="Your price per share" value={limitText} onChange={(v) => { setLimitText(v); setTouched(true); }} error={limitError} note="In this prototype, a limit order fills straight away at your price." />
              </div>
            )}

            {state.prefs.readinessPassed ? (
              <details className="group rounded-card border border-border bg-surface">
                <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-ink">
                  More order types, explained
                  <Icon name="chevronDown" size={20} className="shrink-0 transition group-open:rotate-180" />
                </summary>
                <ul className="space-y-3 px-4 pb-4">
                  {MORE_ORDER_TYPES.map((o) => (
                    <li key={o.label} className="text-sm">
                      <span className="font-semibold text-ink">{o.label}: </span>
                      <span className="text-ink-muted">{o.text}</span>
                    </li>
                  ))}
                  <li className="text-sm text-ink-muted">Explained only. You can’t place these here. F&amp;O is not available in this prototype.</li>
                </ul>
              </details>
            ) : (
              <p className="text-sm text-ink-muted">
                Curious about other order types?{' '}
                <Link to="/you/trading" className="font-semibold text-brand-text underline-offset-4 hover:underline">
                  Take the readiness check
                </Link>{' '}
                to see them explained.
              </p>
            )}

            <Note tone="info">
              <p>Delivery only: you own the shares until you sell. Intraday and F&amp;O are hidden.</p>
              <button type="button" onClick={() => setWhy(true)} aria-haspopup="dialog" className="mt-1 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
                Why is intraday hidden?
              </button>
            </Note>

            <dl className="divide-y divide-border rounded-card border border-border bg-surface text-base" aria-live="polite">
              <div className="flex justify-between gap-3 p-4">
                <dt className="text-ink-muted">
                  {sharesText(shares)} × {formatINR(each, 2)}
                </dt>
                <dd className="font-bold tabular-nums text-ink">{formatINR(total, 2)}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <Button type="submit" block disabled={shares < 1} aria-describedby="order-hint">
                Continue
              </Button>
              <p id="order-hint" className="text-center text-sm text-ink-muted">
                {shares < 1 ? 'Pick at least 1 share to continue.' : 'You review everything before anything is bought.'}
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-ink">Review your order</h1>
              <p className="mt-2 text-base text-ink-muted">Nothing is bought until you place it. Simulated: no money moves.</p>
            </div>
            {banner}
            <dl className="divide-y divide-border rounded-card border border-border bg-surface text-base">
              {[
                ['Shares', sharesText(shares)],
                ['Order type', d.orderType === 'limit' ? `Limit at ${formatINR(each, 2)}` : 'Market'],
                ['Kind', 'Delivery: yours until you sell'],
                ['Total', formatINR(total, 2)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 p-4">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right font-semibold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 p-4">
                <dt className="text-ink-muted">Shares or order type</dt>
                <dd>
                  <button type="button" onClick={() => update({ step: 'order' })} className="inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
                    Change<span className="sr-only"> shares or order type</span>
                  </button>
                </dd>
              </div>
            </dl>

            {check.exceeds && (
              <Note tone="caution">
                Over your stock budget: stocks would be {formatPct(check.afterPct, 0)} of your portfolio, limit {formatPct(check.limitPct, 0)}. Your call.
              </Note>
            )}

            <PickReasonChips
              value={d.reason}
              onChange={(reason) => update({ reason })}
              offerDone={d.tipDone}
              onSkipOffer={() => update({ tipDone: true })}
              onRunTipCheck={() => navigate(buildPath('/learn/tip-check', { next: buyPath(stock.id, { ...d, tipDone: true }) }))}
            />

            <ConfidenceBlock
              compact
              what={<>Buying {sharesText(shares)} of one company, {stock.name}. Its price moves with that one business.</>}
              why={d.reason === 'plan' ? 'You picked it yourself. Single stocks aren’t part of a starter plan.' : 'You picked this company yourself. We never suggest stocks.'}
              next={<>The order fills at the sample price. The shares show in Portfolio; sell any time from the holding.</>}
            />

            <label
              className={`flex min-h-[56px] cursor-pointer items-start gap-3 rounded-card-sm border-2 p-4 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus ${
                ack ? 'border-brand bg-mint' : 'border-border bg-surface'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${ack ? 'border-brand bg-brand text-on-brand' : 'border-ink-muted'}`}>
                {ack && <Icon name="check" size={16} strokeWidth={3} />}
              </span>
              <span className="text-base text-ink">I understand the main risk: {stock.mainRisk}</span>
            </label>

            <div className="space-y-2">
              <Button block disabled={!ack} aria-describedby="place-hint" onClick={place}>
                Place order
              </Button>
              <p id="place-hint" className="text-center text-sm text-ink-muted">
                {!ack ? 'Tick the box above to place your order.' : state.user.kyc === 'done' ? 'Paid from your linked bank (simulated).' : 'A quick verification comes first.'}
              </p>
            </div>
          </div>
        )}
        <Disclaimer className="mt-8" />
      </main>

      <BottomSheet open={budgetSheet} onClose={() => setBudgetSheet(false)} title="This goes over your stock budget">
        <div className="space-y-4">
          <p className="text-base text-ink">
            After this buy, stocks would be <span className="font-semibold">{formatPct(check.afterPct, 0)}</span> of your portfolio. Your limit is{' '}
            <span className="font-semibold">{formatPct(check.limitPct, 0)}</span>.
          </p>
          <dl className="divide-y divide-border rounded-card-sm border border-border text-sm">
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-ink-muted">Stocks you hold now</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(stockValue(state))}</dd>
            </div>
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-ink-muted">This buy</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(total)}</dd>
            </div>
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-ink-muted">Whole portfolio after</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatINR(portfolioValue(state) + total)}</dd>
            </div>
          </dl>
          <p className="text-base text-ink">
            {within >= 1
              ? `To stay within it, buy up to ${sharesText(within)} (${formatINR(within * each)}).`
              : 'Any share of this company would go over it right now. That’s fine if you choose it.'}
          </p>
          <p className="text-sm text-ink-muted">Sample values. This is your own limit, not a rule. It never blocks a buy.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              block
              onClick={() => {
                setBudgetSheet(false);
                if (within >= 1) update({ mode: 'shares', qty: Math.min(within, MAX_SHARES) });
              }}
            >
              Adjust
            </Button>
            <Button
              variant="secondary"
              block
              onClick={() => {
                setBudgetSheet(false);
                toReview(true);
              }}
            >
              Buy anyway
            </Button>
          </div>
          <Link to="/you/trading" className="inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
            Change my limit
          </Link>
        </div>
      </BottomSheet>
      <HiddenTradingSheet open={why} onClose={() => setWhy(false)} />
    </>
  );
}
