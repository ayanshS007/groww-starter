// S1 Landing (README 9 item 1). No tickers, offers, returns or user counts.
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { Wordmark } from '../components/Wordmark';
import { buildPath } from '../lib/routes';
import { Link } from '../router';
import { useStore } from '../state/store';

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'wallet', text: 'Start with ₹100 a month. Change it later.' },
  { icon: 'pause', text: 'Skip any month, free. No lock-in.' },
  { icon: 'book', text: 'Every word explained in plain English.' },
];

/** Static mock of the Starter home, for the desktop hero. Sample content only. */
function HomeMock() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-sm rounded-[32px] border border-border bg-bg p-4 shadow-xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-extrabold text-ink">Groww</span>
        <span className="h-7 w-7 rounded-full bg-lavender" />
      </div>
      <p className="mt-4 px-1 text-lg font-bold text-ink">Good morning, Riya</p>
      <p className="px-1 text-xs text-ink-muted">Your starter plan is ready: ₹4,000 a month.</p>
      <div className="mt-3 rounded-card bg-mint p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text">Your next step</p>
        <p className="mt-1 text-base font-bold leading-snug text-ink">Start your first SIP</p>
        <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-on-brand">Start my plan</span>
      </div>
      <div className="mt-3 rounded-card border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-ink">Your starter plan</p>
          <p className="text-lg font-bold tabular-nums text-ink">₹4,000</p>
        </div>
        <div className="mt-3 flex h-2.5 gap-1">
          <div className="w-1/2 rounded-full bg-brand/35" />
          <div className="w-1/2 rounded-full bg-brand" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
          <span>Cushion ₹2,000</span>
          <span>Grow ₹2,000</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-card bg-sky p-3">
          <p className="text-[11px] text-ink-muted">Cushion</p>
          <p className="text-sm font-semibold text-ink">Liquid fund</p>
        </div>
        <div className="rounded-card bg-lavender p-3">
          <p className="text-[11px] text-ink-muted">Grow</p>
          <p className="text-sm font-semibold text-ink">Index fund</p>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-ink-muted">Sample screen</p>
    </div>
  );
}

export function Landing() {
  const { state } = useStore();
  const start = state.plan ? '/home' : buildPath('/signup', { next: '/checkin/1' });

  return (
    <div className="flex flex-1 flex-col pt-safe">
      <header className="mx-auto flex w-full max-w-content items-center justify-between px-safe py-4 lg:px-8">
        <Wordmark />
        <Link to="/home" className="min-h-tap content-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
          Look around
        </Link>
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 items-center outline-none">
        <div className="mx-auto grid w-full max-w-content items-center gap-12 px-safe pb-12 pt-4 md:max-w-tablet lg:max-w-content lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-sm font-semibold text-brand-text">
              <Icon name="sparkle" size={16} />
              For your first investment
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink lg:text-5xl lg:leading-[1.1]">
              Start investing with ₹100. Understand every step.
            </h1>
            <p className="mt-4 text-lg text-ink-muted">A plan built on your answers, not on tips.</p>
            <ul className="mt-8 space-y-3">
              {POINTS.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-base text-ink">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand-text shadow-sm">
                    <Icon name={p.icon} size={20} />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={start} className="sm:px-8">
                Get started
              </ButtonLink>
              <ButtonLink to="/home" variant="secondary" className="sm:px-8">
                Just exploring
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              Reviewer?{' '}
              <Link to="/review" className="font-semibold text-brand-text underline underline-offset-4">
                Load a demo
              </Link>
            </p>
          </div>
          <div className="hidden lg:block">
            <HomeMock />
          </div>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-content px-safe pb-6 text-xs text-ink-muted pb-safe lg:px-8">
        Illustrative prototype. No real money, prices or accounts.
      </footer>
    </div>
  );
}
