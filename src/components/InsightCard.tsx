// Weekly insight (README 8.5, 9 item 10). aria-live="polite", icon + text, calm
// or amber, never red. "Review my plan" is offered, never pushed.
import type { Insight } from '../lib/insight';
import { keepSignsTogether } from '../lib/format';
import { ButtonLink } from './Button';
import { Icon, type IconName } from './Icon';

export const INSIGHT_TONE: Record<Insight['tone'], { bg: string; icon: IconName; label: string }> = {
  calm: { bg: 'bg-mint', icon: 'check', label: 'Steady week' },
  neutral: { bg: 'bg-surface2', icon: 'info', label: 'This week' },
  caution: { bg: 'bg-caution-fill', icon: 'eye', label: 'Worth a look' }, // no warning icon on a dip (Stage 6a)
};

/**
 * Label and icon for an insight. A caution that needs nothing (the big dip) is
 * named for what happened, with an info icon, so it doesn't read as a warning
 * next to "optional" (QA #6). "Worth a look" stays for a real mismatch.
 */
export function insightTone(insight: Insight): { bg: string; icon: IconName; label: string } {
  const t = INSIGHT_TONE[insight.tone];
  return insight.tone === 'caution' && !insight.actionNeeded ? { ...t, icon: 'info', label: 'A bigger dip' } : t;
}

export function InsightCard({ insight }: { insight: Insight | null }) {
  const tone = insight ? insightTone(insight) : INSIGHT_TONE.neutral;
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
                Review my plan
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The insight headline for Home's snapshot: same tone, icon + words, never red.
 * The live region is always in the page so a new week is announced.
 */
export function InsightLine({ insight }: { insight: Insight | null }) {
  const tone = insight ? insightTone(insight) : undefined;
  return (
    <div aria-live="polite" className="mt-4">
      {insight && tone && (
        <p className={`flex gap-2 rounded-card-sm p-4 text-sm text-ink ${tone.bg}`}>
          <Icon name={tone.icon} size={18} className={`mt-0.5 shrink-0 ${insight.tone === 'caution' ? 'text-caution' : 'text-ink-muted'}`} />
          <span>
            <span className="sr-only">{tone.label}. </span>
            {keepSignsTogether(insight.headline)}{' '}
            <span className="font-semibold">{insight.actionNeeded ? 'Worth a look in Portfolio.' : 'Nothing needs doing.'}</span>
          </span>
        </p>
      )}
    </div>
  );
}
