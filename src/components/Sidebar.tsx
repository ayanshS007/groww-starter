// Desktop left sidebar (design-refs/01 structure, Groww-web light surface with a
// green active pill; PLAN item 41) with the "Your plan" card pinned at the bottom.
import { Link } from '../router';
import type { State } from '../state/types';
import { Icon } from './Icon';
import { NAV_ITEMS, type NavId } from './nav';
import { PlanSummaryCard } from './PlanSummaryCard';
import { useViewName, Wordmark } from './Wordmark';

export function Sidebar({ active, state }: { active?: NavId; state: State }) {
  const view = useViewName();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <Link to="/home" className="mb-8 flex min-h-tap items-center px-3" aria-label={`Groww ${view}, Home`}>
        <Wordmark />
      </Link>
      <nav aria-label="Main">
        <ul className="space-y-1">
          {NAV_ITEMS.map((n) => {
            const on = n.id === active;
            return (
              <li key={n.id}>
                <Link
                  to={n.to}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-[48px] items-center gap-3 rounded-full px-4 text-base transition ${
                    on ? 'bg-brand font-semibold text-on-brand' : 'text-ink hover:bg-surface2'
                  }`}
                >
                  <Icon name={n.icon} size={22} />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Home already shows the full plan card, so the sidebar copy would repeat it there. */}
      {active !== 'home' && (
        <div className="mt-auto">
          <PlanSummaryCard state={state} compact />
        </div>
      )}
    </aside>
  );
}
