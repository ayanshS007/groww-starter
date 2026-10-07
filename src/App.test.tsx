import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, renderScreen } from './App';
import { ToastProvider } from './components/Toast';
import { Wordmark } from './components/Wordmark';
import { buildPersona } from './data/personas';
import { ALARM_WORDS } from './lib/insight';
import { deriveNotifications } from './lib/notifications';
import { parseHash, resolveRoute } from './lib/routes';
import { StoreProvider } from './state/store';
import { STORAGE_KEY } from './state/storage';
import type { State } from './state/types';
import { SCENARIOS } from './lib/market';
import { advance, fresh, oneTime, run, startSip, TODAY, withCheckin } from './test/fixtures';

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
    // The ₹100 is highlighted in its own span (Stage 6a), so compare the text.
    expect(text(html)).toContain('Start investing with ₹100. Understand every step.');
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
    expect(t).toContain('Your time frame is 5+ yrs');
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
    for (const w of ['What you hold', 'Units', 'Average NAV', 'Invested', 'Invest more', 'Withdraw', 'Your SIP in this fund']) expect(t).toContain(w);
  });
});

describe('Stage 3c screens render without crashing', () => {
  const riya = buildPersona('riya', TODAY);
  const paused = run(riya, { type: 'pauseSip', sipId: 'sip_1', months: 2 });
  const skipped = run(riya, { type: 'skipNext', sipId: 'sip_1' });
  const stopped = run(riya, { type: 'stopSip', sipId: 'sip_1', reason: 'market_fell' });
  const meera = buildPersona('meera', TODAY);
  const cases: [string, State][] = [
    ['#/portfolio/sip/sip_1', riya],
    ['#/portfolio/sip/sip_1', paused],
    ['#/portfolio/sip/sip_1', skipped],
    ['#/portfolio/sip/sip_1', stopped],
    ['#/portfolio/sip/sip_1', run(riya, { type: 'toggleStepUp', sipId: 'sip_1' })],
    ['#/portfolio/sip/sip_1', meera],
    ['#/portfolio/sip/sip_1/stop', riya],
    ['#/portfolio/sip/sip_1/stop', paused],
    ['#/portfolio/sip/sip_1/stop', meera],
    [`#/portfolio/holding/${riya.holdings[0].id}?withdraw=1`, riya],
    ['#/home', paused],
    ['#/home', stopped],
    ['#/portfolio', paused],
    ['#/portfolio', stopped],
  ];
  for (const [hash, state] of cases) {
    it(hash, () => {
      expect(renderAt(hash, state).length).toBeGreaterThan(200);
    });
  }
  it('no placeholder text is left anywhere', () => {
    for (const [hash, state] of cases) expect(text(renderAt(hash, state))).not.toContain('arrives in the next build');
  });
});

describe('SIP detail (README 9 item 12)', () => {
  const riya = buildPersona('riya', TODAY);
  const t = (state: State) => text(renderAt('#/portfolio/sip/sip_1', state));

  it('shows amount, date, status, instalments, next instalment, goal and step-up', () => {
    const out = t(riya);
    for (const w of ['Nifty 50 Index Fund', 'Amount each month', '₹2,000', 'of every month', 'Status', 'Active', 'Instalments made', 'Next instalment', 'Linked goal', 'None yet', 'Step-up', '+10% yearly']) {
      expect(out).toContain(w);
    }
  });
  it('active: Skip next instalment is the primary action, with Pause, Edit and Stop SIP beside it', () => {
    const out = t(riya);
    for (const w of ['Skip next instalment', 'Pause 1, 2 or 3 months', 'Edit amount or date', 'Stop SIP']) expect(out).toContain(w);
    expect(renderAt('#/portfolio/sip/sip_1', riya)).toContain('href="#/portfolio/sip/sip_1/stop"');
  });
  it('a pending skip offers Undo skip and says nothing resets', () => {
    const out = t(run(riya, { type: 'skipNext', sipId: 'sip_1' }));
    expect(out).toContain('is skipped');
    expect(out).toContain('Nothing resets');
    expect(out).toContain('Undo skip');
    expect(out).not.toContain('Skip next instalment');
  });
  it('paused: Resume now is primary, the restart date is shown, and Skip is not offered', () => {
    const out = t(run(riya, { type: 'pauseSip', sipId: 'sip_1', months: 1 }));
    expect(out).toContain('Resume now');
    expect(out).toContain('Paused');
    expect(out).toContain('restarts by itself after');
    expect(out).toContain('Change the pause');
    expect(out).not.toContain('Skip next instalment');
  });
  it('stopped: says the units stay invested and offers a new SIP, not pause or edit', () => {
    const out = t(run(riya, { type: 'stopSip', sipId: 'sip_1', reason: 'none' }));
    expect(out).toContain('Stopped');
    expect(out).toContain('stays invested');
    expect(out).toContain('Start a new SIP in this fund');
    expect(out).not.toContain('Pause 1, 2 or 3 months');
    expect(out).not.toContain('Edit amount or date');
    expect(out).not.toContain('+10% yearly');
  });
  it('step-up is stored and shown with both amounts, and says it is not simulated', () => {
    const out = t(run(riya, { type: 'toggleStepUp', sipId: 'sip_1' }));
    expect(out).toContain('Next step-up');
    expect(out).toContain('₹2,000 → ₹2,200');
    expect(out).toContain('doesn’t run years');
    expect(renderAt('#/portfolio/sip/sip_1', run(riya, { type: 'toggleStepUp', sipId: 'sip_1' }))).toContain('aria-checked="true"');
    expect(renderAt('#/portfolio/sip/sip_1', riya)).toContain('aria-checked="false"');
  });
  it('Portfolio’s SIP row mentions step-up only when it is on', () => {
    expect(text(renderAt('#/portfolio', riya))).not.toContain('Step-up');
    expect(text(renderAt('#/portfolio', run(riya, { type: 'toggleStepUp', sipId: 'sip_1' })))).toContain('Step-up +10% yearly is on');
  });
  it('shows the linked goal name when there is one', () => {
    expect(t(buildPersona('meera', TODAY))).toContain('Laptop');
  });
  it('no penalty, streak or projection language', () => {
    for (const state of [riya, run(riya, { type: 'pauseSip', sipId: 'sip_1', months: 3 }), run(riya, { type: 'stopSip', sipId: 'sip_1', reason: 'none' })]) {
      const out = t(state).toLowerCase();
      for (const w of ['penalty', 'streak', 'you’ll lose', 'you\'ll lose', 'projected', 'will grow', 'guaranteed']) expect(out).not.toContain(w);
    }
  });
});

