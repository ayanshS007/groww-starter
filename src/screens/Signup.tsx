// S2 Sign up (README 9 item 2): mobile → OTP → name. All simulated.
import { useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { FlowHeader } from '../components/FlowHeader';
import { maskMobile } from '../lib/format';
import { safeNext } from '../lib/routes';
import { checkMobile, checkName, checkOtp } from '../lib/validate';
import { goBack, navigate } from '../router';
import { useStore } from '../state/store';

type Sub = 'mobile' | 'otp' | 'name';

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  inputMode,
  autoComplete,
  maxLength,
  prefix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  inputMode?: 'numeric' | 'tel' | 'text';
  autoComplete?: string;
  maxLength?: number;
  prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className={`mt-2 flex min-h-[56px] items-center rounded-card-sm border-2 bg-surface px-4 focus-within:border-brand ${error ? 'border-caution' : 'border-border'}`}>
        {prefix && <span className="mr-2 text-lg font-medium text-ink-muted">{prefix}</span>}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoFocus
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
          className="w-full bg-transparent text-lg tabular-nums text-ink outline-none"
        />
      </div>
      <p id={`${id}-msg`} aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
        {error ? <span className="text-caution">{error}</span> : hint ? <span className="text-ink-muted">{hint}</span> : null}
      </p>
    </div>
  );
}

export function Signup({ query }: { query: Record<string, string> }) {
  const { dispatch } = useStore();
  const [sub, setSub] = useState<Sub>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const next = safeNext(query.next) ?? '/home';

  const go = (s: Sub) => {
    setError(undefined);
    setSub(s);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sub === 'mobile') {
      const c = checkMobile(mobile);
      if (!c.ok) return setError(c.error);
      setMobile(c.value);
      return go('otp');
    }
    if (sub === 'otp') {
      const c = checkOtp(otp);
      if (!c.ok) return setError(c.error);
      return go('name');
    }
    const c = checkName(name);
    if (!c.ok) return setError(c.error);
    navigate(next, { replace: true });
    dispatch({ type: 'signUp', mobile, name: c.value });
  };

  const back = sub === 'otp' ? () => go('mobile') : sub === 'name' ? () => go('otp') : () => goBack('/');
  const step = sub === 'mobile' ? 1 : sub === 'otp' ? 2 : 3;

  return (
    <>
      <FlowHeader onBack={back} closeTo="/" step={step} steps={3} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-tablet px-safe pb-10 pt-6 outline-none">
        <form onSubmit={submit} noValidate className="space-y-6">
          {sub === 'mobile' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-ink">Start with your number</h1>
                <p className="mt-2 text-base text-ink-muted">No KYC needed to look around.</p>
              </div>
              <Field
                id="mobile"
                label="Mobile number"
                prefix="+91"
                value={mobile}
                onChange={(v) => {
                  setMobile(v);
                  setError(undefined);
                }}
                error={error}
                hint="We’ll send a code. In this demo, no SMS is sent."
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={12}
              />
              <Button type="submit" block>
                Send code
              </Button>
            </>
          )}
          {sub === 'otp' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-ink">Enter the code</h1>
                <p className="mt-2 text-base text-ink-muted">Sent to +91 {maskMobile(mobile)}.</p>
              </div>
              <Field
                id="otp"
                label="6-digit code"
                value={otp}
                onChange={(v) => {
                  setOtp(v.replace(/\D/g, '').slice(0, 6));
                  setError(undefined);
                }}
                error={error}
                hint="Demo: any 6 digits"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
              />
              <Button type="submit" block>
                Verify
              </Button>
              <Button variant="quiet" block onClick={() => go('mobile')}>
                Change number
              </Button>
            </>
          )}
          {sub === 'name' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-ink">What should we call you?</h1>
                <p className="mt-2 text-base text-ink-muted">Your first name is enough.</p>
              </div>
              <Field
                id="name"
                label="Your name"
                value={name}
                onChange={(v) => {
                  setName(v);
                  setError(undefined);
                }}
                error={error}
                autoComplete="given-name"
                maxLength={40}
              />
              <Button type="submit" block>
                Continue
              </Button>
            </>
          )}
        </form>
      </main>
    </>
  );
}
