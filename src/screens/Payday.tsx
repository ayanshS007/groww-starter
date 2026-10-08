// S21 Payday Split (README 8.3 with PLAN C14 and item 33). Three lines:
// Already going to SIPs · Cushion top-up · Yours to spend. One CTA tops up the
// cushion with a one-time investment into the user's own liquid fund. "A suggestion, not a rule."
// Never "invest everything", no spending shaming, no projections.
import { useState } from 'react';
import { AmountInput } from '../components/AmountInput';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Disclaimer } from '../components/Disclaimer';
import { Icon } from '../components/Icon';
import { Note } from '../components/Note';
import { ProgressBar } from '../components/ProgressBar';
import { Term } from '../components/Term';
import { getFund } from '../data/funds';
import { formatINR, formatPct } from '../lib/format';
import { singleDraft } from '../lib/invest';
import { defaultPay, PAYDAY_COPY, paydayCushionTarget, paydayFromState, validatePay } from '../lib/paydaySplit';
import { cushionStep } from '../lib/planner';
import { cushionFundId } from '../lib/planStatus';
import { goBack, navigate } from '../router';
import { useStore } from '../state/store';

const digits = (n: number) => String(Math.round(n));

export function Payday({ query = {} }: { query?: Record<string, string> }) {
  const { state, dispatch } = useStore();
  const fromQuery = validatePay(query.pay ?? '');
  const [payText, setPayText] = useState(digits(fromQuery.ok ? fromQuery.value : defaultPay(state)));
  const [targetText, setTargetText] = useState(digits(paydayCushionTarget(state)));
  const [topUpText, setTopUpText] = useState<string | null>(null); // null = follow the suggestion
  const [editTarget, setEditTarget] = useState(false);

  const pay = validatePay(payText);
  const targetNum = Number(targetText.replace(/,/g, ''));
  const target = Number.isFinite(targetNum) && targetNum >= 0 ? Math.round(targetNum) : 0;
  const split = paydayFromState(state, pay.ok ? pay.value : 0, target);

  // "Change any number": a typed top-up replaces the suggestion; the rest follows.
  const typedTopUp = topUpText === null ? null : Number(topUpText.replace(/,/g, ''));
  const maxTopUp = Math.max(0, (pay.ok ? pay.value : 0) - split.toSips);
  const topUpError =
    typedTopUp === null
      ? undefined
      : !Number.isInteger(typedTopUp) || topUpText === ''
        ? 'Enter a whole amount, or ₹0.'
        : typedTopUp > 0 && typedTopUp < 100
          ? 'The smallest top-up is ₹100.'
          : typedTopUp > maxTopUp
            ? `That’s more than is left after SIPs (${formatINR(maxTopUp)}).`
            : undefined;
  const topUp = typedTopUp !== null && !topUpError ? typedTopUp : split.topUp;
  const toSpend = Math.max(0, (pay.ok ? pay.value : 0) - split.toSips - topUp);
  // QA #20: a first ₹10,000 leads; the full target is a small second line.
  const step = cushionStep(split.cushionValue, split.cushionTarget);
  const cushionPct = step.main > 0 ? Math.min(100, (split.cushionValue / step.main) * 100) : 100;
  // Stage 7a: the app doesn't choose a fund. The top-up goes to the liquid fund the user picked or holds.
  const fundId = cushionFundId(state);
  const fund = fundId ? getFund(fundId) : undefined;
  const minTopUp = fund?.minOneTime ?? 500;
  const canTopUp = pay.ok && !!fund && topUp >= minTopUp && !topUpError;

  const topUpNow = () => {
    if (!canTopUp || !fundId) return;
    dispatch({ type: 'startInvestDraft', draft: singleDraft(fundId, { type: 'one_time', amount: topUp }) });
    navigate(`/invest/${fundId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink fallback="/home">Home</BackLink>
      <header>
        <h1 className="text-3xl font-bold text-ink">Got paid? Split it</h1>
        <p className="mt-1 text-base text-ink-muted">{PAYDAY_COPY}</p>
      </header>

      <Card pad="lg">
        <AmountInput
          label="Amount you received"
          value={payText}
          onChange={(v) => {
            setPayText(v);
            setTopUpText(null);
          }}
          error={pay.ok ? undefined : pay.error}
          note="Simulated pay credit. Nothing leaves your bank here."
        />
      </Card>

      <Card pad="lg" aria-labelledby="split-title">
        <h2 id="split-title" className="text-lg font-semibold text-ink">
          A suggested split
        </h2>
        <dl className="mt-3 divide-y divide-border" aria-live="polite">
          <div className="flex items-start justify-between gap-4 py-4">
            <dt>
              <span className="block font-semibold text-ink">Already going to SIPs</span>
              <span className="block text-sm text-ink-muted">Your active monthly SIPs. Skip any month, free.</span>
            </dt>
            <dd className="text-xl font-bold tabular-nums text-ink">{formatINR(split.toSips)}</dd>
          </div>
          <div className="py-4">
            <div className="flex items-start justify-between gap-4">
              <dt>
                <span className="block font-semibold text-ink">
                  <Term id="cushion">Emergency fund</Term> top-up
                </span>
                <span className="block text-sm text-ink-muted">
                  {split.saidHasCushion
                    ? 'You said you have an emergency fund, so nothing extra.'
                    : split.cushionGap > 0
                      ? '10% of pay, up to what your emergency fund still needs.'
                      : 'Your emergency fund is at its target, so nothing extra.'}
                </span>
              </dt>
              <dd className="text-xl font-bold tabular-nums text-ink">{formatINR(topUp)}</dd>
            </div>
            <div className="mt-3">
              {topUpText === null ? (
                <button
                  type="button"
                  onClick={() => setTopUpText(digits(topUp))}
                  className="inline-flex min-h-tap items-center gap-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
                >
                  Change top-up
                </button>
              ) : (
                <>
                  <AmountInput label="Your top-up" value={topUpText} onChange={setTopUpText} error={topUpError} note={`Suggested: ${formatINR(split.topUp)}.`} />
                  <button
                    type="button"
                    onClick={() => setTopUpText(null)}
                    className="inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
                  >
                    Use the suggestion
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 py-4">
            <dt>
              <span className="block font-semibold text-ink">Yours to spend</span>
              <span className="block text-sm text-ink-muted">This part is yours. Spend it however you like.</span>
            </dt>
            <dd className="text-xl font-bold tabular-nums text-ink">{formatINR(toSpend)}</dd>
          </div>
        </dl>
        {split.note && pay.ok && (
          <div className="mt-2">
            <Note tone="caution">{split.note}</Note>
          </div>
        )}
      </Card>

      <Card pad="lg" tint="sky" aria-labelledby="cushion-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cushion-title" className="text-lg font-semibold text-ink">
            Your emergency fund
          </h2>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-muted">Illustrative values</span>
        </div>
        {split.saidHasCushion ? (
          <p className="mt-2 text-base text-ink">You said you have an emergency fund. No top-up is suggested.</p>
        ) : (
          <>
            <p className="mt-2 text-base tabular-nums text-ink">
              {formatINR(split.cushionValue)} of {step.first ? 'a first ' : ''}
              {formatINR(step.main)} ({formatPct(cushionPct, 0)})
            </p>
            <ProgressBar className="mt-2" value={Math.round(cushionPct)} label={`Emergency fund: ${Math.round(cushionPct)}% of ${step.first ? 'the first step' : 'target'}`} />
            {step.first && <p className="mt-2 text-sm tabular-nums text-ink-muted">Full target: {formatINR(step.full)}</p>}
          </>
        )}
        <p className="mt-2 text-sm text-ink-muted">Emergency fund means money in liquid funds not saved for a goal, kept for sudden costs.</p>
        {split.saidHasCushion ? null : editTarget ? (
          <div className="mt-3">
            <AmountInput
              label="Emergency fund target"
              value={targetText}
              onChange={(v) => {
                setTargetText(v);
                setTopUpText(null);
              }}
              note="Three months of income is a common starting point."
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditTarget(true)}
            className="mt-2 inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
          >
            Change target
          </button>
        )}
      </Card>

      {/* Explains the top-up, so only when there is one (QA #12). */}
      {topUp > 0 && (
        <ConfidenceBlock
          compact
          what={<>A one-time top-up into {fund ? fund.name : 'the liquid fund you pick'}, a steady fund for money you may need soon.</>}
          why="You told us pay came in. An emergency fund means a surprise bill doesn’t force you to sell your long-term investments."
          next={<>You review the amount, then pay. Units arrive in 1–2 working days and show as emergency fund in Portfolio. Withdraw any time; money reaches your bank in 1–3 working days.</>}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!fund && topUp > 0 ? (
          <Button className="sm:flex-1" onClick={() => navigate('/plan')}>
            Pick an emergency fund first
          </Button>
        ) : canTopUp ? (
          <Button className="sm:flex-1" onClick={topUpNow}>
            Top up emergency fund with {formatINR(topUp)}
          </Button>
        ) : (
          <p className="flex items-center gap-2 rounded-card-sm bg-surface2 p-4 text-sm text-ink sm:flex-1">
            <Icon name="info" size={18} className="shrink-0 text-ink-muted" />
            {topUp === 0 ? 'No top-up this time. Nothing else to do.' : `The smallest top-up is ${formatINR(minTopUp)}.`}
          </p>
        )}
        <Button variant="secondary" className="sm:flex-1" onClick={() => goBack('/home')}>
          Not now
        </Button>
      </div>
      <Disclaimer />
    </div>
  );
}
