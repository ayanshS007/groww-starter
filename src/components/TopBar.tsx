// Top bar: wordmark + Learn book icon + avatar on mobile; page title + avatar on desktop.
import { useState, type FormEvent } from 'react';
import { buildPath } from '../lib/routes';
import { Link, navigate } from '../router';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Wordmark } from './Wordmark';

const iconBtn = 'flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink hover:bg-surface2';

/** Desktop-only fund search (README 4.1: search on Explore). */
function TopSearch() {
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(buildPath('/explore/funds', { q: q.trim() || undefined }));
  };
  return (
    <form role="search" onSubmit={submit} className="relative mx-6 hidden max-w-md flex-1 lg:block">
      <label htmlFor="top-search" className="sr-only">
        Search funds
      </label>
      <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        id="top-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search funds"
        autoComplete="off"
        className="min-h-tap w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
      />
    </form>
  );
}

export function TopBar({ title, name, search = false }: { title: string; name?: string; search?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2 lg:max-w-content lg:px-8 lg:py-3">
        <Link to="/home" className="flex min-h-tap items-center lg:hidden" aria-label="Groww Starter, Home">
          <Wordmark />
        </Link>
        <p className="hidden text-lg font-semibold text-ink lg:block">{title}</p>
        {search && <TopSearch />}
        <div className="ml-auto flex items-center gap-1">
          <Link to="/learn" className={`${iconBtn} lg:hidden`} aria-label="Learn">
            <Icon name="book" />
          </Link>
          <Link to="/you" className="flex min-h-tap items-center gap-2 rounded-full px-1 hover:bg-surface2 lg:pr-3" aria-label="You">
            <Avatar name={name} />
            <span className="hidden text-sm font-medium text-ink lg:inline">{name ?? 'Guest'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
