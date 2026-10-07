// Groww-web sub-tabs with an underline indicator (design-refs/03–05). Each tab
// is a link (?tab=…), so refresh and Back keep the tab.
import { Link } from '../router';

export function UnderlineTabs<T extends string>({
  tabs,
  active,
  to,
  label,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  to: (id: T) => string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="relative -mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <Link
                to={to(t.id)}
                replace
                aria-current={on ? 'page' : undefined}
                className={`relative flex min-h-[48px] items-center whitespace-nowrap px-4 text-base transition ${
                  on ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
                <span aria-hidden className={`absolute inset-x-2 -bottom-px h-[3px] rounded-full ${on ? 'bg-ink' : 'bg-transparent'}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
