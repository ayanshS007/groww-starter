// S6 KYC (README 9 item 6, PLAN item 19): PAN → Aadhaar last 4 + OTP → selfie
// → bank via UPI ₹1 check → "You're verified". All simulated; nothing is stored
// except which steps are done.
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Button, ButtonLink } from '../components/Button';
import { FlowHeader } from '../components/FlowHeader';
import { Icon } from '../components/Icon';
import { Term } from '../components/Term';
import { buildPath, safeNext } from '../lib/routes';
import { checkAadhaarLast4, checkOtp, checkPan } from '../lib/validate';
import { navigate } from '../router';
import { useStore } from '../state/store';
import type { KycProgress } from '../state/types';

const SIMULATED = 'Simulated. No real data is checked or stored.';

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
  autoFocus?: boolean;
  upper?: boolean;
}) {
  const { id, label, value, onChange, error, hint, inputMode, maxLength, autoFocus, upper } = props;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={`${id}-msg`}
        className={`mt-2 min-h-[56px] w-full rounded-card-sm border-2 bg-surface px-4 text-lg tracking-wider text-ink outline-none focus:border-brand ${
          error ? 'border-caution' : 'border-border'
        }`}
      />
      <p id={`${id}-msg`} aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
        {error ? <span className="text-caution">{error}</span> : hint ? <span className="text-ink-muted">{hint}</span> : null}
      </p>
    </div>
  );
}

function StepShell({ title, sub, children }: { title: string; sub: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-base text-ink-muted">{sub}</p>
      </div>
      {children}
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Icon name="shield" size={18} />
        {SIMULATED}
      </p>
    </div>
  );
}

/** First step that isn't done yet; later steps can't be skipped to. */
function firstOpenStep(p: KycProgress | undefined): 1 | 2 | 3 | 4 {
  if (!p?.panOk) return 1;
  if (!p.aadhaarOk) return 2;
  if (!p.selfieOk) return 3;
  return 4;
}

function Verified({ next }: { next?: string }) {
  const toPayment = next?.startsWith('/invest') || next?.startsWith('/stock');
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-tablet flex-col items-center px-safe pt-16 text-center outline-none">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-mint text-brand-text">
        <Icon name="check" size={40} strokeWidth={2.5} />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-ink">You’re verified</h1>
      <p className="mt-2 max-w-sm text-base text-ink-muted">
        Your bank is linked. You won’t need to do this again. (Simulated.)
      </p>
      <ButtonLink to={next ?? '/you'} replace className="mt-8 w-full sm:w-auto sm:px-10">
        {toPayment ? 'Continue to payment' : 'Back to where you were'}
      </ButtonLink>
    </main>
  );
}

