// S10 Invest single fund and S11 Invest plan (README 9 item 9, PLAN items 4, 19,
// 20, 24, 27, 31). Single-fund review asks "What made you pick this?" (P1,
// README 8.7); the plan flow records 'plan' itself (PLAN C11). One flow
// component drives both. The step lives in state.investDraft, so a refresh resumes at the same step. KYC is asked only at
// payment; leaving KYC lands back on review, finishing it resumes at payment.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { AmountInput } from '../components/AmountInput';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Disclaimer } from '../components/Disclaimer';
import { FlowHeader } from '../components/FlowHeader';
import { focusMain } from '../components/focusMain';
import { Icon } from '../components/Icon';
import { LetterAvatar } from '../components/LetterAvatar';
import { Note } from '../components/Note';
import { OptionTiles } from '../components/OptionTile';
import { PickReasonChips } from '../components/PickReasonChips';
import { ReviewList } from '../components/ReviewList';
import { SkeletonRow } from '../components/SkeletonRow';
import { StepperInput } from '../components/StepperInput';
import { Term } from '../components/Term';
import { UpiChooser } from '../components/UpiChooser';
import { FundPicker } from '../components/FundPicker';
import { getFund, PLAN_CATEGORIES } from '../data/funds';
import { fundFit } from '../lib/explore';
import { dateLabel, formatINR, ordinal } from '../lib/format';
import {
  amountPresets,
  ceilingNote,
  checkUpiId,
  firstAutoDebit,
  isSalary,
  minFor,
  payToday,
  planBucketFor,
  planDraft,
  planParts,
  planPartsMatch,
  resolveStep,
  reviewRows,
  scheduleLine,
  singleDraft,
  stepAfter,
  stepBefore,
  stepProgress,
  suggestedDay,
  validateInvestAmount,
  type InvestType,
  type StepContext,
} from '../lib/invest';
import { simToday } from '../lib/market';
import { missingBuckets, unpickedBuckets } from '../lib/planStatus';
import { defaultSipDay } from '../lib/planner';
import { buildPath } from '../lib/routes';
import { goBack, navigate } from '../router';
import { nextOrderId } from '../state/reducer';
import { useStore } from '../state/store';
import type { FundId, InvestDraft, InvestStep, UpiApp } from '../state/types';

const PROCESSING_MS = 1000;

type FlowProps = { mode: 'single'; fundId: FundId; query: Record<string, string> } | { mode: 'plan' };

function Shell({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-tablet px-safe pb-10 pt-6 outline-none">
      {children}
      <Disclaimer className="mt-8" />
    </main>
  );
}

function StepTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      {sub && <p className="mt-2 text-base text-ink-muted">{sub}</p>}
    </div>
  );
}

function FundBanner({ fundId }: { fundId: FundId }) {
  const fund = getFund(fundId)!;
  return (
    <div className="flex items-center gap-3 rounded-card-sm bg-surface2 p-3">
      <LetterAvatar name={fund.name} />
      <div className="min-w-0">
        <p className="font-semibold text-ink">{fund.name}</p>
        <p className="text-sm text-ink-muted">{fund.category} fund · sample</p>
      </div>
    </div>
  );
}

// ---------- steps ----------
/**
 * Plan flow, before anything else: the plan names a category for each part and the
 * user picks the fund (Stage 7a). Shown only for parts that have no pick yet.
 */
