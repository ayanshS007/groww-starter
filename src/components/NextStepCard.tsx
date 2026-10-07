// Home's single next action (README 9 item 5, PLAN C6). Holds the screen's primary button.
import type { NextStep } from '../lib/nextStep';
import { ButtonLink } from './Button';
import { Icon } from './Icon';

export function NextStepCard({ step }: { step: NextStep }) {
  const done = step.kind === 'set';
  return (
    <section
      aria-labelledby="next-step-title"
      className="relative overflow-hidden rounded-card-lg bg-mint p-6 lg:p-7"
    >
      <svg aria-hidden className="pointer-events-none absolute -right-6 -top-6 text-brand/20" width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="70" fill="currentColor" />
      </svg>
      <p className="relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-text">
        <Icon name={done ? 'check' : 'sparkle'} size={18} />
        {done ? 'All set' : 'Your next step'}
      </p>
      <h2 id="next-step-title" className="relative mt-2 text-2xl font-bold text-ink">
        {step.title}
      </h2>
      <p className="relative mt-2 max-w-prose text-base text-ink">{step.body}</p>
      <ButtonLink to={step.to} variant={done ? 'secondary' : 'primary'} className="relative mt-5">
        {step.cta}
        <Icon name="chevronRight" size={20} />
      </ButtonLink>
    </section>
  );
}
