// Small "back" link at the top of detail screens (the shell has no back button).
import { goBack } from '../router';
import { Icon } from './Icon';

export function BackLink({ fallback, children }: { fallback: string; children: string }) {
  return (
    <button
      type="button"
      onClick={() => goBack(fallback)}
      className="-ml-2 inline-flex min-h-tap items-center gap-1 rounded-full px-2 text-sm font-semibold text-brand-text hover:bg-mint"
    >
      <Icon name="back" size={18} />
      {children}
    </button>
  );
}
