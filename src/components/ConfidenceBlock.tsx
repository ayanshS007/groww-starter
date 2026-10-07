// The Confidence Layer (README 2): What is this? · Why am I seeing this? · What happens next?
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Props = {
  what: ReactNode;
  why: ReactNode;
  next: ReactNode;
  /**
   * Shortened version for screens other than Fund detail (PLAN item 28). The
   * shortening is in the text callers pass; the layout is the same stacked list
   * everywhere, since three side-by-side columns were too narrow (QA #36).
   */
  compact?: boolean;
  className?: string;
};

const ROWS: { key: 'what' | 'why' | 'next'; title: string; icon: IconName }[] = [
  { key: 'what', title: 'What is this?', icon: 'info' },
  { key: 'why', title: 'Why am I seeing this?', icon: 'sparkle' },
  { key: 'next', title: 'What happens next?', icon: 'calendar' },
];

export function ConfidenceBlock({ what, why, next, className = '' }: Props) {
  const body = { what, why, next };
  return (
    <section aria-label="About this decision" className={`grid gap-3 ${className}`}>
      {ROWS.map((r) => (
        <div key={r.key} className="rounded-card-sm border border-border bg-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-brand-text">
              <Icon name={r.icon} size={16} />
            </span>
            {r.title}
          </h3>
          <div className="mt-2 text-sm text-ink-muted">{body[r.key]}</div>
        </div>
      ))}
    </section>
  );
}
