import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, renderScreen } from './App';
import { ToastProvider } from './components/Toast';
import { buildPersona } from './data/personas';
import { ALARM_WORDS } from './lib/insight';
import { parseHash, resolveRoute } from './lib/routes';
import { StoreProvider } from './state/store';
import { STORAGE_KEY } from './state/storage';
import type { State } from './state/types';
import { fresh, TODAY, withCheckin } from './test/fixtures';

/** Renders one route for a given state through the same route table as the app. */
function renderAt(hash: string, state: State): string {
  const r = resolveRoute(parseHash(hash), state);
  if (r.kind !== 'screen') throw new Error(`${hash} redirected to ${r.to}`);
  const storage = { getItem: () => JSON.stringify(state), setItem: () => {}, removeItem: () => {} };
  return renderToString(
    <StoreProvider storage={storage} today={TODAY}>
      <ToastProvider>{renderScreen(r)}</ToastProvider>
    </StoreProvider>,
  );
}

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ');

describe('App', () => {
  it('renders the landing page at /', () => {
    const html = renderToString(
      <StoreProvider storage={null} today={TODAY}>
        <App />
      </StoreProvider>,
    );
    expect(html).toContain('Start investing with ₹100. Understand every step.');
    expect(html).toContain('Get started');
  });
  it('shows the storage notice when storage is unavailable, instead of crashing', () => {
    const html = renderToString(
      <StoreProvider storage={null} today={TODAY}>
        <App />
      </StoreProvider>,
    );
    expect(html).toContain('Progress won’t be saved in this browser.');
  });
  it('uses the single storage key', () => {
    expect(STORAGE_KEY).toBe('groww-starter:v1');
  });
});

describe('Stage 3a screens render without crashing', () => {
  const riya = buildPersona('riya', TODAY);
  const planned = withCheckin(fresh());
  const cases: [string, State][] = [
    ['#/', fresh()],
    ['#/signup', fresh()],
    ...[1, 2, 3, 4, 5, 6].map((n): [string, State] => [`#/checkin/${n}`, planned]),
    ['#/plan', planned],
    ['#/plan', riya],
    ['#/home', fresh()],
    ['#/home', planned],
    ['#/home', riya],
    ['#/kyc/1', planned],
    ['#/learn', fresh()],
    ['#/learn/glossary?term=nav', fresh()],
    ['#/you', fresh()],
    ['#/you', riya],
    ['#/review', riya],
  ];
  for (const [hash, state] of cases) {
    it(hash, () => {
      const html = renderAt(hash, state);
      expect(html.length).toBeGreaterThan(200);
    });
  }
});

describe('screen acceptance checks (README 9)', () => {
  it('Home has exactly one Next-step card and no market banners', () => {
    const t = text(renderAt('#/home', buildPersona('riya', TODAY)));
    expect(t).toContain('Set up your cushion SIP');
    expect(t.match(/Your next step/g)).toHaveLength(1);
    for (const banned of ['IPO', 'F&O', 'gainers', 'losers', 'Nifty 50 today']) expect(t).not.toContain(banned);
  });
  it('Home in browse mode offers the check-in through sign-up', () => {
    const html = renderAt('#/home', fresh());
    expect(html).toContain('href="#/signup?next=%2Fcheckin%2F1"');
  });
  it('Starter plan shows the label, both buckets, the slider and the three Confidence questions', () => {
    const t = text(renderAt('#/plan', withCheckin(fresh())));
    expect(t).toContain('Starter shortlist based on your answers. Not investment advice.');
    expect(t).toContain('Liquid Fund – A');
    expect(t).toContain('Nifty 50 Index Fund');
    expect(t).toContain('Adjust split');
    for (const q of ['What is this?', 'Why am I seeing this?', 'What happens next?']) expect(t).toContain(q);
    expect(t).toContain('Start this plan');
  });
  it('Riya’s Home snapshot uses no alarming words while her portfolio is down', () => {
    const t = text(renderAt('#/home', buildPersona('riya', TODAY))).toLowerCase();
    for (const w of ALARM_WORDS) expect(t).not.toContain(w);
  });
  it('no advice language on entry screens', () => {
    const planned = withCheckin(fresh());
    for (const hash of ['#/', '#/home', '#/plan', '#/checkin/1', '#/learn', '#/you']) {
      const t = text(renderAt(hash, planned)).toLowerCase();
      for (const w of ['best fund', 'recommended for you', 'guaranteed', 'top performing']) expect(t).not.toContain(w);
    }
  });
  it('each jargon Term is underlined once per screen (PLAN C8)', () => {
    for (const hash of ['#/plan', '#/home', '#/checkin/6', '#/you']) {
      const html = renderAt(hash, buildPersona('riya', TODAY));
      const terms = [...html.matchAll(/aria-haspopup="dialog"[^>]*>([^<]+)<\/button>/g)].map((m) => m[1].toLowerCase());
      expect(new Set(terms).size).toBe(terms.length);
    }
  });
  it('Reviewer tools say they are not part of the user experience and list jump links', () => {
    const t = text(renderAt('#/review', fresh()));
    expect(t).toContain('For reviewers. Not part of the user experience.');
    expect(t).toContain('Advance one week');
    expect(t).toContain('/portfolio/sip/none');
  });
  it('You shows the masked mobile, never the full number', () => {
    const t = text(renderAt('#/you', buildPersona('riya', TODAY)));
    expect(t).toContain('••••••3210');
    expect(t).not.toContain('9876543210');
  });
});
