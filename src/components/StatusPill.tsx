// Status as icon + text, never colour alone (SIP status, plan health).
import { Icon, type IconName } from './Icon';

export type PillTone = 'good' | 'watch' | 'neutral';

const TONE: Record<PillTone, string> = { good: 'bg-mint text-ink', watch: 'bg-caution-fill text-ink', neutral: 'bg-surface2 text-ink' };

export function StatusPill({ tone = 'neutral', icon, children }: { tone?: PillTone; icon: IconName; children: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>
      <Icon name={icon} size={14} className={tone === 'watch' ? 'text-caution' : undefined} />
      {children}
    </span>
  );
}

/** SIP status as icon + word: Active, Paused or Stopped. */
export function SipStatusPill({ status }: { status: 'active' | 'paused' | 'stopped' }) {
  if (status === 'paused') return <StatusPill tone="watch" icon="pause">Paused</StatusPill>;
  if (status === 'stopped') return <StatusPill icon="close">Stopped</StatusPill>;
  return <StatusPill tone="good" icon="check">Active</StatusPill>;
}
