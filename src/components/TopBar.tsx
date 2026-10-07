// Top bar: wordmark + Learn book icon + bell + avatar on mobile; page title,
// Starter/Pro toggle, bell and avatar on desktop. One bell, here (PLAN item 37).
import { useState, type FormEvent } from 'react';
import { buildPath } from '../lib/routes';
import { unreadCount } from '../lib/notifications';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { ViewToggle } from './ViewToggle';
import { useViewName, Wordmark } from './Wordmark';

const iconBtn = 'flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink hover:bg-surface2';

/** Desktop-only search (README 4.1). Opens fund results, which link to matching sample companies (QA #27). */
function TopSearch() {
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(buildPath('/explore/funds', { q: q.trim() || undefined }));
  };
  return (
    <form role="search" onSubmit={submit} className="relative mx-6 hidden max-w-md flex-1 lg:block">
      <label htmlFor="top-search" className="sr-only">
        Search funds and stocks
      </label>
      <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        id="top-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search funds and stocks"
        autoComplete="off"
        className="min-h-tap w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
      />
    </form>
  );
}

function Bell() {
  const { state } = useStore();
  const unread = unreadCount(state);
  return (
    <Link to="/notifications" className={`${iconBtn} relative`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
      <Icon name="bell" />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold leading-none text-on-brand"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

export function TopBar({ title, name, search = false }: { title: string; name?: string; search?: boolean }) {
  const view = useViewName();
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2 lg:max-w-content lg:px-8 lg:py-3">
        <Link to="/home" className="flex min-h-tap items-center lg:hidden" aria-label={`Groww ${view}, Home`}>
          <Wordmark />
        </Link>
        <p className="hidden text-lg font-semibold text-ink lg:block">{title}</p>
        {search && <TopSearch />}
        <div className="ml-auto flex items-center gap-1">
          <div className="mr-2 hidden lg:block">
            <ViewToggle size="sm" />
          </div>
          <Link to="/learn" className={`${iconBtn} lg:hidden`} aria-label="Learn">
            <Icon name="book" />
          </Link>
          <Bell />
          <Link to="/you" className="flex min-h-tap items-center gap-2 rounded-full px-1 hover:bg-surface2 lg:pr-3" aria-label="You">
            <Avatar name={name} />
            <span className="hidden text-sm font-medium text-ink lg:inline">{name ?? 'Guest'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