describe('Stop coach (README 8.6, PLAN item 23)', () => {
  const riya = buildPersona('riya', TODAY);
  const html = renderAt('#/portfolio/sip/sip_1/stop', riya);
  const out = text(html);

  it('is one screen with the five reasons as tiles', () => {
    for (const w of ['Market fell', 'Money is tight', 'I need the money', 'Found a better fund', 'Something else']) expect(out).toContain(w);
    expect((html.match(/<main/g) ?? []).length).toBe(1);
    expect((html.match(/type="radio"/g) ?? []).length).toBe(5);
  });
  it('shows “Keep my SIP” and “Stop anyway” from the first render, at the same size', () => {
    const buttons = [...html.matchAll(/<button type="button" class="([^"]*)"[^>]*>(Keep my SIP|Stop anyway)<\/button>/g)];
    expect(buttons.map((m) => m[2])).toEqual(['Keep my SIP', 'Stop anyway']);
    // Same size classes; only the colour variant differs.
    const size = (c: string) => c.split(' ').filter((x) => /^(min-h|px-|py-|text-(base|sm|xs|lg)|rounded|w-full|gap)/.test(x)).sort().join(' ');
    expect(size(buttons[0][1])).toBe(size(buttons[1][1]));
    const tokens = buttons[1][1].split(' ');
    for (const small of ['text-xs', 'text-sm', 'sr-only', 'hidden', 'opacity-50', 'min-h-0']) expect(tokens).not.toContain(small);
  });
  it('before a reason is picked the first option is Keep my SIP and Stop anyway is last', () => {
    expect(html.indexOf('Keep my SIP')).toBeLessThan(html.indexOf('Stop anyway'));
  });
  it('says units stay invested, uses no guilt or timers, and has the three Confidence questions', () => {
    expect(out).toContain('What you already own stays invested');
    for (const q of ['What is this?', 'Why am I seeing this?', 'What happens next?']) expect(out).toContain(q);
    for (const w of ['are you sure', 'you’ll regret', 'last chance', 'only today', 'countdown', 'confetti']) expect(out.toLowerCase()).not.toContain(w);
  });
  it('carries the illustrative disclaimer, since it quotes this week’s sample move', () => {
    expect(out).toContain('Illustrative prototype. All prices and returns are sample data.');
  });
  it('has a back and a close path to SIP detail', () => {
    expect(html).toContain('href="#/portfolio/sip/sip_1"');
    expect(html).toContain('aria-label="Back"');
    expect(html).toContain('aria-label="Close"');
  });
  it('a paused SIP is named as paused in the one-line summary (no extra note pushing the buttons down)', () => {
    expect(text(renderAt('#/portfolio/sip/sip_1/stop', run(riya, { type: 'pauseSip', sipId: 'sip_1', months: 1 })))).toContain('paused until');
  });
});

