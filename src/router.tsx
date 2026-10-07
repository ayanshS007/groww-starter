// Small hash router: reads location.hash, resolves it with lib/routes, and
// applies redirects with replace so Back never lands on a blocked route.
import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
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

export function useLocation(): Location {
  const [hash, setHash] = useState(currentHash);
  useEffect(() => {
    const onChange = () => setHash(currentHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
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
