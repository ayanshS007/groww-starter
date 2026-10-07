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
    expect(portfolioIn(riya)).toContain('Review my plan (optional)');
    expect(homeIn(riya)).toContain('This week: −');
  });

  for (const scenario of SCENARIOS) {
    it(`${scenario}: Portfolio and Home restate this week's move, and never use alarm words or red`, () => {
      const s = advance(riya, 1, scenario);
      for (const [name, html] of [['Portfolio', renderAt('#/portfolio', s)], ['Home', renderAt('#/home', s)]] as const) {
        const lower = text(html).toLowerCase();
        for (const w of ALARM_WORDS) expect(lower, `${name} ${scenario}`).not.toContain(w);
        expect(html, `${name} ${scenario}`).not.toMatch(/market-down|text-red|bg-red|border-red/);
        expect(lower).toContain('this week:');
      }
    });
  }

  it('an up week after a big dip keeps the big-dip words (overall is still ≤ −10%), then turns calm once it recovers', () => {
    const oneUp = advance(riya, 1, 'up');
    expect(portfolioIn(oneUp)).toContain('This week: +');
    expect(portfolioIn(oneUp)).toContain('bigger fall than usual'); // PLAN item 15, rule 1 comes first
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
      heads.add(portfolioIn(s).match(/This week: [^.]*\.\d*[^.]*%\)/)?.[0] ?? '');
    }
    expect(heads.size).toBe(4);
  });

  it('Advance one week ×3 keeps the insight and the numbers consistent between Home and Portfolio', () => {
    const s = advance(riya, 3, 'dip_small');
    const p = portfolioIn(s).match(/This week: ([^)]*\))/)?.[1];
    const h = homeIn(s).match(/This week: ([^)]*\))/)?.[1];
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
    const html = renderAt('#/home', riya);
    expect(html).toMatch(/aria-live="polite"[^>]*>(<p class="flex gap-2 rounded-card-sm)/);
    expect(renderAt('#/portfolio', riya)).toMatch(/aria-label="This week"/);
  });
});