describe('weekly insight reacts to every scenario and to Advance one week (README 8.5, 17)', () => {
  const portfolioIn = (state: State) => text(renderAt('#/portfolio', state));
  const homeIn = (state: State) => text(renderAt('#/home', state));
  const riya = buildPersona('riya', TODAY);
  const meera = buildPersona('meera', TODAY);

  it('Riya starts on the big-dip branch on both Portfolio and Home', () => {
    expect(portfolioIn(riya)).toContain('bigger fall than usual');
    expect(portfolioIn(riya)).toContain('Review my plan');
    expect(portfolioIn(riya)).toContain('A bigger dip'); // QA #6: named for what happened, not a warning
    expect(homeIn(riya)).toContain('This week: −');
  });

  for (const scenario of SCENARIOS) {
    it(`${scenario}: Portfolio and Home restate this week's move, and never use alarm words or red`, () => {
      const s = advance(riya, 1, scenario);
      for (const [name, html] of [['Portfolio', renderAt('#/portfolio', s)], ['Home', renderAt('#/home', s)]] as const) {
        const lower = text(html).toLowerCase();
        for (const w of ALARM_WORDS) expect(lower, `${name} ${scenario}`).not.toContain(w);
        expect(html, `${name} ${scenario}`).not.toMatch(/market-down|text-red|bg-red|border-red/);
        expect(lower).toMatch(/this week[: ]/);
      }
    });
  }

  it('an up week while still ≤ −10% overall leads with the gain, says the total is below what was put in, and keeps Review optional', () => {
    const oneUp = advance(riya, 1, 'up');
    for (const [name, html] of [['Portfolio', renderAt('#/portfolio', oneUp)], ['Home', renderAt('#/home', oneUp)]] as const) {
      expect(text(html), name).toMatch(/Up ₹[\d,]+ \(\+2\.4%\) this week\./);
    }
    const t = portfolioIn(oneUp);
    expect(t).toContain('below what you invested');
    expect(t).toContain('Nothing needs doing');
    expect(t).toContain('Review my plan');
    expect(t).toContain('Reviewing your plan is optional.');
    expect(t).not.toContain('lock in the fall');
    expect(t).not.toContain('Worth a look'); // not the amber caution card
    const lower = t.toLowerCase();
    for (const w of ALARM_WORDS) expect(lower).not.toContain(w);
    expect(renderAt('#/portfolio', oneUp)).not.toMatch(/text-red|bg-red|market-down/);
    // a down or flat-sized week at the same overall level keeps the original words
    expect(portfolioIn(advance(riya, 1, 'dip_small'))).toContain('lock in the fall');
  });
  it('turns calm once the overall change is back above −10%', () => {
    const recovered = advance(riya, 3, 'up');
    expect(portfolioIn(recovered)).toContain('One week is not a trend');
    expect(portfolioIn(recovered)).not.toContain('Review my plan');
    expect(portfolioIn(advance(recovered, 1, 'flat'))).toContain('One week is not a trend');
  });

  it('a small dip once the overall change is above −10% is a short-term move for a long horizon', () => {
    const recovered = advance(riya, 3, 'up');
    const dipped = advance(recovered, 1, 'dip_small');
    expect(portfolioIn(dipped)).toContain('A short-term move.');
    expect(portfolioIn(dipped)).toContain('doesn\'t mean you need to act');
  });

  it('the headline changes with each advance (the numbers are not frozen)', () => {
    const heads = new Set<string>();
    let s = riya;
    for (const sc of ['dip_sharp', 'normal', 'up', 'dip_small'] as const) {
      s = advance(s, 1, sc);
      heads.add(portfolioIn(s).match(/(?:This week: |Up )[^)]*\)/)?.[0] ?? '');
    }
    expect(heads.size).toBe(4);
  });

  it('Advance one week ×3 keeps the insight and the numbers consistent between Home and Portfolio', () => {
    const s = advance(riya, 3, 'dip_small');
    const p = portfolioIn(s).match(/(?:This week: |Up )([^)]*\))/)?.[1];
    const h = homeIn(s).match(/(?:This week: |Up )([^)]*\))/)?.[1];
    expect(p).toBeDefined();
    expect(p).toBe(h);
  });

  it('a liquid-only portfolio under a sharp dip has no alarming words on either screen', () => {
    const s = advance(meera, 1, 'dip_sharp');
    for (const out of [portfolioIn(s), homeIn(s)]) {
      const lower = out.toLowerCase();
      for (const w of ALARM_WORDS) expect(lower).not.toContain(w);
    }
  });

  it('Home’s insight sits in an aria-live region that is in the page even before there is a number to show', () => {
    // Riya is in a big dip, so Steady mode shows the full insight card at the top instead (Stage 6a).
    expect(renderAt('#/home', riya)).toMatch(/<section aria-label="This week" aria-live="polite"/);
    const html = renderAt('#/home', run(riya, { type: 'setPreview', patch: { mood: 'flat' } }));
    expect(html).toMatch(/aria-live="polite"[^>]*>(<p class="flex gap-2 rounded-card-sm)/);
    expect(renderAt('#/portfolio', riya)).toMatch(/aria-label="This week"/);
  });
});