export function Kyc({ step: stepParam, query }: { step: string; query: Record<string, string> }) {
  const { state, dispatch } = useStore();
  const next = safeNext(query.next);
  const progress = state.kycProgress;
  const open = firstOpenStep(progress);
  const step = stepParam === 'done' ? 'done' : (Number(stepParam) as 1 | 2 | 3 | 4);
  const to = (n: number | 'done') => buildPath(`/kyc/${n}`, { next });

  // Steps can't be skipped: a direct URL to a later step goes to the first open one.
  useEffect(() => {
    if (step !== 'done' && step > open) navigate(to(open), { replace: true });
  });

  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [selfie, setSelfie] = useState(!!progress?.selfieOk);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<{ field: string; msg: string }>();

  if (step === 'done') return <Verified next={next} />;

  const closeTo = next ?? '/you';
  const onBack = () => (step > 1 ? navigate(to(step - 1)) : navigate(closeTo));
  const err = (field: string) => (error?.field === field ? error.msg : undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (step === 1) {
      const c = checkPan(pan);
      if (!c.ok) return setError({ field: 'pan', msg: c.error });
      dispatch({ type: 'kycAdvance', progress: { panOk: true, step: 2 } });
      return navigate(to(2));
    }
    if (step === 2) {
      const a = checkAadhaarLast4(aadhaar);
      if (!a.ok) return setError({ field: 'aadhaar', msg: a.error });
      if (!otpSent) return setOtpSent(true);
      const o = checkOtp(otp);
      if (!o.ok) return setError({ field: 'otp', msg: o.error });
      dispatch({ type: 'kycAdvance', progress: { aadhaarOk: true, step: 3 } });
      return navigate(to(3));
    }
    if (step === 3) {
      if (!selfie) return setError({ field: 'selfie', msg: 'Tap the tile to take your selfie first.' });
      dispatch({ type: 'kycAdvance', progress: { selfieOk: true, step: 4 } });
      return navigate(to(4));
    }
    setChecking(true);
    window.setTimeout(() => {
      // Outside a React event the hashchange could render before the dispatch;
      // flushSync makes the new path and the new state land in one render.
      flushSync(() => {
        navigate(to('done'), { replace: true });
        dispatch({ type: 'kycComplete' });
      });
    }, 1000);
  };

  let body: ReactNode;
  let cta = 'Continue';
  if (step === 1) {
    body = (
      <StepShell title="Your PAN" sub={<>Needed once for <Term id="kyc">KYC</Term>, the identity check every investor in India does.</>}>
        <TextField id="pan" label="PAN" value={pan} onChange={setPan} error={err('pan')} hint="Format: ABCDE1234F" maxLength={10} autoFocus upper />
      </StepShell>
    );
  } else if (step === 2) {
    cta = otpSent ? 'Verify' : 'Send code';
    body = (
      <StepShell title="Aadhaar check" sub="Only the last 4 digits. We never ask for the full number.">
        <TextField
          id="aadhaar"
          label="Last 4 digits of Aadhaar"
          value={aadhaar}
          onChange={(v) => setAadhaar(v.replace(/\D/g, '').slice(0, 4))}
          error={err('aadhaar')}
          inputMode="numeric"
          maxLength={4}
          autoFocus
        />
        {otpSent && (
          <TextField
            id="kyc-otp"
            label="6-digit code"
            value={otp}
            onChange={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            error={err('otp')}
            hint="Demo: any 6 digits"
            inputMode="numeric"
            maxLength={6}
            autoFocus
          />
        )}
      </StepShell>
    );
  } else if (step === 3) {
    body = (
      <StepShell title="A quick selfie" sub="Matches you to your documents. No camera is used in this demo.">
        <button
          type="button"
          onClick={() => {
            setSelfie(true);
            setError(undefined);
          }}
          aria-pressed={selfie}
          aria-describedby="selfie-msg"
          className={`flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 transition ${
            selfie ? 'border-brand bg-mint' : 'border-border bg-surface hover:bg-surface2'
          }`}
        >
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ${selfie ? 'bg-brand text-on-brand' : 'bg-lavender text-ink'}`}>
            <Icon name={selfie ? 'check' : 'user'} size={30} />
          </span>
          <span className="font-semibold text-ink">{selfie ? 'Selfie taken (simulated)' : 'Tap to take a selfie'}</span>
        </button>
        <p id="selfie-msg" aria-live="polite" className="min-h-[1.25rem] text-sm text-caution">
          {err('selfie')}
        </p>
      </StepShell>
    );
  } else {
    cta = checking ? 'Checking…' : 'Send ₹1 to verify';
    body = (
      <StepShell
        title="Link your bank"
        sub={<>We send ₹1 through <Term id="upi-autopay">UPI</Term> to confirm the account is yours. It’s returned right away.</>}
      >
        <div className="rounded-card bg-sky p-5">
          <p className="text-sm text-ink-muted">Bank account</p>
          <p className="mt-1 text-lg font-semibold text-ink">Sample Bank ••••4821</p>
          <p className="mt-1 text-sm text-ink-muted">From your UPI app (simulated)</p>
        </div>
        <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink">
          {checking ? 'Checking the ₹1 transfer…' : ''}
        </p>
      </StepShell>
    );
  }

  return (
    <>
      <FlowHeader onBack={onBack} closeTo={closeTo} closeLabel="Close, your progress is saved" step={step} steps={4} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-tablet px-safe pb-10 pt-6 outline-none">
        <form onSubmit={submit} noValidate className="space-y-6">
          {body}
          <Button type="submit" block disabled={checking} aria-busy={checking}>
            {cta}
          </Button>
        </form>
      </main>
    </>
  );
}
