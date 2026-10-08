// The one "What Pro adds" sheet (Stage 6b). Every locked Pro feature and the
// Explore banner open it. No prices and no payment: Pro is earned with the
// 5-question quick check. It never opens in Steady mode or inside a flow.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PRO_CTA, PRO_FEATURES, PRO_SHEET_TITLE, promoAllowed, QUICK_CHECK_ROUTE } from '../lib/pro';
import { resolveRoute } from '../lib/routes';
import { navigate, useLocation } from '../router';
import { useStore } from '../state/store';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon } from './Icon';

type Ctx = { open: () => void };
const ProSheetContext = createContext<Ctx>({ open: () => {} });

export function useProSheet(): Ctx {
  return useContext(ProSheetContext);
}

export function ProSheetProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const resolved = resolveRoute(loc, state);
  const screen = resolved.kind === 'screen' ? resolved.screen : undefined;
  const allowed = !state.prefs.proUnlocked && promoAllowed(state, screen);

  // Leaving for a flow, or a dip turning on Steady mode, closes it for good.
  useEffect(() => {
    if (!allowed) setOpen(false);
  }, [allowed]);

  const show = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open: show }), [show]);

  return (
    <ProSheetContext.Provider value={value}>
      {children}
      <BottomSheet open={open && allowed} onClose={() => setOpen(false)} title={PRO_SHEET_TITLE}>
        <p className="text-base text-ink">
          Pro is earned, not bought. Get 4 of 5 on a quick check and these open up. Nothing in Starter changes.
        </p>
        <ul className="mt-4 space-y-3">
          {PRO_FEATURES.map((f) => (
            <li key={f.id} className="flex items-start gap-3">
              <Icon name="check" size={20} className="mt-0.5 shrink-0 text-brand-text" />
              <span className="text-base text-ink">
                <span className="font-semibold">{f.label}.</span> <span className="text-ink-muted">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            block
            onClick={() => {
              setOpen(false);
              navigate(QUICK_CHECK_ROUTE);
            }}
          >
            {PRO_CTA}
          </Button>
          <Button variant="quiet" block onClick={() => setOpen(false)}>
            Not now
          </Button>
        </div>
      </BottomSheet>
    </ProSheetContext.Provider>
  );
}