describe('Home after a stop: quiet, not pushy (owner decision)', () => {
  const riya = buildPersona('riya', TODAY);
  const stopped = run(riya, { type: 'stopSip', sipId: 'sip_1', reason: 'market_fell' });
  const homeHtml = renderAt('#/home', stopped);
  const home = text(homeHtml);

  it('Riya has her cushion SIP missing, so the card is not asked to restart anything for the stopped part', () => {
    // Riya's cushion part was never set up, so that card is still the one she sees; the stopped grow part is not offered.
    expect(home).toContain('Set up your cushion SIP');
    expect(home).not.toContain('Set up your grow SIP');
    expect(home).not.toContain('Restart my plan');
  });
  it('shows the one quiet line with a Restart link to that fund', () => {
    expect(home).toContain('One part of your plan isn’t running. Restart any time.');
    expect(homeHtml).toContain('href="#/invest/index50?amount=2000"');
    expect((home.match(/Restart any time/g) ?? []).length).toBe(1);
  });
  it('with the cushion part running too, the card moves on to “You’re set” and the line is the only mention', () => {
    const both = run(startSip(withCheckin(fresh()), 'liquid1', 2000), { type: 'startInvestDraft', draft: { mode: 'single', fundId: 'index50', type: 'sip', amount: 2000, dayOfMonth: 10, step: 'review', riskAck: true } }, { type: 'placeInvestOrder' }, { type: 'stopSip', sipId: 'sip_2', reason: 'none' });
    const t = text(renderAt('#/home', both));
    expect(t).toMatch(/You’re set\. Next SIP on /);
    expect(t).not.toContain('Set up your grow SIP');
    expect(t).toContain('One part of your plan isn’t running. Restart any time.');
  });
  it('after 5 weeks the card is back and the line is gone', () => {
    const later = text(renderAt('#/home', advance(stopped, 5, 'normal')));
    expect(later).not.toContain('Restart any time');
  });
  it('no line when nothing was stopped', () => {
    expect(text(renderAt('#/home', riya))).not.toContain('Restart any time');
  });
});

describe('Stage 3d-1: Dashboard (README 9 item 21)', () => {
  const riya = buildPersona('riya', TODAY);

  it('a fresh account sees the empty state with the Home next-step action', () => {
    const html = renderAt('#/dashboard', fresh());
    const t = text(html);
    expect(t).toContain('Your dashboard fills in after your first investment');
    expect(t).toContain('Take the check-in');
    expect(t).not.toContain('Value vs invested');
  });
  it('Riya sees every tile, the chart, the donut, plan health, SIPs, goals, activity and the insight', () => {
    const t = text(renderAt('#/dashboard', riya));
    for (const s of [
      'Your money at a glance',
      'Last 4 weeks',
      'Last 12 weeks',
      'Since start',
      'Current value',
      'Invested',
      'This week',
      'Next SIP',
      'Skip next instalment',
      'Value vs invested',
      'You stayed invested',
      'Where your money is',
      'Plan split: 50 / 50 · Actual: 0 / 100',
      'Plan health',
      'Cushion',
      'Time frame match',
      'Stock budget',
      'SIPs running',
      'This month’s',
      'Upcoming',
      'Goals',
      'Recent activity',
      'Review my plan',
    ]) {
      expect(t).toContain(s);
    }
  });
  it('shows only her own money: no indices, movers, other users, projections or red', () => {
    const html = renderAt('#/dashboard', riya);
    const t = text(html).toLowerCase();
    for (const w of ['indices', 'large 50 (sample)', 'gainers', 'losers', 'most bought', 'leaderboard', 'other users', 'projected', 'you will have', 'best', 'guaranteed']) {
      expect(t).not.toContain(w);
    }
    expect(html).not.toContain('market-down');
    expect(html).not.toContain('market-up');
  });
  it('plan-health rows link to their real fix screens (no dead links)', () => {
    const html = renderAt('#/dashboard', riya);
    const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toContain('/payday');
    expect(hrefs).toContain('/you/trading');
    expect(hrefs).toContain('/portfolio/goals');
    for (const h of hrefs) expect(resolveRoute(parseHash('#' + h), riya)).not.toEqual({ kind: 'redirect', to: '/home' });
  });
  it('Meera’s goal shows as a progress row with the monthly amount needed', () => {
    const t = text(renderAt('#/dashboard', buildPersona('meera', TODAY)));
    expect(t).toContain('Laptop');
    expect(t).toMatch(/₹[\d,]+\/month needed/);
    expect(t).toContain('Without counting returns');
  });
  it('after Advance one week ×3 the tiles, SIP list and activity change', () => {
    const before = text(renderAt('#/dashboard', riya));
    const after = text(renderAt('#/dashboard', advance(riya, 3)));
    expect(before).toContain('Upcoming');
    expect(after).toContain('Done');
    expect(after).not.toBe(before);
    expect(after).toContain('16 Oct 2026');
  });
});

