// Text wordmark only (CLAUDE.md: no logos). The badge names the current view.
import { useStore } from '../state/store';

/** "Starter" or "Pro": the badge text, also used in the Home link's accessible name. */
export function useViewName(): 'Starter' | 'Pro' {
  return useStore().state.prefs.view === 'pro' ? 'Pro' : 'Starter';
}

export function Wordmark({ className = '' }: { className?: string }) {
  const pro = useViewName() === 'Pro';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-ink">Groww</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pro ? 'bg-lavender text-ink' : 'bg-mint text-brand-text'}`}>
        {pro ? 'Pro' : 'Starter'}
      </span>
    </span>
  );
}
