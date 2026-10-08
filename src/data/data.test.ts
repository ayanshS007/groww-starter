import { describe, expect, it } from 'vitest';
import { COLLECTIONS, FUNDS, getFund } from './funds';
import { GLOSSARY } from './glossary';
import { HELP_FAQS, READINESS_QUESTIONS, STOCKS_VS_FUNDS } from './learn';
import { STOCKS } from './stocks';

const ADVICE = ['best', 'recommended for you', 'guaranteed', 'top performing', 'must buy'];

describe('funds (README 7.1)', () => {
  it('has the 10 README funds with their table values, then a second fund for each plan category (Stage 7a)', () => {
    expect(FUNDS.map((f) => [f.id, f.risk, f.minSip, f.minOneTime, f.vol])).toEqual([
      ['liquid1', 1, 100, 100, 0.02],
      ['liquid2', 1, 100, 500, 0.02],
      ['shortdebt1', 2, 100, 500, 0.15],
      ['arb1', 2, 500, 1000, 0.05],
      ['balanced1', 3, 100, 500, 0.6],
      ['index50', 4, 100, 500, 1.0],
      ['indexnext50', 4, 100, 500, 1.25],
      ['flexi1', 5, 100, 500, 1.2],
      ['midcap1', 5, 100, 500, 1.45],
      ['gold1', 3, 100, 500, 0.4],
      ['shortdebt2', 2, 100, 500, 0.17],
      ['balanced2', 3, 100, 500, 0.62],
      ['index50b', 4, 100, 500, 1.0],
      ['flexi2', 5, 100, 500, 1.18],
    ]);
    expect(FUNDS.map((f) => f.horizonLabel)).toEqual(['< 1 yr', '< 1 yr', '1–3 yrs', '1–3 yrs', '3–5 yrs', '5+ yrs', '5+ yrs', '5+ yrs', '7+ yrs', '3+ yrs', '1–3 yrs', '3–5 yrs', '5+ yrs', '5+ yrs']);
  });
  it.each(FUNDS.map((f) => [f.id, f] as const))('%s has every required field', (_id, f) => {
    expect(f.whatItIs.split('. ').length).toBeGreaterThanOrEqual(2);
    for (const k of ['mainRisk', 'goodFor', 'notIdealFor', 'exitLoad', 'oneLiner'] as const) expect(f[k].length).toBeGreaterThan(5);
    expect(f.whatHappensNext).toHaveLength(3);
    expect(f.sparkline).toHaveLength(24);
    expect(f.illustrativeRange1y.low).toBeLessThan(f.illustrativeRange1y.high);
    expect(f.expenseRatio).toBeGreaterThan(0);
    expect(f.baseNav).toBeGreaterThan(0);
    expect(Object.keys(f.illustrativeReturns)).toEqual(['y1', 'y3', 'y5']);
  });
  it('collections are filters over existing funds', () => {
    expect(COLLECTIONS.map((c) => c.label)).toEqual([
      'Start with ₹100',
      'Money I may need this year',
      'Steadier ride, 1–3 years',
      'Long game, 5+ years',
      'Simple and low-cost',
    ]);
    for (const c of COLLECTIONS) {
      expect(c.fundIds.length).toBeGreaterThan(0);
      expect(c.fundIds.every((id) => getFund(id))).toBe(true);
    }
  });
  it('sparklines are deterministic', async () => {
    const again = (await import('./funds')).sampleSparkline(16, 1.0, 0.006);
    expect(getFund('index50')!.sparkline).toEqual(again);
  });
});

describe('stocks (README 7.2)', () => {
  it('has 10–12 fictional sample companies, at least two above ₹2,000', () => {
    expect(STOCKS.length).toBeGreaterThanOrEqual(10);
    expect(STOCKS.length).toBeLessThanOrEqual(12);
    expect(STOCKS.every((s) => s.name.endsWith('(sample)'))).toBe(true);
    expect(STOCKS.filter((s) => s.price > 2000).length).toBeGreaterThanOrEqual(2);
    expect(new Set(STOCKS.map((s) => s.id)).size).toBe(STOCKS.length);
  });
  it('every stock has the README fields and a sensible 52-week range', () => {
    for (const s of STOCKS) {
      expect(s.ticker && s.sector && s.whatTheyDo && s.mainRisk).toBeTruthy();
      expect(['Large', 'Mid', 'Small']).toContain(s.sizeLabel);
      expect(s.sparkline).toHaveLength(24);
      expect(s.week52.low).toBeLessThanOrEqual(s.price);
      expect(s.week52.high).toBeGreaterThanOrEqual(s.price);
    }
  });
});

describe('glossary (README 7.3, PLAN item 40)', () => {
  it('has at least 22 unique terms with meaning and analogy', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(22);
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
    for (const t of GLOSSARY) {
      expect(t.meaning.length).toBeGreaterThan(10);
      expect(t.analogy.length).toBeGreaterThan(10);
    }
  });
  it('covers every README and PLAN term', () => {
    const names = GLOSSARY.map((t) => t.term.toLowerCase()).join('|');
    for (const term of [
      'sip', 'nav', 'units', 'expense ratio', 'exit load', 'lump sum', 'redemption', 'index', 'nifty 50', 'equity',
      'debt fund', 'liquid fund', 'kyc', 'upi autopay', 'delivery vs intraday', 'f&o', 'xirr',
      'stocks vs funds', 'average nav', 'mandate', 'step-up', 'cushion',
    ]) {
      expect(names).toContain(term);
    }
  });
});

describe('learn content (PLAN C16)', () => {
  it('has Stocks vs funds, 5 FAQs and 5 readiness questions', () => {
    expect(STOCKS_VS_FUNDS.bullets).toHaveLength(3);
    expect(HELP_FAQS).toHaveLength(5);
    expect(READINESS_QUESTIONS).toHaveLength(5);
    for (const q of READINESS_QUESTIONS) expect(q.options[q.correctIndex]).toBeDefined();
  });
});

describe('copy rules', () => {
  it('no advice language in funds, stocks or glossary', () => {
    const text = JSON.stringify([FUNDS, STOCKS, GLOSSARY, HELP_FAQS]).toLowerCase();
    for (const w of ADVICE) expect(text).not.toContain(w);
  });
});

describe('settlement timings are the same everywhere (QA #13)', () => {
  it('buying: units in 1–2 working days; withdrawing: bank in 1–3 working days', () => {
    const texts = FUNDS.flatMap((f) => [f.whatItIs, ...f.whatHappensNext]);
    for (const t of texts.filter((x) => /working day/.test(x))) {
      expect(t).toMatch(/(Units arrive in your portfolio in 1–2 working days\.|reaches your bank in 1–3 working days\.)/);
    }
    for (const f of FUNDS) {
      expect(f.whatHappensNext).toContain('Units arrive in your portfolio in 1–2 working days.');
      expect(f.whatHappensNext).toContain('Withdraw any time; money reaches your bank in 1–3 working days.');
    }
  });
});