describe('Stage 3d-1: notifications inbox (README 8.12, 9 item 19)', () => {
  it('Riya has Today / Earlier groups, unread items and Mark all read', () => {
    const t = text(renderAt('#/notifications', buildPersona('riya', TODAY)));
    expect(t).toContain('Today');
    expect(t).toContain('Earlier');
    expect(t).toContain('Mark all read');
    expect(t).toContain('unread');
    for (const w of ['buy now', 'special offer', 'limited time', 'market is up']) expect(t.toLowerCase()).not.toContain(w);
  });
  it('once everything is read there is no Mark all read button', () => {
    const riya = buildPersona('riya', TODAY);
    const ids = deriveNotifications(riya).map((n) => n.id);
    const t = text(renderAt('#/notifications', run(riya, { type: 'markNotificationsRead', ids })));
    expect(t).toContain('All caught up.');
    expect(t).not.toContain('Mark all read');
  });
  it('a fresh account has an empty inbox', () => {
    expect(text(renderAt('#/notifications', fresh()))).toContain('Nothing yet');
  });
});

describe('Stage 3d-1: Starter / Pro view (README 9 item 22)', () => {
  const pro = (s: State) => run(s, { type: 'setView', view: 'pro' });
  const riya = buildPersona('riya', TODAY);

  it('Starter Explore keeps the plain markets line and no index strip', () => {
    const t = text(renderAt('#/explore', riya));
    expect(t).toContain('Markets this week:');
    expect(t).not.toContain('Indices');
  });
  it('Pro Explore has underline sub-tabs, the sample index strip, stock cards and dense fund rows', () => {
    const html = renderAt('#/explore', pro(riya));
    const t = text(html);
    for (const s of ['Explore', 'Holdings', 'Orders', 'Watchlist', 'Indices', 'Sample data', 'Large 50 (sample)', 'Stocks', 'Expense', '3Y illustrative sample return', 'not a ranking']) {
      expect(t).toContain(s);
    }
    expect(t).not.toContain('Markets this week:');
    expect(t.toLowerCase()).not.toMatch(/top gainers|most bought|top movers/);
    expect(html).toContain('aria-current="page"');
  });
  it('Pro holdings show the user’s own dip in soft rose with ▼, never market red', () => {
    // Owner rule change in Stage 6a: own losses use a soft rose with ▼ and a sign (was amber).
    const html = renderAt('#/explore?tab=holdings', pro(riya));
    expect(text(html)).toContain('Nifty 50 Index Fund');
    expect(html).not.toContain('market-down');
    expect(html).toContain('text-own-down');
    expect(html).toContain('▼');
  });
  it('Pro watchlist shows a table for Arjun’s stocks; orders list Riya’s payments', () => {
    const arjun = pro(buildPersona('arjun', TODAY));
    const w = text(renderAt('#/explore?tab=watchlist', arjun));
    for (const s of ['Your watchlist', 'Add stocks', 'Edit', 'Mkt price', '1D change', '52W range', 'Saved funds']) expect(w).toContain(s);
    const o = text(renderAt('#/explore?tab=orders', pro(riya)));
    expect(o).toContain('SIP, first payment');
  });
  it('Pro fund list is dense; fund detail puts the Confidence blocks behind “Why this?”', () => {
    expect(text(renderAt('#/explore/funds', pro(riya)))).toContain('Expense');
    const fund = text(renderAt('#/fund/index50', pro(riya)));
    expect(fund).toContain('Why this?');
    expect(text(renderAt('#/fund/index50', riya))).not.toContain('Why this? What it is');
  });
  it('the You screen has the view toggle', () => {
    const t = text(renderAt('#/you', riya));
    expect(t).toContain('App view');
    expect(t).toContain('Starter');
    expect(t).toContain('Pro');
  });
});

