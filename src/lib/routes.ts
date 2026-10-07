// Hash routes and guards (PLAN section 3, README 4.3). Pure: the React router
// in src/router.tsx only reads the hash and applies what this returns.
// P1 routes are added in Stage 3d; until then they resolve as unknown → /home.
import { isFundId } from '../data/funds';
import type { State } from '../state/types';

export type ScreenId =
  | 'landing'
  | 'signup'
  | 'checkin'
  | 'plan'
  | 'home'
  | 'kyc'
  | 'explore'
  | 'funds'
  | 'fund'
  | 'investPlan'
  | 'invest'
  | 'success'
  | 'portfolio'
  | 'holding'
  | 'sip'
  | 'stopCoach'
  | 'learn'
  | 'glossary'
  | 'you'
  | 'review';

export type Location = { path: string; query: Record<string, string> };

export type Resolved =
  | { kind: 'screen'; screen: ScreenId; params: Record<string, string>; query: Record<string, string> }
  | { kind: 'redirect'; to: string; toast?: string };

export const TOASTS = {
  signUpFirst: 'Let’s set up your account first',
  checkinFirst: 'Answer a few questions first',
  noFund: 'We couldn’t find that fund',
  noOrder: 'We couldn’t find that order',
  noHolding: 'That holding isn’t in your portfolio',
  noSip: 'We couldn’t find that SIP',
} as const;

/** "#/kyc/2?next=%2Finvest%2Findex50" → { path: '/kyc/2', query: { next: '/invest/index50' } } */
export function parseHash(hash: string): Location {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  let path = pathPart.startsWith('/') ? pathPart : '/' + pathPart;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  const query: Record<string, string> = {};
  for (const pair of queryPart.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    try {
      query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      // malformed escape: skip this pair
    }
  }
  return { path, query };
}

export function buildPath(path: string, query: Record<string, string | undefined> = {}): string {
  const qs = Object.entries(query)
    .filter((e): e is [string, string] => e[1] !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

/** Only internal app paths are allowed as return targets. */
export function safeNext(next: string | undefined): string | undefined {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return undefined;
  return next;
}

/** Matches '/fund/:id' against '/fund/index50' → { id: 'index50' }, or null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) {
      try {
        params[p[i].slice(1)] = decodeURIComponent(a[i]);
      } catch {
        return null;
      }
    } else if (p[i] !== a[i]) return null;
  }
  return params;
}

type Guard = (params: Record<string, string>, state: State, loc: Location) => Resolved | null;

const needsSignup =
  (next?: (loc: Location) => string): Guard =>
  (_p, state, loc) =>
    state.user.signedUp ? null : { kind: 'redirect', to: buildPath('/signup', { next: next?.(loc) ?? loc.path }), toast: TOASTS.signUpFirst };

const needsPlan: Guard = (_p, state, loc) => {
  if (state.plan && state.checkin) return null;
  if (!state.user.signedUp) return needsSignup(() => '/checkin/1')({}, state, loc);
  return { kind: 'redirect', to: '/checkin/1', toast: TOASTS.checkinFirst };
};

const ROUTES: { pattern: string; screen: ScreenId; guard?: Guard }[] = [
  { pattern: '/', screen: 'landing' },
  {
    pattern: '/signup',
    screen: 'signup',
    guard: (_p, state, loc) => (state.user.signedUp ? { kind: 'redirect', to: safeNext(loc.query.next) ?? '/home' } : null),
  },
  {
    pattern: '/checkin/:step',
    screen: 'checkin',
    guard: (p, state, loc) => {
      const signup = needsSignup(() => '/checkin/1')(p, state, loc);
      if (signup) return signup;
      const n = Number(p.step);
      return Number.isInteger(n) && n >= 1 && n <= 6 ? null : { kind: 'redirect', to: '/checkin/1' };
    },
  },
  { pattern: '/plan', screen: 'plan', guard: needsPlan },
  { pattern: '/home', screen: 'home' },
  {
    pattern: '/kyc/:step',
    screen: 'kyc',
    guard: (p, state, loc) => {
      const signup = needsSignup((l) => buildPath(l.path, l.query))(p, state, loc);
      if (signup) return signup;
      // '/kyc/done' is the "You're verified" screen; it only exists once KYC is done.
      if (p.step === 'done') return state.user.kyc === 'done' ? null : { kind: 'redirect', to: buildPath('/kyc/1', loc.query) };
      if (state.user.kyc === 'done') return { kind: 'redirect', to: safeNext(loc.query.next) ?? '/you' };
      const n = Number(p.step);
      return Number.isInteger(n) && n >= 1 && n <= 4 ? null : { kind: 'redirect', to: buildPath('/kyc/1', loc.query) };
    },
  },
  { pattern: '/explore', screen: 'explore' },
  { pattern: '/explore/funds', screen: 'funds' },
  {
    pattern: '/fund/:id',
    screen: 'fund',
    guard: (p) => (isFundId(p.id) ? null : { kind: 'redirect', to: '/explore/funds', toast: TOASTS.noFund }),
  },
  { pattern: '/invest/plan', screen: 'investPlan', guard: needsPlan },
  {
    pattern: '/invest/success/:orderId',
    screen: 'success',
    guard: (p, state) =>
      state.orders.some((o) => o.id === p.orderId) ? null : { kind: 'redirect', to: '/portfolio', toast: TOASTS.noOrder },
  },
  {
    pattern: '/invest/:fundId',
    screen: 'invest',
    guard: (p) => (isFundId(p.fundId) ? null : { kind: 'redirect', to: '/explore/funds', toast: TOASTS.noFund }),
  },
  { pattern: '/portfolio', screen: 'portfolio' },
  {
    pattern: '/portfolio/holding/:id',
    screen: 'holding',
    guard: (p, state) =>
      state.holdings.some((h) => h.id === p.id) ? null : { kind: 'redirect', to: '/portfolio', toast: TOASTS.noHolding },
  },
  {
    pattern: '/portfolio/sip/:id',
    screen: 'sip',
    guard: (p, state) => (state.sips.some((s) => s.id === p.id) ? null : { kind: 'redirect', to: '/portfolio', toast: TOASTS.noSip }),
  },
  {
    pattern: '/portfolio/sip/:id/stop',
    screen: 'stopCoach',
    guard: (p, state) => {
      const sip = state.sips.find((s) => s.id === p.id);
      if (!sip) return { kind: 'redirect', to: '/portfolio', toast: TOASTS.noSip };
      return sip.status === 'stopped' ? { kind: 'redirect', to: `/portfolio/sip/${sip.id}` } : null;
    },
  },
  { pattern: '/learn', screen: 'learn' },
  { pattern: '/learn/glossary', screen: 'glossary' },
  { pattern: '/you', screen: 'you' },
  { pattern: '/review', screen: 'review' },
];

/** Screens that hide the tab bar / sidebar (README 4.1). */
export const FLOW_SCREENS: ScreenId[] = ['signup', 'checkin', 'kyc', 'investPlan', 'invest', 'stopCoach'];

export function resolveRoute(loc: Location, state: State): Resolved {
  for (const r of ROUTES) {
    const params = matchPath(r.pattern, loc.path);
    if (!params) continue;
    const blocked = r.guard?.(params, state, loc);
    return blocked ?? { kind: 'screen', screen: r.screen, params, query: loc.query };
  }
  return { kind: 'redirect', to: '/home' };
}

/** Every P0 route pattern, for the reviewer jump links. */
export const ROUTE_PATTERNS = ROUTES.map((r) => r.pattern);
