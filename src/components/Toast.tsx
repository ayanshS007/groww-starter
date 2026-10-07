// aria-live toasts with optional Undo. About 6 s, no visible timer (PLAN item 25).
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastOpts = { undo?: () => void };
type ToastItem = { id: number; message: string; undo?: () => void };
type ToastApi = { show: (message: string, opts?: ToastOpts) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

export const TOAST_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const seq = useRef(0);

  const show = useCallback((message: string, opts: ToastOpts = {}) => {
    clearTimeout(timer.current);
    seq.current += 1;
    const id = seq.current;
    setToast({ id, message, undo: opts.undo });
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), TOAST_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-8"
      >
        {toast && (
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-card-sm border border-border bg-surface px-4 py-3 text-sm text-ink shadow-lg">
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                className="min-h-tap shrink-0 rounded-full px-3 font-semibold text-brand-text underline-offset-2 hover:underline"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