describe('Stage 3d-2 screens (README 8.3, 8.7–8.10, 9 items 14–17)', () => {
  const riya = buildPersona('riya', TODAY);

  it('Home shows "Got paid? Split it" with a plan, and the milestone card once earned', () => {
    // Riya's real mood is a big dip (Steady mode hides the card, Stage 6a), so preview a flat week.
    const t = text(renderAt('#/home', run(riya, { type: 'setPreview', patch: { mood: 'flat' } })));
    expect(t).toContain('Got paid? Split it');
    expect(t).not.toContain('Milestone');
    const first = startSip(withCheckin(fresh()), 'index50', 500);
    const home = text(renderAt('#/home', first));
    expect(home).toContain('Your first investment is in');
    expect(home).toContain('Got it');
    expect(text(renderAt('#/home', run(first, { type: 'seeMilestone', id: 'first_investment' })))).not.toContain('Your first investment is in');
  });

  it('Payday Split: the three lines and the top-up CTA for Riya’s ₹28,000', () => {
    const t = text(renderAt('#/payday?pay=28000', riya));
    for (const s of ['Already going to SIPs', 'Cushion top-up', 'Yours to spend', 'A suggestion, not a rule. Change any number.']) expect(t).toContain(s);
    expect(t).toContain('₹2,000');
    expect(t).toContain('₹23,200');
    expect(t).toContain('Top up cushion with ₹2,800');
    expect(t).toContain('What is this?');
  });

  it('Goals list and detail: progress, monthly needed without counting returns, links', () => {
    const meera = buildPersona('meera', TODAY);
    const list = text(renderAt('#/portfolio/goals', meera));
    expect(list).toContain('Laptop');
    expect(list).toContain('Create a goal');
    const detail = text(renderAt('#/portfolio/goal/goal_1', meera));
    expect(detail).toMatch(/₹[\d,]+\s*\/month needed, without counting returns/);
    expect(detail).toContain('Liquid Fund – A');
    expect(detail).toContain('Unlink');
    expect(text(renderAt('#/portfolio/goals', fresh()))).toContain('No goals yet');
  });

  it('a short goal linked to an equity SIP warns and offers a steadier fund', () => {
    // Riya's simulated today is TODAY (2026-10-07); June 2027 is under a year away.
    const s = run(riya, { type: 'createGoal', name: 'Laptop', target: 50000, byDate: '2027-06-30', sipIds: ['sip_1'] });
    const t = text(renderAt('#/portfolio/goal/goal_1', s));
    expect(t).toContain('can fall a lot in a year');
    expect(t).toContain('Switch to a steadier fund');
  });

  it('Stocks: list with the Starter banner, detail with "₹1,000 buys 0 shares"', () => {
    const list = text(renderAt('#/explore/stocks', fresh()));
    expect(list).toContain('New to stocks? ‘Stocks vs funds’ in 60 seconds');
    expect(list).toContain('Sample data');
    const pro = text(renderAt('#/explore/stocks', run(fresh(), { type: 'setView', view: 'pro' })));
    expect(pro).not.toContain('New to stocks?');
    const d = text(renderAt('#/stock/stk_voltara', fresh()));
    expect(d).toContain('₹1,000 buys 0 shares');
    expect(d).toContain('Indian exchanges don’t sell parts of a share.');
    expect(d).toContain('Why is intraday hidden?');
    expect(d).toContain('Main risk');
    expect(d).not.toMatch(/intraday buy|F&O order|target price/i);
  });

  it('Stock buy: stepper, Market/Limit explained, delivery only; review has pick reason chips and the Tip Check offer', () => {
    const order = text(renderAt('#/stock/stk_voltara/buy', riya));
    for (const s of ['How many shares?', 'Market', 'Limit', 'Buys only at your price or lower', 'Delivery only', 'Take the quick check']) expect(order).toContain(s);
    const zero = text(renderAt('#/stock/stk_voltara/buy?mode=amount&amt=1000', riya));
    expect(zero).toContain('buys 0 shares');
    const review = text(renderAt('#/stock/stk_voltara/buy?step=review&qty=1&reason=social', riya));
    expect(review).toContain('What made you pick this?');
    expect(review).toContain('Run a 30-second Tip Check?');
    expect(review).toContain('Over your stock budget');
    expect(text(renderAt('#/stock/stk_voltara/buy?step=review&qty=1&reason=social&tc=1', riya))).not.toContain('Run a 30-second Tip Check?');
    const passed = text(renderAt('#/stock/stk_voltara/buy', run(riya, { type: 'passReadiness', passed: true })));
    expect(passed).toContain('More order types, explained');
  });

  it('single-fund Invest review shows the pick reason chips; the plan flow does not', () => {
    const s = run(riya, {
      type: 'startInvestDraft',
      draft: { mode: 'single', fundId: 'liquid1', type: 'one_time', amount: 2800, step: 'review', riskAck: false, pickReason: 'not_sure' },
    });
    const t = text(renderAt('#/invest/liquid1', s));
    expect(t).toContain('What made you pick this?');
    expect(t).toContain('Run a 30-second Tip Check?');
    const plan = run(riya, { type: 'startInvestDraft', draft: { mode: 'plan', type: 'sip', step: 'review', riskAck: false, planAmounts: [{ fundId: 'liquid1', amount: 2000, role: 'cushion' }] } });
    expect(text(renderAt('#/invest/plan', plan))).not.toContain('What made you pick this?');
  });

  it('Tip Check, Trading and Learn', () => {
    const tc = text(renderAt('#/learn/tip-check?next=%2Fstock%2Fstk_voltara%2Fbuy', fresh()));
    expect(tc).toContain('Does it promise a guaranteed return?');
    expect(tc).toContain('Skip, back to my order');
    const tr = text(renderAt('#/you/trading', riya));
    expect(tr).toContain('Stock budget');
    expect(tr).toContain('Quick check: 5 questions'); // QA #21
    expect(tr).toContain('Not available in this prototype');
    expect(text(renderAt('#/learn', fresh()))).toContain('Tip Check');
    expect(text(renderAt('#/you', riya))).toContain('Stock budget and quick check');
    expect(text(renderAt('#/explore', fresh()))).toContain('Browse stocks');
  });

  it('a stock holding offers Buy more and Sell; Success names the company', () => {
    const s = run(riya, { type: 'buyStock', stockId: 'stk_pinecrest', shares: 2, orderType: 'market' });
    const t = text(renderAt('#/portfolio/holding/h_stk_pinecrest', s));
    expect(t).toContain('Buy more');
    expect(t).toContain('Sell');
    const order = s.orders[s.orders.length - 1];
    const ok = text(renderAt(`#/invest/success/${order.id}`, s));
    expect(ok).toContain('Order placed (simulated).');
    expect(ok).toContain('Pinecrest Bank (sample)');
    expect(ok).toContain('2 shares · delivery');
  });

  it('the badge next to the wordmark shows the current view', () => {
    const badge = (s: State) =>
      text(
        renderToString(
          <StoreProvider storage={{ getItem: () => JSON.stringify(s), setItem: () => {}, removeItem: () => {} }} today={TODAY}>
            <Wordmark />
          </StoreProvider>,
        ),
      ).trim();
    expect(badge(riya)).toBe('Groww Starter');
    expect(badge(run(riya, { type: 'setView', view: 'pro' }))).toBe('Groww Pro');
  });
});

