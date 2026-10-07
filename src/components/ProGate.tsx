// Wraps one Pro feature (Stage 6b). Live when Pro is unlocked and Pro view is on;
// hidden when it is unlocked but Pro view is off, and hidden where promotion is
// not allowed (Steady mode, flows). While locked it stays in place at about 40%
// opacity with a light blur, a lock and a small "Pro" chip, is not interactive,
// and tapping it opens the "What Pro adds" sheet.
import { createContext, useContext, type ReactNode } from 'react';
import { proMode, showUpgradeBanner, type ProMode } from '../lib/pro';
import type { ScreenId } from '../lib/routes';
import { useStore } from '../state/store';
import { Icon } from './Icon';
import { useProSheet } from './ProSheet';

/** The screen being rendered, set by `renderScreen`. */
export const ScreenContext = createContext<ScreenId | undefined>(undefined);

export function useScreen(): ScreenId | undefined {
  return useContext(ScreenContext);
}

export function useProMode(): ProMode {
  const { state } = useStore();
  return proMode(state, useScreen());
}

export function useUpgradeBanner(): boolean {
  const { state } = useStore();
  return showUpgradeBanner(state, useScreen());
}

type Props = {
  /** Names the feature for assistive tech: "Fund compare: a locked Pro feature". */
  label: string;
  /** The feature itself. */
  children: ReactNode;
  /** What to show while locked, when it differs from `children` (sample data). */
  preview?: ReactNode;
  className?: string;
};

// React 18 has no typed `inert`; the attribute still reaches the DOM.
const INERT = { inert: '' } as Record<string, string>;

export function ProGate({ label, children, preview, className = '' }: Props) {
  const mode = useProMode();
  const sheet = useProSheet();
  if (mode === 'hidden') return null;
  if (mode === 'live') return <>{children}</>;
  return (
    <div data-pro-locked className={`relative ${className}`}>
      <div aria-hidden {...INERT} className="pointer-events-none select-none overflow-hidden opacity-40 blur-sm">
        {preview ?? children}
      </div>
      <button
        type="button"
        onClick={sheet.open}
        aria-haspopup="dialog"
        aria-label={`${label}: a locked Pro feature. Opens what Pro adds.`}
        className="absolute inset-0 flex min-h-tap items-center justify-center rounded-card"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink shadow">
          <Icon name="lock" size={20} />
        </span>
        <span className="absolute right-2 top-2 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink">Pro</span>
      </button>
    </div>
  );
}

/** Small "Pro" chip, for the wordmark badge. */
export function ProChip({ className = '' }: { className?: string }) {
  return <span className={`rounded-full bg-lavender px-2 py-0.5 text-xs font-semibold text-ink ${className}`}>Pro</span>;
}
