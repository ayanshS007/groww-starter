// Milestone card (README 8.10, PLAN item 36). Calm, shown once on Home until
// "Got it". Counts instalments; skips and pauses never reset anything. No
// confetti, no streak counter, no points.
import { MILESTONE_COPY, type MilestoneId } from '../lib/milestones';
import { useStore } from '../state/store';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';

export function MilestoneCard({ id }: { id: MilestoneId }) {
  const { dispatch } = useStore();
  const copy = MILESTONE_COPY[id];
  return (
    <Card tint="lavender" pad="lg" aria-labelledby="milestone-title">
      <p className="text-sm font-medium text-ink-muted">Milestone</p>
      <h2 id="milestone-title" className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
        <Icon name="star" size={20} className="shrink-0" />
        {copy.title}
      </h2>
      <p className="mt-2 text-base text-ink">{copy.body}</p>
      <Button variant="secondary" className="mt-4" onClick={() => dispatch({ type: 'seeMilestone', id })}>
        Got it
      </Button>
    </Card>
  );
}
