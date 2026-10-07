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
import { fresh, oneTime, run, startSip, TODAY, withCheckin } from './test/fixtures';

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

describe('Stage 3b screens render without crashing', () => {
  const riya = buildPersona('riya', TODAY);
  const kabir = buildPersona('kabir', TODAY);
  const planned = withCheckin(fresh());
  const holdingId = riya.holdings[0].id;
  const withOrder = startSip(planned, 'index50', 2000);
  const cases: [string, State][] = [
    ['#/explore', fresh()],
    ['#/explore', riya],
    ['#/explore/funds', fresh()],
    ['#/explore/funds?collection=long_game', planned],
    ['#/explore/funds?q=gold', planned],
    ['#/explore/funds?collection=saved', fresh()],
    ['#/fund/index50', fresh()],
    ['#/fund/index50?from=search', kabir],
    ['#/fund/liquid1', planned],
    ['#/invest/index50', fresh()],
    ['#/invest/index50?amount=500', planned],
    ['#/invest/plan', planned],
    ['#/invest/plan', kabir],
    ['#/invest/success/ord_1', withOrder],
    ['#/portfolio', fresh()],
    ['#/portfolio', riya],
    [`#/portfolio/holding/${holdingId}`, riya],
  ];
  for (const [hash, state] of cases) {
    it(hash, () => {
      expect(renderAt(hash, state).length).toBeGreaterThan(200);
    });
  }
  it('no 3a placeholder text is left on a 3b route', () => {
    for (const [hash, state] of cases) expect(text(renderAt(hash, state))).not.toContain('arrives in the next build');
  });
});

