// Simple geometric illustration + one line + one action (README 10).
import type { ReactNode } from 'react';

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-10 text-center">
      <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden className="text-brand">
        <rect x="8" y="30" width="18" height="34" rx="6" className="fill-mint" />
        <rect x="32" y="18" width="18" height="46" rx="6" className="fill-sky" />
        <rect x="56" y="8" width="18" height="56" rx="6" className="fill-lavender" />
        <circle cx="80" cy="14" r="8" fill="currentColor" />
      </svg>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {body && <div className="max-w-sm text-base text-ink-muted">{body}</div>}
      {action}
    </div>
  );
}