function PickStep({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useStore();
  const missing = missingBuckets(state).map((b) => b.role);
  const buckets = (state.plan?.buckets ?? []).filter((b) => missing.includes(b.role));
  const allPicked = unpickedBuckets(state).length === 0;
  return (
    <div className="space-y-6">
      <StepTitle title="Pick a fund for each part" sub="Your plan names the category. You choose the fund." />
      {buckets.map((b) => (
        <Card key={b.role} pad="md" className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink-muted">{b.role === 'cushion' ? 'Cushion' : 'Grow'} · {formatINR(b.amount)} a month</p>
            <h2 className="text-xl font-bold text-ink">{PLAN_CATEGORIES[b.category].label}</h2>
          </div>
          <FundPicker
            bucket={b}
            name={`pick-${b.role}`}
            value={b.fundId}
            onChange={(fundId) => dispatch({ type: 'pickPlanFund', role: b.role, fundId })}
          />
        </Card>
      ))}
      <div className="space-y-3">
        <Button block disabled={!allPicked} aria-describedby="pick-hint" onClick={onContinue}>
          Continue
        </Button>
        <p id="pick-hint" aria-live="polite" className="text-center text-sm text-ink-muted">
          {allPicked ? 'You can change a pick later from your plan.' : 'Pick a fund in each list to continue.'}
        </p>
      </div>
    </div>
  );
}

type StepProps = { d: InvestDraft; ctx: StepContext; patch: (p: Partial<InvestDraft>) => void };

function AmountStep({ d, ctx, patch }: StepProps) {
  const { state } = useStore();
  const fund = getFund(d.fundId!)!;
  const [type, setType] = useState<InvestType>(d.type);
  const [text, setText] = useState(d.amount ? String(d.amount) : '');
  const [touched, setTouched] = useState(false);
  const min = minFor(fund, type);
  const check = validateInvestAmount(text, { min, type });
  const planAmount = planBucketFor(state, fund.id)?.amount;
  const presets = amountPresets(min, type === 'sip' ? planAmount : undefined);
  const error = touched && !check.ok ? check.error : undefined;
  const ceiling = type === 'sip' && check.ok ? ceilingNote(state, check.value, [fund.id]) : undefined;
  const note = [`Smallest ${type === 'sip' ? 'SIP' : 'one-time amount'} here: ${formatINR(min)}.`, ceiling].filter(Boolean).join(' ');

  const submit = () => {
    setTouched(true);
    if (!check.ok) return;
    const same = d.amount === check.value && d.type === type;
    patch({ type, amount: check.value, riskAck: same ? d.riskAck : false, step: stepAfter({ ...d, type, amount: check.value, step: 'amount' }, ctx) });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="space-y-6"
    >
      <StepTitle title="How much?" sub={<>Start small, even ₹100. You can change it later and skip a month, free.</>} />
      <FundBanner fundId={fund.id} />
      <OptionTiles
        name="invest-type"
        legend="How do you want to invest?"
        columns={2}
        value={type}
        onChange={(v) => {
          setType(v);
          patch({ type: v });
        }}
        options={[
          { value: 'sip', label: 'Monthly SIP', hint: 'Same amount each month' },
          { value: 'one_time', label: 'One-time', hint: 'Pay once' },
        ]}
      />
      <p className="-mt-3 text-sm text-ink-muted">
        A <Term id="sip">SIP</Term> invests a fixed amount on a date you pick. A <Term id="lump-sum">one-time</Term> payment goes in all at once.
      </p>
      <div>
        <AmountInput
          label={type === 'sip' ? 'Amount each month' : 'Amount to invest'}
          value={text}
          onChange={(v) => {
            setText(v);
            setTouched(true);
          }}
          onBlur={() => text !== '' && setTouched(true)}
          error={error}
          note={note}
          autoFocus
        />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
          {presets.map((p) => (
            <Chip
              key={p.value}
              selected={text.replace(/,/g, '') === String(p.value)}
              onClick={() => {
                setText(String(p.value));
                setTouched(true);
              }}
            >
              {formatINR(p.value)}
              {p.fromPlan ? ' · your plan' : ''}
            </Chip>
          ))}
        </div>
      </div>
      <Button type="submit" block>
        Continue
      </Button>
    </form>
  );
}

function DateStep({ d, ctx, patch }: StepProps) {
  const { state, dispatch } = useStore();
  const salary = isSalary(state);
  const payday = state.user.payday ?? 1;
  const day = d.dayOfMonth ?? suggestedDay(state);
  const today = simToday(state.market);
  const total = payToday(d);
  const first = firstAutoDebit(today, day);
  const plan = d.mode === 'plan' && d.planAmounts && d.planAmounts.length > 1;
  const dayFmt = (v: number) => ordinal(v);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        patch({ dayOfMonth: day, step: stepAfter(d, ctx) });
      }}
      className="space-y-6"
    >
      <StepTitle
        title={plan ? 'Pick one date for both SIPs' : 'Pick your SIP date'}
        sub={salary ? 'The days right after payday are the easiest time to spare money.' : 'Money can come unevenly, so we start on the 10th.'}
      />
      {d.mode === 'single' && d.fundId && <FundBanner fundId={d.fundId} />}
      {salary && (
        <StepperInput
          label="Which day do you get paid?"
          value={payday}
          min={1}
          max={28}
          format={dayFmt}
          onChange={(v) => {
            dispatch({ type: 'setPayday', day: v });
            patch({ dayOfMonth: defaultSipDay('salary', v) });
          }}
          hint="We’ll suggest a date 3 days after payday."
        />
      )}
      <StepperInput
        label="SIP date"
        value={day}
        min={1}
        max={28}
        format={dayFmt}
        onChange={(v) => patch({ dayOfMonth: v })}
        hint={
          salary
            ? `Suggested: the ${ordinal(suggestedDay(state))}, 3 days after payday. Pick any day from 1 to 28.`
            : 'Suggested: the 10th. Skip any month, free. Pick any day from 1 to 28.'
        }
      />
      <Card tint="mint" pad="md" aria-live="polite">
        <p className="text-base text-ink">
          Today: your first payment of <span className="font-semibold tabular-nums">{formatINR(total)}</span>.
        </p>
        <p className="mt-1 text-base text-ink">
          Then on the <span className="font-semibold">{ordinal(day)}</span> of each month, starting {dateLabel(first, { short: true })}.
        </p>
      </Card>
      <Button type="submit" block>
        Continue
      </Button>
    </form>
  );
}

