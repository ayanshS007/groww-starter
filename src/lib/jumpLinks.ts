// Reviewer jump links (README 9 item 20): one concrete link per route pattern,
// with ids filled from the current state where a record is needed.
import type { State } from '../state/types';
import { ROUTE_PATTERNS } from './routes';

export type JumpLink = { pattern: string; to: string; note?: string };

export function jumpLinks(state: State): JumpLink[] {
  const order = state.orders.find((o) => o.type !== 'redeem');
  const holding = state.holdings.find((h) => h.units > 0) ?? state.holdings[0];
  const sip = state.sips.find((s) => s.status !== 'stopped') ?? state.sips[0];
  const fill: Record<string, { value?: string; missing: string }> = {
    step: { value: '1', missing: '' },
    id: { value: 'index50', missing: '' },
    fundId: { value: 'index50', missing: '' },
    orderId: { value: order?.id, missing: 'needs an order; redirects' },
  };
  return ROUTE_PATTERNS.map((pattern) => {
    let note: string | undefined;
    const to = pattern
      .split('/')
      .map((seg, i, all) => {
        if (!seg.startsWith(':')) return seg;
        const key = seg.slice(1);
        // ':id' means a holding or SIP under /portfolio, a fund elsewhere.
        if (key === 'id' && all[i - 1] === 'holding') {
          if (!holding) note = 'needs a holding; redirects';
          return holding?.id ?? 'none';
        }
        if (key === 'id' && all[i - 1] === 'sip') {
          if (!sip) note = 'needs a SIP; redirects';
          return sip?.id ?? 'none';
        }
        const f = fill[key];
        if (!f?.value) note = f?.missing || 'redirects';
        return f?.value ?? 'none';
      })
      .join('/');
    if ((pattern === '/plan' || pattern === '/invest/plan') && !state.plan) note = 'needs a check-in; redirects';
    if ((pattern === '/checkin/:step' || pattern === '/kyc/:step') && !state.user.signedUp) note = 'needs sign-up; redirects';
    if (pattern === '/signup' && state.user.signedUp) note = 'already signed up; redirects';
    if (pattern === '/kyc/:step' && state.user.kyc === 'done') note = 'already verified; redirects';
    return note ? { pattern, to: to || '/', note } : { pattern, to: to || '/' };
  });
}
