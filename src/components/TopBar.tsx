// Top bar: wordmark + Learn book icon + avatar on mobile; page title + avatar on desktop.
import { Link } from '../router';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Wordmark } from './Wordmark';

const iconBtn = 'flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink hover:bg-surface2';

export function TopBar({ title, name }: { title: string; name?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-tablet items-center gap-2 px-safe py-2 lg:max-w-content lg:px-8 lg:py-3">
        <Link to="/home" className="flex min-h-tap items-center lg:hidden" aria-label="Groww Starter, Home">
          <Wordmark />
        </Link>
        <p className="hidden text-lg font-semibold text-ink lg:block">{title}</p>
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