function ReviewStep({ d, mode, patch, back }: StepProps & { mode: 'single' | 'plan'; back: (to: InvestStep) => void }) {
  const { state } = useStore();
  const rows = reviewRows(d);
  const monthly = d.type === 'sip';
  const day = d.dayOfMonth ?? suggestedDay(state);
  const today = simToday(state.market);
  const total = payToday(d);
  const nextUrl = mode === 'plan' ? '/invest/plan' : `/invest/${d.fundId}`;
  const fund = d.fundId ? getFund(d.fundId) : undefined;
  const note = monthly ? ceilingNote(state, total, rows.map((r) => r.fundId)) : undefined;

  // PLAN item 19: sign-up and KYC only at payment, then straight back to pay.
  const toPayment = () => {
    patch({ step: 'pay', dayOfMonth: monthly ? day : d.dayOfMonth });
    if (!state.user.signedUp) navigate(buildPath('/signup', { next: buildPath('/kyc/1', { next: nextUrl }) }));
    else if (state.user.kyc !== 'done') navigate(buildPath('/kyc/1', { next: nextUrl }));
  };

  const why =
    mode === 'plan'
      ? rows.map((r) => planBucketFor(state, r.fundId)?.reason).filter(Boolean).join(' ')
      : fund
        ? fundFit(fund, state).why
        : '';

  return (
    <div className="space-y-6">
      <StepTitle title="Review and confirm" sub="Check each line. Nothing is charged until you pay." />
      <ReviewList
        rows={rows}
        monthly={monthly}
        day={monthly ? day : undefined}
        acked={d.riskAck}
        onAck={(v) => patch({ riskAck: v })}
        onChangeAmount={mode === 'single' ? () => back('amount') : undefined}
        onChangeDate={monthly ? () => back('date') : undefined}
      />
      {note && <Note tone="caution">{note}</Note>}
      {mode === 'single' && (
        <PickReasonChips
          value={d.pickReason}
          onChange={(pickReason) => patch({ pickReason })}
          offerDone={!!d.tipCheckOffered}
          onSkipOffer={() => patch({ tipCheckOffered: true })}
          onRunTipCheck={() => {
            patch({ tipCheckOffered: true });
            navigate(buildPath('/learn/tip-check', { next: nextUrl }));
          }}
        />
      )}
      <ConfidenceBlock
        compact
        what={
          monthly ? (
            <>
              {rows.length > 1 ? `${rows.length} monthly` : 'A monthly'} <Term id="sip">SIP</Term>
              {rows.length > 1 ? 's' : ''}: a fixed amount goes in on the {ordinal(day)}, whatever the market did.
            </>
          ) : (
            <>A <Term id="lump-sum">one-time</Term> investment: the money goes in once and buys units at the next price.</>
          )
        }
        why={why || 'You chose this fund yourself.'}
        next={
          monthly ? (
            <>
              You pay {formatINR(total)} today. Then on the {ordinal(day)}, starting {dateLabel(firstAutoDebit(today, day), { short: true })}. Skip any month, free.
            </>
          ) : (
            <>You pay {formatINR(total)} today. Units arrive in 1–2 working days. Withdraw any time.</>
          )
        }
      />
      {state.user.autopay && monthly && <p className="text-sm text-ink-muted">Uses your existing autopay.</p>}
      <div className="space-y-3">
        <Button block disabled={!d.riskAck} aria-describedby="ack-hint" onClick={toPayment}>
          Continue to payment
        </Button>
        <p id="ack-hint" className="text-center text-sm text-ink-muted">
          {d.riskAck ? 'A quick verification comes next if you haven’t done it yet.' : 'Tick the box above to continue.'}
        </p>
        {mode === 'plan' && (
          <Button block variant="quiet" onClick={() => navigate('/plan')}>
            Change split
          </Button>
        )}
      </div>
    </div>
  );
}