describe('Stage 5 polish', () => {
  const riyaState = buildPersona('riya', TODAY);
  const headingLevels = (html: string) => [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);

  it('Plan headings never skip a level and put the funds under their own h2 (QA #34)', () => {
    const html = renderAt('#/plan', withCheckin(fresh()));
    const levels = headingLevels(html);
    expect(levels[0]).toBe(1);
    levels.slice(1).forEach((l, i) => expect(l - levels[i]).toBeLessThanOrEqual(1));
    expect(text(html)).toContain('Funds in your plan');
    // every fund heading (h3) comes after the "Funds in your plan" h2, not after "Cushion vs Grow"
    expect(html.indexOf('Funds in your plan')).toBeLessThan(html.indexOf('<h3'));
  });
  it('the sidebar plan card is not a heading, so no h2 can come before the page h1', () => {
    const html = renderToString(
      <StoreProvider storage={null} today={TODAY}>
        <App />
      </StoreProvider>,
    );
    expect(html).not.toMatch(/<h2[^>]*>Your plan<\/h2>/);
  });
  it('Dashboard row 3 cards stretch to the same height (QA #37)', () => {
    const html = renderAt('#/dashboard', riyaState);
    for (const id of ['health-title', 'month-title', 'goals-title']) {
      const card = html.slice(0, html.indexOf(`id="${id}"`)).split('<section').pop()!;
      expect(card).toContain('h-full');
    }
  });
  it('Home draws the decorative backdrop, hidden from screen readers', () => {
    const html = renderAt('#/home', riyaState);
    expect(html).toMatch(/aria-hidden="true"[^>]*class="home-blobs"|class="home-blobs"[^>]*aria-hidden="true"/);
    expect(html.match(/home-blob-/g)?.length).toBe(3);
  });
  it('other screens have no backdrop', () => {
    for (const hash of ['#/dashboard', '#/portfolio', '#/plan']) expect(renderAt(hash, riyaState)).not.toContain('home-blobs');
  });
  it('Landing mock has no button-lookalike competing with Get started', () => {
    const html = renderToString(
      <StoreProvider storage={null} today={TODAY}>
        <App />
      </StoreProvider>,
    );
    expect(html).not.toContain('Start my plan');
  });
  it('Home plan card has no second Cushion / Grow legend under the bar', () => {
    const html = renderAt('#/home', riyaState);
    expect(html).not.toMatch(/<dt[^>]*>Cushion<\/dt>/);
    expect(text(html)).toContain('Liquid Fund – A');
  });
});