describe('screen acceptance checks (README 9, Stage 3b)', () => {
  const riya = buildPersona('riya', TODAY);
  const planned = withCheckin(fresh());

  it('Fund detail shows all three Confidence blocks without tabs, a disclaimer and the illustrative range', () => {
    const html = renderAt('#/fund/index50', planned);
    const t = text(html);
    for (const q of ['What is this?', 'Why am I seeing this?', 'What happens next?']) expect(t).toContain(q);
    expect(html).not.toContain('role="tab"');
    expect(t).toContain('Illustrative prototype. All prices and returns are sample data.');
    expect(t).toContain('Sample 1-year range');
    expect(t).toContain('Main risk');
    expect(t).toContain('Start SIP');
  });
  it('Fund detail for a fund outside the plan says so and cites the answers', () => {
    const t = text(renderAt('#/fund/midcap1?from=collection', planned));
    expect(t).toContain('isn’t part of your starter plan');
    expect(t).toContain('You opened this fund from a collection');
    expect(t).toContain('Your horizon is 5+ yrs');
  });
  it('fund list has search, filters, collections, type chips, risk labels and no ranking words', () => {
    const t = text(renderAt('#/explore/funds', planned));
    for (const w of ['Search funds', 'Filters', 'Start with ₹100', 'Money I may need this year', 'Long game, 5+ years', 'Saved', 'In your plan', 'risk']) {
      expect(t).toContain(w);
    }
    for (const w of ['top performing', 'best', 'most bought', 'rating', '★']) expect(t.toLowerCase()).not.toContain(w.toLowerCase());
  });
  it('Explore hub has Markets this week and no movers', () => {
    const t = text(renderAt('#/explore', planned));
    expect(t).toContain('Markets this week:');
    expect(t.toLowerCase()).not.toMatch(/gainers|losers|most bought|top movers|index strip/);
  });
  it('invest amount step: SIP/One-time toggle, presets with the plan amount, first-time Terms', () => {
    const t = text(renderAt('#/invest/index50', planned));
    expect(t).toContain('Monthly SIP');
    expect(t).toContain('One-time');
    expect(t).toContain('₹2,000 · your plan');
    expect(t).toContain('₹500');
    expect(t).toContain('Smallest SIP here: ₹100.');
  });
  it('invest plan opens on the shared date step with the payday question for a salary user', () => {
    const t = text(renderAt('#/invest/plan', planned));
    expect(t).toContain('Pick one date for both SIPs');
    expect(t).toContain('Which day do you get paid?');
    expect(t).toContain('your first payment of ₹4,000');
  });
  it('a resumed draft opens at its saved step with the risk box as saved (never pre-ticked)', () => {
    const full = run(planned, {
      type: 'startInvestDraft',
      draft: { mode: 'plan', type: 'sip', planAmounts: planned.plan!.buckets.map((b) => ({ fundId: b.fundId, amount: b.amount, role: b.role })), dayOfMonth: 4, step: 'review', riskAck: false },
    });
    const html = renderAt('#/invest/plan', full);
    expect(text(html)).toContain('Review and confirm');
    expect(html).toMatch(/<input[^>]*type="checkbox"(?![^>]*checked)/);
    expect(text(html)).toContain('Tick the box above to continue.');
  });
  it('without KYC a saved pay step shows review, so leaving KYC never loops', () => {
    const full = run(planned, {
      type: 'startInvestDraft',
      draft: { mode: 'single', fundId: 'index50', type: 'sip', amount: 500, dayOfMonth: 4, step: 'pay', riskAck: true },
    });
    expect(text(renderAt('#/invest/index50', full))).toContain('Review and confirm');
    const verified = run(full, { type: 'kycComplete' });
    expect(text(renderAt('#/invest/index50', verified))).toContain('Pay');
    expect(text(renderAt('#/invest/index50', verified))).toContain('UPI app 1');
  });
  it('UPI tiles are generic; no real app names', () => {
    const verified = run(planned, { type: 'kycComplete' }, {
      type: 'startInvestDraft',
      draft: { mode: 'single', fundId: 'index50', type: 'sip', amount: 500, dayOfMonth: 4, step: 'pay', riskAck: true },
    });
    const t = text(renderAt('#/invest/index50', verified));
    for (const tile of ['UPI app 1', 'UPI app 2', 'UPI app 3', 'Enter UPI ID']) expect(t).toContain(tile);
    expect(t).not.toMatch(/phonepe|gpay|google pay|paytm|bhim/i);
  });
  it('Success shows the right copy per order type', () => {
    const plan2 = run(planned, {
      type: 'startInvestDraft',
      draft: { mode: 'plan', type: 'sip', planAmounts: planned.plan!.buckets.map((b) => ({ fundId: b.fundId, amount: b.amount, role: b.role })), dayOfMonth: 4, step: 'processing', riskAck: true },
    }, { type: 'placeInvestOrder' });
    expect(text(renderAt('#/invest/success/ord_1', plan2))).toContain('Your plan is set. 2 SIPs, ₹4,000 a month.');
    const single = startSip(planned, 'index50', 2000);
    const t = text(renderAt('#/invest/success/ord_1', single));
    expect(t).toContain('Your first SIP is set.');
    expect(t).toContain('What happens next');
    expect(t).toContain('Go to portfolio');
    expect(t).toContain('Set up your cushion SIP');
    expect(text(renderAt('#/invest/success/ord_1', oneTime(planned, 'liquid1', 750)))).toContain('₹750 invested.');
    for (const s of [plan2, single]) {
      const lower = text(renderAt('#/invest/success/ord_1', s)).toLowerCase();
      for (const w of ['confetti', 'streak', 'share', 'invest more now']) expect(lower).not.toContain(w);
    }
  });
  it('Portfolio: numbers, insight right under them, holdings, SIPs, disclaimer, reviewer link', () => {
    const html = renderAt('#/portfolio', riya);
    const t = text(html);
    expect(t).toContain('Illustrative values');
    expect(t).toContain('−12.2%');
    expect(html).toMatch(/aria-live="polite"[^>]*aria-label="This week"|aria-label="This week"[^>]*aria-live="polite"/);
    expect(html.indexOf('Your money')).toBeLessThan(html.indexOf('aria-label="This week"'));
    expect(html.indexOf('aria-label="This week"')).toBeLessThan(html.indexOf('Holdings'));
    for (const w of ['Holdings', 'Your SIPs', 'Manage my SIP', 'Reviewer tools', 'Illustrative prototype']) expect(t).toContain(w);
  });
  it('Portfolio never uses red or alarm words for the user’s own dip', () => {
    const html = renderAt('#/portfolio', riya);
    expect(html).not.toMatch(/market-down|text-red|bg-red/);
    const t = text(html).toLowerCase();
    for (const w of ALARM_WORDS) expect(t).not.toContain(w);
    expect(t).toContain('down');
  });
  it('Portfolio empty state points to the next step', () => {
    const t = text(renderAt('#/portfolio', planned));
    expect(t).toContain('Nothing here yet');
    expect(t).toContain('Start my plan');
  });
  it('Holding detail shows value, units, average NAV, invested, Invest more and Withdraw', () => {
    const t = text(renderAt(`#/portfolio/holding/${riya.holdings[0].id}`, riya));
    for (const w of ['What you hold', 'Units', 'Average NAV', 'You put in', 'Invest more', 'Withdraw', 'Your SIP in this fund']) expect(t).toContain(w);
  });
});
