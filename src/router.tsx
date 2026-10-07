// Small hash router: reads location.hash, resolves it with lib/routes, and
// applies redirects with replace so Back never lands on a blocked route.
import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { parseHash, resolveRoute, type Location, type Resolved } from './lib/routes';
import type { State } from './state/types';

function currentHash(): string {
  return typeof window === 'undefined' ? '#/' : window.location.hash;
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  const hash = '#' + to;
  if (opts.replace) window.location.replace(hash);
  else window.location.hash = hash;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/**
 * Reads the hash on every render (not only on hashchange), so a screen can
 * navigate and then dispatch in one handler without a guard seeing the old path.
 */
export function useLocation(): Location {
  const hash = useSyncExternalStore(subscribe, currentHash, () => '#/');
  return parseHash(hash);
}

/**
 * Resolves the current location against state. Redirects are applied in an
 * effect; `onToast` receives the one-line message for missing state.
 */
export function useRoute(state: State, onToast?: (message: string) => void): Resolved {
  const loc = useLocation();
  const resolved = resolveRoute(loc, state);
  const redirectTo = resolved.kind === 'redirect' ? resolved.to : null;
  const toast = resolved.kind === 'redirect' ? resolved.toast : undefined;
  useEffect(() => {
    if (redirectTo === null) return;
    if (toast) onToast?.(toast);
    navigate(redirectTo, { replace: true });
  }, [redirectTo, toast, onToast]);
  return resolved;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; replace?: boolean };

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !replace || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to, { replace: true });
  };
  return <a href={'#' + to} onClick={handle} {...rest} />;
}

/** Browser back when there is history to go back to, else `fallback`. */
export function goBack(fallback: string): void {
  if (typeof window === 'undefined') return;
  if (window.history.length > 1) window.history.back();
  else navigate(fallback, { replace: true });
}
