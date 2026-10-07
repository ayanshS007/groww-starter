// Starter / Pro view toggle (README 9, "Starter vs Pro view", P1). Lives in You
// and in the desktop top bar. Free to switch either way, any time.
import { useStore } from '../state/store';
import { useToast } from './Toast';

const VIEWS = [
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro' },
] as const;

export function ViewToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const current = state.prefs.view;
  return (
    <div role="group" aria-label="App view" className="inline-flex rounded-full border border-border bg-surface2 p-1">
      {VIEWS.map((v) => {
        const on = current === v.id;
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              if (on) return;
              dispatch({ type: 'setView', view: v.id });
              toast.show(v.id === 'pro' ? 'Pro view on. Explore shows more detail.' : 'Starter view on. Explore is back to the basics.');
            }}
            className={`min-h-tap rounded-full font-semibold transition ${size === 'sm' ? 'px-3 text-sm' : 'px-5 text-base'} ${
              on ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
