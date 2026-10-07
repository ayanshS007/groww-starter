// Weekly insight (README 8.5, 9 item 10). aria-live="polite", icon + text, calm
// or amber, never red. "Review my plan" is offered, never pushed.
import type { Insight } from '../lib/insight';
import { keepSignsTogether } from '../lib/format';
import { ButtonLink } from './Button';
import { Icon, type IconName } from './Icon';

const TONE: Record<Insight['tone'], { bg: string; icon: IconName; label: string }> = {
  calm: { bg: 'bg-mint', icon: 'check', label: 'Steady week' },
  neutral: { bg: 'bg-surface2', icon: 'info', label: 'This week' },
  caution: { bg: 'bg-caution-fill', icon: 'caution', label: 'Worth a look' },
};

export function InsightCard({ insight }: { insight: Insight | null }) {
  const tone = insight ? TONE[insight.tone] : TONE.neutral;
  return (
    <section aria-label="This week" aria-live="polite" className={`rounded-card p-5 lg:p-6 ${tone.bg}`}>
      {insight && (
        <div className="flex gap-3">
          <Icon name={tone.icon} size={22} className={`mt-0.5 shrink-0 ${insight.tone === 'caution' ? 'text-caution' : 'text-ink'}`} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{tone.label}</p>
            <p className="mt-1 text-base font-semibold text-ink">{keepSignsTogether(insight.headline)}</p>
            <p className="mt-2 text-base text-ink">{insight.body}</p>
            {insight.action === 'review_plan' && (
              <ButtonLink to="/plan" variant="secondary" className="mt-4">
                Review my plan (optional)
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
