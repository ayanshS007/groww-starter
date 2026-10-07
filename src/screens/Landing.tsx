// S1 Landing (README 9 item 1). No tickers, offers, returns or user counts.
// Stage 6a: bold hero over the drifting blobs, then a 3-card value bento. No stats.
import type { CSSProperties, ReactNode } from 'react';
import { ButtonLink } from '../components/Button';
import { HomeBackdrop } from '../components/HomeBackdrop';
import { Icon } from '../components/Icon';
import { Wordmark } from '../components/Wordmark';
import { buildPath } from '../lib/routes';
import { Link } from '../router';
import { useStore } from '../state/store';

type Bento = { title: string; body: string; tint: string; art: ReactNode; className: string };

// Small geometric illustrations for the bento cards: inline SVG, decorative.
const StepsArt = () => (
  <svg aria-hidden viewBox="0 0 200 32" preserveAspectRatio="xMinYMid meet" className="h-8 w-[200px] text-brand-text" fill="none">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle key={i} cx={14 + i * 33} cy={16} r={12} className={i < 5 ? 'fill-brand' : 'fill-surface'} stroke="currentColor" strokeWidth={i < 5 ? 0 : 2.5} />
    ))}
  </svg>
);
const SkipArt = () => (
  <svg aria-hidden viewBox="0 0 120 64" preserveAspectRatio="xMinYMid meet" className="h-16 w-32 lg:h-28 lg:w-56" fill="none">
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={4 + i * 29} y={14} width={22} height={36} rx={7} className={i === 2 ? 'fill-surface stroke-ink' : 'fill-surface'} strokeWidth={2} strokeDasharray={i === 2 ? '4 4' : undefined} />
    ))}
    <path d="M66 27l12 10M78 27l-12 10" className="stroke-ink" strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);
const WhyArt = () => (
  <svg aria-hidden viewBox="0 0 120 64" preserveAspectRatio="xMinYMid meet" className="h-16 w-32" fill="none">
    <rect x={4} y={8} width={84} height={40} rx={14} className="fill-surface" />
    <path d="M24 48l-6 12 16-12" className="fill-surface" />
    <path d="M38 22a8 8 0 1 1 10 8v4M48 40v1" className="stroke-ink" strokeWidth={3} strokeLinecap="round" />
    <circle cx={104} cy={22} r={12} className="fill-brand" />
  </svg>
);

const BENTO: Bento[] = [
  {
    title: 'A plan in 2 minutes',
    body: 'Six quick questions. You get a starter shortlist based on your answers, split into a cushion and a grow part.',
    tint: 'bg-mint',
    art: <StepsArt />,
    className: 'md:col-span-2 lg:col-span-2',
  },
  {
    title: 'Skip any month, free',
    body: 'Rent due? Skip or pause your SIP. Nothing resets and nothing is locked in.',
    tint: 'bg-peach',
    art: <SkipArt />,
    className: 'lg:row-span-2 lg:flex lg:flex-col lg:justify-between',
  },
  {
    title: 'Always see why',
    body: 'Every fund says what it is, why you’re seeing it, and what happens next. Every word, explained.',
    tint: 'bg-lavender',
    art: <WhyArt />,
    className: 'lg:col-span-2',
  },
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
      <HomeBackdrop sky={false} />
      <header className="mx-auto flex w-full max-w-content items-center px-safe py-4 lg:px-8">
        <Wordmark />
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto grid w-full max-w-content items-center gap-12 px-safe pb-10 pt-4 md:max-w-tablet lg:max-w-content lg:grid-cols-2 lg:px-8 lg:pt-10">
          <div className="anim-rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-brand-text shadow-sm">
              <Icon name="leaf" size={16} />
              For your first investment
            </p>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-ink md:text-6xl">
              Start investing with{' '}
              <span className="whitespace-nowrap bg-gradient-to-t from-brand/40 from-[38%] to-transparent to-[38%] px-1">₹100.</span>{' '}
              Understand every step.
            </h1>
            <p className="mt-5 text-xl text-ink-muted">A plan built on your answers, not on tips.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={start} className="sm:px-8">
                Get started
              </ButtonLink>
              <ButtonLink to="/home" variant="secondary" className="sm:px-8">
                Just exploring
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm text-ink-muted">
              Reviewer?{' '}
              <Link to="/review" className="inline-flex min-h-tap items-center font-semibold text-brand-text underline underline-offset-4">
                Load a demo
              </Link>
            </p>
          </div>
          <div className="hidden lg:block anim-rise" style={{ '--delay': '120ms' } as CSSProperties}>
            <HomeMock />
          </div>
        </div>

        <section aria-labelledby="why-starter" className="mx-auto w-full max-w-content px-safe pb-12 md:max-w-tablet lg:max-w-content lg:px-8">
          <h2 id="why-starter" className="sr-only">
            What you get
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENTO.map((b, i) => (
              <li
                key={b.title}
                className={`anim-rise rounded-card-lg p-6 lg:p-7 ${b.tint} ${b.className}`}
                style={{ '--delay': `${180 + i * 90}ms` } as CSSProperties}
              >
                {b.art}
                <div>
                  <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{b.title}</h3>
                  <p className="mt-2 text-base text-ink">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="mx-auto w-full max-w-content px-safe pb-6 text-xs text-ink-muted pb-safe lg:px-8">
        Illustrative prototype. No real money, prices or accounts.
      </footer>
    </div>
  );
}
