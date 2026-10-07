// S12 Success (README 9 item 9, PLAN item 32). Variant headline, three "what
// happens next" steps, no confetti and no share buttons. Back goes to Portfolio,
// never back into payment.
import { useEffect } from 'react';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { Icon } from '../components/Icon';
import { LetterAvatar } from '../components/LetterAvatar';
import { formatINR, ordinal } from '../lib/format';
import { successInfo } from '../lib/invest';
import { nextStep } from '../lib/nextStep';
import { navigate } from '../router';
import { useStore } from '../state/store';

const ROLE = { cushion: 'Cushion', grow: 'Grow' } as const;

/** Back from here (not a click on this page) goes to Portfolio, whatever came before payment. */
function useBackGoesToPortfolio() {
  useEffect(() => {
    let own = false;
    let timer: number | undefined;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('a[href], button')) return;
      own = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (own = false), 800);
    };
    const onHash = () => {
      if (own || window.location.hash.startsWith('#/invest/success')) return;
      navigate('/portfolio', { replace: true });
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('hashchange', onHash);
      window.clearTimeout(timer);
    };
  }, []);
}

export function Success({ orderId }: { orderId: string }) {
  const { state } = useStore();
  useBackGoesToPortfolio();
  const info = successInfo(state, orderId);
  if (!info) return null;
  const monthly = info.kind === 'plan' || info.kind === 'first_sip' || info.kind === 'sip';
  const step = nextStep(state);
  const offerSecond = info.single && (info.kind === 'first_sip' || info.kind === 'sip') && step.kind === 'second_bucket';

  return (
    <div className="mx-auto max-w-tablet space-y-6 pb-4 pt-2 lg:pt-6">
      <header className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-mint text-brand-text">
          <Icon name="check" size={40} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink">{info.headline}</h1>
        <p role="status" className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface2 px-3 py-1 text-sm text-ink">
          <Icon name={info.processing ? 'calendar' : 'check'} size={16} />
          {info.processing ? 'Processing (simulated). Units show in Portfolio.' : 'Done (simulated).'}
        </p>
      </header>

      <Card pad="md" aria-label="What you set up">
        <ul className="divide-y divide-border">
          {info.rows.map((r) => (
            <li key={r.fundId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <LetterAvatar name={r.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{r.name}</p>
                <p className="text-sm text-ink-muted">
                  {r.role ? `${ROLE[r.role]} · ` : ''}
                  {monthly && r.day
                    ? `on the ${ordinal(r.day)} of each month`
                    : info.kind === 'buy' && r.units
                      ? `${r.units} share${r.units === 1 ? '' : 's'} · delivery`
                      : 'One time'}
                </p>
              </div>
              <p className="text-right font-bold tabular-nums text-ink">
                {formatINR(r.amount)}
                {monthly && <span className="block text-xs font-medium text-ink-muted">a month</span>}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="next-title">
        <h2 id="next-title" className="text-lg font-semibold text-ink">
          What happens next
        </h2>
        <ol className="mt-3 space-y-3">
          {info.steps.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-card-sm border border-border bg-surface p-4 text-base text-ink">
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-brand-text">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-3">
        <ButtonLink to="/portfolio" block>
          Go to portfolio
        </ButtonLink>
        {offerSecond && (
          <ButtonLink to={step.to} variant="secondary" block>
            {step.title}
          </ButtonLink>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
