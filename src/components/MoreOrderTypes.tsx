// Pro extra order types, explained only (Stage 6b). They can't be placed here.
import { MORE_ORDER_TYPES } from '../lib/stockBuy';
import { Icon } from './Icon';

export function MoreOrderTypes() {
  return (
    <details className="group rounded-card border border-border bg-surface">
      <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-ink">
        More order types, explained
        <Icon name="chevronDown" size={20} className="shrink-0 transition group-open:rotate-180" />
      </summary>
      <ul className="space-y-3 px-4 pb-4">
        {MORE_ORDER_TYPES.map((o) => (
          <li key={o.label} className="text-sm">
            <span className="font-semibold text-ink">{o.label}: </span>
            <span className="text-ink-muted">{o.text}</span>
          </li>
        ))}
        <li className="text-sm text-ink-muted">Explained only. You can’t place these here. F&amp;O is not available in this prototype.</li>
      </ul>
    </details>
  );
}