function PayStep({ d, ctx, patch }: StepProps) {
  const { state } = useStore();
  const [app, setApp] = useState<UpiApp | undefined>(d.upiApp);
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState<string>();
  const total = payToday(d);
  const monthly = d.type === 'sip';

  const pay = () => {
    if (!app) return setError('Pick how you’d like to pay.');
    if (app === 'upi_id') {
      const c = checkUpiId(upiId);
      if (!c.ok) return setError(c.error);
    }
    patch({ upiApp: app, step: stepAfter(d, ctx) });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        pay();
      }}
      noValidate
      className="space-y-6"
    >
      <StepTitle title="Pay" sub={<>You pay <span className="font-semibold tabular-nums text-ink">{formatINR(total)}</span> today. Simulated: no money moves.</>} />
      <UpiChooser
        value={app}
        onChange={(v) => {
          setApp(v);
          setError(undefined);
        }}
        upiId={upiId}
        onUpiId={(v) => {
          setUpiId(v);
          setError(undefined);
        }}
        error={error}
      />
      {monthly && state.user.autopay && <p className="text-sm text-ink-muted">Uses your existing autopay.</p>}
      <Button type="submit" block>
        Pay {formatINR(total)}
      </Button>
    </form>
  );
}

function MandateStep({ d, patch }: StepProps) {
  const { state } = useStore();
  const total = payToday(d);
  const day = d.dayOfMonth ?? suggestedDay(state);
  const first = firstAutoDebit(simToday(state.market), day);
  const rows = reviewRows(d);
  return (
    <div className="space-y-6">
      <StepTitle
        title="Set up autopay"
        sub={
          <>
            An <Term id="mandate">autopay</Term> lets your bank send each month’s <Term id="sip">SIP</Term> without you doing anything. It’s one approval for {rows.length > 1 ? 'both SIPs' : 'this SIP'}.
          </>
        }
      />
      <dl className="divide-y divide-border rounded-card border border-border bg-surface text-base">
        <div className="flex justify-between gap-3 p-4">
          <dt className="text-ink-muted">Most it can take in a month</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatINR(total)}</dd>
        </div>
        <div className="flex justify-between gap-3 p-4">
          <dt className="text-ink-muted">How often</dt>
          <dd className="font-semibold text-ink">{scheduleLine(day)}</dd>
        </div>
        <div className="flex justify-between gap-3 p-4">
          <dt className="text-ink-muted">Next automatic payment</dt>
          <dd className="font-semibold text-ink">{dateLabel(first, { short: true })}</dd>
        </div>
      </dl>
      <p className="flex items-start gap-2 text-sm text-ink-muted">
        <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
        <span>Skip, pause or stop any time from Portfolio. Nothing is locked in. Simulated: no real mandate is created.</span>
      </p>
      <Button block onClick={() => patch({ step: 'processing' })}>
        Approve autopay
      </Button>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="space-y-6 pt-10" aria-busy="true">
      <h1 className="text-3xl font-bold text-ink">Setting things up…</h1>
      <p role="status" aria-live="polite" className="text-base text-ink-muted">
        Confirming your payment. This takes a moment.
      </p>
      <div className="space-y-4">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

// ---------- flow ----------
function InvestFlow(props: FlowProps) {
  const { state, dispatch } = useStore();
  const mode = props.mode;
  const fundId = props.mode === 'single' ? props.fundId : undefined;
  const saved = state.investDraft;
  const matches = !!saved && saved.mode === mode && (mode === 'plan' || saved.fundId === fundId);

  // The starting draft. A saved draft for this same flow is resumed (PLAN item 20).
  const fresh = (() => {
    if (mode === 'plan') return planDraft(state);
    const fund = getFund(fundId!)!;
    const preset = Number(props.mode === 'single' ? props.query.amount : NaN);
    const planAmount = planBucketFor(state, fund.id)?.amount;
    const amount = Number.isInteger(preset) && preset >= fund.minSip ? preset : planAmount && planAmount >= fund.minSip ? planAmount : undefined;
    return singleDraft(fund.id, { amount });
  })();
  const d: InvestDraft = matches ? saved! : { ...fresh, startedAt: simToday(state.market) };

  useEffect(() => {
    if (!matches) dispatch({ type: 'startInvestDraft', draft: fresh });
    // Only when the saved draft doesn't belong to this flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, mode, fundId]);

  // Plan flow: the draft always follows the current plan (a part with a running SIP is left out).
  useEffect(() => {
    if (matches && mode === 'plan' && !planPartsMatch(d, state)) {
      dispatch({
        type: 'updateInvestDraft',
        patch: { planAmounts: planParts(state), riskAck: false, step: d.step === 'date' ? 'date' : 'review' },
      });
    }
  }, [matches, mode, d, state, dispatch]);

  // Plan flow: a part with no fund picked asks for one first. Stays up until Continue.
  const [picking, setPicking] = useState(() => mode === 'plan' && unpickedBuckets(state).length > 0);
  const ctx: StepContext = { autopay: state.user.autopay, kycDone: state.user.kyc === 'done' };
  const step = resolveStep(d, ctx);
  const progress = stepProgress(d, ctx);
  const patch = (p: Partial<InvestDraft>) => dispatch({ type: 'updateInvestDraft', patch: p });

  // New step: scroll up and move focus to the content (not on first render).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    focusMain();
  }, [step]);

  // Processing: about a second, then place the order and replace this entry with Success.
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!matches || step !== 'processing') return;
    const timer = window.setTimeout(() => {
      const id = nextOrderId(stateRef.current);
      // Same render for the new path and the new state, so no guard sees one without the other.
      flushSync(() => {
        navigate(`/invest/success/${id}`, { replace: true });
        dispatch({ type: 'placeInvestOrder' });
      });
    }, PROCESSING_MS);
    return () => window.clearTimeout(timer);
  }, [matches, step, dispatch]);

  const closeTo = mode === 'plan' ? '/plan' : `/fund/${fundId}`;
  const before = stepBefore(d, ctx);
  const onBack = step === 'processing' ? undefined : () => (before ? patch({ step: before }) : goBack(closeTo));

  const stepProps: StepProps = { d, ctx, patch };
  let body: ReactNode;
  switch (step) {
    case 'amount':
      body = <AmountStep {...stepProps} />;
      break;
    case 'date':
      body = <DateStep {...stepProps} />;
      break;
    case 'review':
      body = <ReviewStep {...stepProps} mode={mode} back={(to) => patch({ step: to })} />;
      break;
    case 'pay':
      body = <PayStep {...stepProps} />;
      break;
    case 'mandate':
      body = <MandateStep {...stepProps} />;
      break;
    default:
      body = <ProcessingStep />;
  }

  if (mode === 'plan' && picking) {
    return (
      <>
        <FlowHeader onBack={() => goBack('/plan')} closeTo="/plan" closeLabel="Close, your picks are saved" title="Pick your funds" />
        <Shell>
          <PickStep onContinue={() => setPicking(false)} />
        </Shell>
      </>
    );
  }

  return (
    <>
      <FlowHeader
        onBack={onBack}
        closeTo={closeTo}
        closeLabel="Close, your progress is saved"
        step={step === 'processing' ? progress.of : progress.n}
        steps={progress.of}
      />
      <Shell>{body}</Shell>
    </>
  );
}

export function Invest({ fundId, query }: { fundId: FundId; query: Record<string, string> }) {
  return <InvestFlow mode="single" fundId={fundId} query={query} />;
}

export function InvestPlan() {
  return <InvestFlow mode="plan" />;
}
