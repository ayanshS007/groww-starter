// Info / caution callout. Icon + text, never colour alone.
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Note({ tone, children }: { tone: 'info' | 'caution'; children: ReactNode }) {
  return (
    <div className={`flex gap-3 rounded-card-sm p-4 text-sm ${tone === 'caution' ? 'bg-caution-fill text-ink' : 'bg-info-fill text-ink'}`}>
      <Icon name={tone === 'caution' ? 'caution' : 'info'} size={20} className={`mt-0.5 shrink-0 ${tone === 'caution' ? 'text-caution' : 'text-info'}`} />
      <div>{children}</div>
    </div>
  );
}
