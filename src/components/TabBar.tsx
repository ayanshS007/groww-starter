// Mobile bottom tab bar, 4 tabs until Stage 3d (PLAN item 45).
import { Link } from '../router';
import { Icon } from './Icon';
import { NAV_ITEMS, type NavId } from './nav';

export function TabBar({ active }: { active?: NavId }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-tablet justify-around px-2">
        {NAV_ITEMS.filter((n) => n.mobile).map((n) => {
          const on = n.id === active;
          return (
            <li key={n.id} className="flex-1">
              <Link
                to={n.to}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  on ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${on ? 'bg-mint text-brand-text' : ''}`}>
                  <Icon name={n.icon} size={22} />
                </span>
                <span className={on ? 'font-semibold' : ''}>{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
