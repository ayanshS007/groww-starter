// S29 Notifications inbox (README 8.12, 9 item 19, PLAN S29). State events only:
// SIP due/done/skipped/paused, insight ready, goal progress, milestones, KYC
// pending. Today / Earlier, unread dots, Mark all read. Never marketing.
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Icon, type IconName } from '../components/Icon';
import { useToast } from '../components/Toast';
import { dateLabel } from '../lib/format';
import { deriveNotifications, groupNotifications, type Notification } from '../lib/notifications';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import type { NotifKind } from '../state/types';

const KIND_ICON: Record<NotifKind, IconName> = {
  sip_due: 'calendar',
  sip_done: 'check',
  sip_skipped_paused: 'pause',
  insight_ready: 'info',
  goal_progress: 'star',
  milestone: 'sparkle',
  kyc_pending: 'shield',
};


function Item({ n }: { n: Notification }) {
  const { dispatch } = useStore();
  const open = () => {
    if (!n.read) dispatch({ type: 'markNotificationsRead', ids: [n.id] });
    navigate(n.route);
  };
  return (
    <li>
      <button
        type="button"
        onClick={open}
        className={`flex w-full items-start gap-3 rounded-card-sm p-4 text-left transition hover:bg-surface2 ${n.read ? '' : 'bg-mint/60'}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
          <Icon name={KIND_ICON[n.kind]} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {!n.read && <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-text" />}
            <span className="font-semibold text-ink">{n.title}</span>
            {!n.read && <span className="sr-only">, unread</span>}
          </span>
          <span className="mt-0.5 block text-sm text-ink">{n.body}</span>
          <span className="mt-1 block text-xs text-ink-muted">{dateLabel(n.at, { short: true })}</span>
        </span>
        <Icon name="chevronRight" size={20} className="mt-2 shrink-0 text-ink-muted" />
      </button>
    </li>
  );
}

function Group({ title, items }: { title: string; items: Notification[] }) {
  if (items.length === 0) return null;
  const id = `notif-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="px-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <ul className="mt-2 space-y-1">
        {items.map((n) => (
          <Item key={n.id} n={n} />
        ))}
      </ul>
    </section>
  );
}

export function Notifications() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const list = deriveNotifications(state);
  const { today, earlier } = groupNotifications(list, state.market.week);
  const unread = list.filter((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Notifications</h1>
          <p aria-live="polite" className="mt-1 text-base text-ink-muted">
            {unread.length === 0 ? 'All caught up.' : `${unread.length} unread.`} Only things that happened to your money.
          </p>
        </div>
        {unread.length > 0 && (
          <Button
            onClick={() => {
              dispatch({ type: 'markNotificationsRead', ids: unread.map((n) => n.id) });
              toast.show('All notifications marked as read.');
            }}
          >
            Mark all read
          </Button>
        )}
      </header>

      {list.length === 0 ? (
        <EmptyState title="Nothing yet" body="When a SIP runs, a goal moves or your weekly note is ready, it shows up here." />
      ) : (
        <>
          <Group title="Today" items={today} />
          <Group title="Earlier" items={earlier} />
        </>
      )}

      <p className="text-sm text-ink-muted">
        In-app only, no offers.{' '}
        <Link to="/you" className="inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline">
          Choose what you hear about
        </Link>
      </p>
    </div>
  );
}
