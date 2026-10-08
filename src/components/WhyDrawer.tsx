// "Why this category?" for a plan bucket: its reason plus the answers it is based on.
import type { PlanBucket, PlanFactor } from '../state/types';
import { Icon } from './Icon';

export function WhyDrawer({ bucket, factors }: { bucket: PlanBucket; factors: PlanFactor[] }) {
  const cited = factors.filter((f) => bucket.citedAnswers.includes(f.answer));
  return (
    <details className="group mt-4 rounded-card-sm bg-surface/70">
      <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-ink">
        Why this category?
        <Icon name="chevronDown" size={20} className="transition group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-ink">
        <p>{bucket.reason}</p>
        <p className="mt-3 font-semibold">Based on your answers</p>
        <ul className="mt-1 space-y-1">
          {cited.map((f) => (
            <li key={f.answer} className="flex gap-2">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-text" />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