describe('Stage 6a: visual upgrade and market mood', () => {
  const riya = buildPersona('riya', TODAY);
  const mood = (s: State, m: 'up' | 'flat' | 'small_dip' | 'big_dip') => run(s, { type: 'setPreview', patch: { mood: m } });

  it('Landing: bold hero, the three value cards, blobs, and no stats', () => {
    const html = renderAt('#/', fresh());
    const t = text(html);
    for (const s of ['A plan in 2 minutes', 'Skip any month, free', 'Always see why', 'Get started', 'Just exploring']) expect(t).toContain(s);
    expect(html).toContain('home-blobs');
    expect(t).not.toMatch(/\d+(,\d+)*\+? (users|investors|people)|rated|downloads/i);
  });

  it('Check-in: every answer tile has an icon, and the selected one a ring and a check', () => {
    const s = run(withCheckin(fresh()), { type: 'saveCheckinAnswer', answers: { incomeType: 'salary' } });
    const html = renderAt('#/checkin/1', s);
    expect((html.match(/<label/g) ?? []).length).toBe(8);
    expect((html.match(/rounded-card-sm transition-colors/g) ?? []).length).toBe(8); // icon chips
    expect(html).toMatch(/ring-4 ring-brand\/30/);
    expect(html).toContain('anim-step-fwd');
  });

  it('Plan: the split bar fills and the bucket cards cascade in', () => {
    const html = renderAt('#/plan', withCheckin(fresh()));
    expect(html).toContain('anim-fill');
    expect((html.match(/class="anim-rise"/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('Steady mode (Riya’s big dip): insight first on Home and Dashboard, no payday card', () => {
    const home = renderAt('#/home', riya);
    expect(text(home)).toContain('Steady mode');
    expect(home.indexOf('aria-label="This week"')).toBeLessThan(home.indexOf('Your next step'));
    expect(text(home)).not.toContain('Got paid? Split it');
    const dash = renderAt('#/dashboard', riya);
    expect(dash.indexOf('aria-label="This week"')).toBeLessThan(dash.indexOf('Current value'));
    const calm = renderAt('#/dashboard', mood(riya, 'flat'));
    expect(calm.indexOf('aria-label="This week"')).toBeGreaterThan(calm.indexOf('Current value'));
  });

  it('own changes: rose ▼ when down, green ▲ when up, never red or a warning icon', () => {
    const down = renderAt('#/home', riya);
    expect(down).toContain('text-own-down');
    expect(down).toContain('▼');
    expect(down).not.toMatch(/market-down|text-red|bg-red|border-red/);
    const arjunUp = advance(buildPersona('arjun', TODAY), 2, 'up');
    const up = renderAt('#/portfolio', arjunUp);
    expect(up).toContain('▲');
    expect(up).toMatch(/text-brand-text[^"]*"><span aria-hidden="true" class="text-\[0.8em\]/);
  });

  it('payday glow: gold "Payday week" card after a pay credit, gone next week', () => {
    const paid = run(mood(riya, 'flat'), { type: 'creditPay' });
    expect(text(renderAt('#/home', paid))).toContain('Payday week');
    expect(text(renderAt('#/home', advance(paid, 1, 'flat')))).not.toContain('Payday week');
  });

  it('time of day and weekend previews: greeting and "Markets are resting"', () => {
    const night = run(riya, { type: 'setPreview', patch: { timeOfDay: 'night', day: 'weekend' } });
    const t = text(renderAt('#/home', night));
    expect(t).toContain('Quiet night, Riya');
    expect(t).toContain('Markets are resting. So can you.');
    expect(text(renderAt('#/explore', night))).toContain('Markets are resting. So can you.');
    expect(text(renderAt('#/home', run(riya, { type: 'setPreview', patch: { day: 'weekday' } })))).not.toContain('Markets are resting');
  });

  it('goal ring: a progressbar with the % written inside, glowing only at 100%', () => {
    const meera = buildPersona('meera', TODAY);
    const html = renderAt('#/portfolio/goals', meera);
    expect(html).toMatch(/role="progressbar"[^>]*aria-valuenow="\d+"/);
    expect(html).not.toContain('goal-ring-glow');
    const g = meera.goals[0];
    const done = run(meera, { type: 'updateGoal', goalId: g.id, patch: { target: 100 } });
    expect(renderAt(`#/portfolio/goal/${g.id}`, done)).toContain('goal-ring-glow');
  });

  it('Reviewer tools has a Mood control with every mood, plus time of day and day', () => {
    const t = text(renderAt('#/review', fresh()));
    for (const s of ['Mood', 'Auto', 'Up week', 'Flat', 'Small dip', 'Big dip', 'Time of day', 'Morning', 'Night', 'Weekend']) expect(t).toContain(s);
  });
});
