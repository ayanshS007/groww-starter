// Stage 2 placeholder. Screens arrive in Stage 3a; routing, guards and the
// store are already wired so redirects and storage fallback work.
import { useCallback, useState } from 'react';
import { useRoute } from './router';
import { STORAGE_NOTICE, useStore } from './state/store';

export function App() {
  const { state, storageOk } = useStore();
  const [toast, setToast] = useState('');
  const onToast = useCallback((m: string) => setToast(m), []);
  useRoute(state, onToast);

  return (
    <main className="min-h-full pt-safe pb-safe px-safe flex flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-3xl font-bold text-ink">Groww Starter</h1>
      <p className="text-base max-w-tablet text-ink-muted">Foundation build. Screens arrive in the next stage.</p>
      {!storageOk && <p className="text-sm text-caution">{STORAGE_NOTICE}</p>}
      <p className="sr-only" role="status" aria-live="polite">
        {toast}
      </p>
    </main>
  );
}
