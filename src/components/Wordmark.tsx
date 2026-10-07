// Text wordmark only (CLAUDE.md: no logos). A small "Pro" badge shows only while Pro view is on.
import { proViewOn } from '../lib/pro';
import { useStore } from '../state/store';
import { ProChip } from './ProGate';

/** Used in the Home link's accessible name: "Groww" or "Groww Pro". */
export function useBrandName(): string {
  return proViewOn(useStore().state) ? 'Groww Pro' : 'Groww';
}

export function Wordmark({ className = '' }: { className?: string }) {
  const pro = proViewOn(useStore().state);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-ink">Groww</span>
      {pro && <ProChip />}
    </span>
  );
}
