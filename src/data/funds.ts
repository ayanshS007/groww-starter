// Sample funds from README 7.1. Generic names only; every number is illustrative.
import type { Fund, FundId, PlanCategoryId } from '../state/types';

/** Deterministic 24-point walk (mulberry32), so sparklines never change between loads. */
export function sampleSparkline(seed: number, vol: number, drift = 0.004, start = 100): number[] {
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const out: number[] = [start];
  for (let i = 1; i < 24; i++) {
    const step = drift + (rand() - 0.5) * 0.05 * vol;
    out.push(Math.round(out[i - 1] * (1 + step) * 100) / 100);
  }
  return out;
}

export const FUNDS: Fund[] = [
  {
    id: 'liquid1',
    name: 'Liquid Fund – A',
    category: 'Liquid',
    planCategory: 'liquid',
    oneLiner: 'A parking spot for money you may need soon',
    risk: 1,
    horizon: 'lt1',
    horizonLabel: '< 1 yr',
    minSip: 100,
    minOneTime: 100,
    vol: 0.02,
    whatItIs:
      'It lends money for a few days to weeks to large, steady borrowers. Its value moves very little. Money you withdraw reaches your bank in 1–3 working days.',
    mainRisk: 'Returns are modest and can trail rising prices over many years.',
    goodFor: 'An emergency fund or money you may need within a year.',
    notIdealFor: 'Long-term growth over five years or more.',
    illustrativeRange1y: { low: 5, high: 7 },
    expenseRatio: 0.2,
    exitLoad: 'A tiny fee if you withdraw within 7 days. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 1000,
    sparkline: sampleSparkline(11, 0.02, 0.0005),
    illustrativeReturns: { y1: 6.8, y3: 6.2, y5: 5.6 },
  },
  {
    id: 'liquid2',
    name: 'Liquid Fund – B',
    category: 'Liquid',
    planCategory: 'liquid',
    oneLiner: 'Same idea, different fund house',
    risk: 1,
    horizon: 'lt1',
    horizonLabel: '< 1 yr',
    minSip: 100,
    minOneTime: 500,
    vol: 0.02,
    whatItIs:
      'Like Liquid Fund – A, it lends money for very short periods. Its value moves very little. Money you withdraw reaches your bank in 1–3 working days.',
    mainRisk: 'Returns are modest and can trail rising prices over many years.',
    goodFor: 'An emergency fund or money you may need within a year.',
    notIdealFor: 'Long-term growth over five years or more.',
    illustrativeRange1y: { low: 5, high: 7 },
    expenseRatio: 0.25,
    exitLoad: 'A tiny fee if you withdraw within 7 days. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 2400,
    sparkline: sampleSparkline(12, 0.02, 0.0005),
    illustrativeReturns: { y1: 6.7, y3: 6.1, y5: 5.5 },
  },
  {
    id: 'shortdebt1',
    name: 'Short Duration Debt Fund',
    category: 'Debt',
    planCategory: 'short_debt',
    oneLiner: 'Lends for short periods; steadier than shares',
    risk: 2,
    horizon: '1to3',
    horizonLabel: '1–3 yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 0.15,
    whatItIs:
      'It lends to companies and the government for one to three years. Interest builds your value slowly. Prices move a little when interest rates change.',
    mainRisk: 'If interest rates rise or a borrower struggles, the value can dip for a while.',
    goodFor: 'Money you need in 1–3 years, with a steadier ride than shares.',
    notIdealFor: 'Money you may need next month, or growth over 5+ years.',
    illustrativeRange1y: { low: 4, high: 9 },
    expenseRatio: 0.35,
    exitLoad: 'No fee to withdraw, at any time.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 42,
    sparkline: sampleSparkline(13, 0.15, 0.002),
    illustrativeReturns: { y1: 7.4, y3: 6.6, y5: 6.9 },
  },
  {
    id: 'arb1',
    name: 'Arbitrage Fund',
    category: 'Hybrid',
    oneLiner: 'Low-risk fund using price gaps between markets',
    risk: 2,
    horizon: '1to3',
    horizonLabel: '1–3 yrs',
    minSip: 500,
    minOneTime: 1000,
    vol: 0.05,
    whatItIs:
      'It buys a share in one market and sells it in another where the price is a little higher. The small gap is its return. It rarely swings much.',
    mainRisk: 'When price gaps are small, returns can be lower than a liquid fund.',
    goodFor: 'Parking money for a year or more with very small swings.',
    notIdealFor: 'Long-term growth, or amounts under ₹500 a month.',
    illustrativeRange1y: { low: 5, high: 7.5 },
    expenseRatio: 0.4,
    exitLoad: '0.25% fee if you withdraw within 30 days. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 31,
    sparkline: sampleSparkline(14, 0.05, 0.0012),
    illustrativeReturns: { y1: 7.1, y3: 6.3, y5: 5.8 },
  },
  {
    id: 'balanced1',
    name: 'Balanced Advantage Fund',
    category: 'Hybrid',
    planCategory: 'balanced',
    oneLiner: 'Shares and bonds mix that shifts with markets',
    risk: 3,
    horizon: '3to5',
    horizonLabel: '3–5 yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 0.6,
    whatItIs:
      'It holds both shares and bonds. When shares look expensive it holds more bonds, and the other way round. The aim is a smoother ride than shares alone.',
    mainRisk: 'It can still fall 10–15% in a bad year, though usually less than shares.',
    goodFor: 'Growing money over 3–5 years with fewer big swings.',
    notIdealFor: 'Money you need within a year.',
    illustrativeRange1y: { low: -6, high: 18 },
    expenseRatio: 0.7,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 58,
    sparkline: sampleSparkline(15, 0.6, 0.004),
    illustrativeReturns: { y1: 11.2, y3: 10.4, y5: 10.9 },
  },
  {
    id: 'index50',
    name: 'Nifty 50 Index Fund',
    category: 'Index',
    planCategory: 'index50',
    oneLiner: "A slice of India's 50 largest companies",
    risk: 4,
    horizon: '5plus',
    horizonLabel: '5+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.0,
    whatItIs:
      'It buys the 50 companies in the Nifty 50 index, in the same mix. No manager picks shares, so costs stay low. It moves with the market.',
    mainRisk: 'It can fall 20–30% in a bad year and take years to recover.',
    goodFor: 'Long-term growth over 5+ years at a low cost.',
    notIdealFor: 'Money you may need in the next 1–3 years.',
    illustrativeRange1y: { low: -15, high: 30 },
    expenseRatio: 0.2,
    exitLoad: 'No fee to withdraw, at any time.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 150,
    sparkline: sampleSparkline(16, 1.0, 0.006),
    illustrativeReturns: { y1: 13.5, y3: 12.1, y5: 13.8 },
  },
  {
    id: 'indexnext50',
    name: 'Nifty Next 50 Index Fund',
    category: 'Index',
    oneLiner: 'The next 50 big companies; more swings',
    risk: 4,
    horizon: '5plus',
    horizonLabel: '5+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.25,
    whatItIs:
      'It buys the 50 companies just below the Nifty 50 in size. They can grow faster but swing more. No manager picks shares, so costs stay low.',
    mainRisk: 'It can fall 25–35% in a bad year, more than the Nifty 50.',
    goodFor: 'Long-term growth over 5+ years if you can sit through bigger swings.',
    notIdealFor: 'Money you may need soon, or your first and only fund.',
    illustrativeRange1y: { low: -22, high: 40 },
    expenseRatio: 0.3,
    exitLoad: 'No fee to withdraw, at any time.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 48,
    sparkline: sampleSparkline(17, 1.25, 0.006),
    illustrativeReturns: { y1: 15.2, y3: 13.0, y5: 14.1 },
  },
  {
    id: 'flexi1',
    name: 'Flexi Cap Fund',
    category: 'Equity',
    planCategory: 'flexi',
    oneLiner: 'A manager picks shares across company sizes',
    risk: 5,
    horizon: '5plus',
    horizonLabel: '5+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.2,
    whatItIs:
      'A fund manager picks shares of large, mid and small companies. The mix changes as the manager sees fit. Costs are higher than an index fund.',
    mainRisk: 'It can fall 25–35% in a bad year, and the manager may do worse than the index.',
    goodFor: 'Long-term growth over 5+ years with a manager choosing shares.',
    notIdealFor: 'Money you may need within 5 years.',
    illustrativeRange1y: { low: -18, high: 35 },
    expenseRatio: 0.8,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 72,
    sparkline: sampleSparkline(18, 1.2, 0.006),
    illustrativeReturns: { y1: 14.6, y3: 13.4, y5: 14.9 },
  },
  {
    id: 'midcap1',
    name: 'Mid Cap Fund',
    category: 'Equity',
    oneLiner: 'Mid-sized companies; bigger hopes, bigger falls',
    risk: 5,
    horizon: '5plus',
    horizonLabel: '7+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.45,
    whatItIs:
      'A manager picks shares of mid-sized companies. They can grow fast but also fall hard. It needs a long time to smooth out the swings.',
    mainRisk: 'It can fall 30–40% in a bad year and stay down for a long time.',
    goodFor: 'Money you won’t touch for 7+ years, alongside a steadier fund.',
    notIdealFor: 'Your first fund, or money you may need within 7 years.',
    illustrativeRange1y: { low: -28, high: 50 },
    expenseRatio: 0.9,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 95,
    sparkline: sampleSparkline(19, 1.45, 0.007),
    illustrativeReturns: { y1: 18.9, y3: 16.2, y5: 17.5 },
  },
  {
    id: 'gold1',
    name: 'Gold Fund of Fund',
    category: 'Gold',
    oneLiner: 'Tracks gold without buying jewellery',
    risk: 3,
    horizon: '3to5',
    horizonLabel: '3+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 0.4,
    whatItIs:
      'It invests in a fund that holds gold. Its value follows the gold price. There are no making charges or storage worries.',
    mainRisk: 'Gold can stay flat or fall for several years in a row.',
    goodFor: 'A small part of your money that moves differently from shares.',
    notIdealFor: 'Your main or only investment.',
    illustrativeRange1y: { low: -8, high: 20 },
    expenseRatio: 0.5,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 22,
    sparkline: sampleSparkline(20, 0.4, 0.004),
    illustrativeReturns: { y1: 9.8, y3: 11.2, y5: 10.1 },
  },
  // Stage 7a: a second fund in each category the planner uses, so the plan can list 2–3 to pick from.
  // Same shape as the others; every number is illustrative.
  {
    id: 'shortdebt2',
    name: 'Short Duration Debt Fund – B',
    category: 'Debt',
    planCategory: 'short_debt',
    oneLiner: 'Lends for short periods; a second fund of the same type',
    risk: 2,
    horizon: '1to3',
    horizonLabel: '1–3 yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 0.17,
    whatItIs:
      'Like Short Duration Debt Fund, it lends to companies and the government for one to three years. Interest builds your value slowly. Prices move a little when interest rates change.',
    mainRisk: 'If interest rates rise or a borrower struggles, the value can dip for a while.',
    goodFor: 'Money you need in 1–3 years, with a steadier ride than shares.',
    notIdealFor: 'Money you may need next month, or growth over 5+ years.',
    illustrativeRange1y: { low: 4, high: 9 },
    expenseRatio: 0.4,
    exitLoad: 'No fee to withdraw, at any time.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 58,
    sparkline: sampleSparkline(21, 0.17, 0.002),
    illustrativeReturns: { y1: 7.2, y3: 6.5, y5: 6.7 },
  },
  {
    id: 'balanced2',
    name: 'Balanced Advantage Fund – B',
    category: 'Hybrid',
    planCategory: 'balanced',
    oneLiner: 'Shares and bonds mix; a second fund of the same type',
    risk: 3,
    horizon: '3to5',
    horizonLabel: '3–5 yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 0.62,
    whatItIs:
      'Like Balanced Advantage Fund, it holds shares and bonds and shifts the mix as markets move. It usually swings less than a pure share fund, but it can still fall.',
    mainRisk: 'It can fall 10–20% in a bad year, and the manager’s mix may not help.',
    goodFor: 'Money for 3–5 years that you want to grow with a smoother ride.',
    notIdealFor: 'Money you may need within 3 years.',
    illustrativeRange1y: { low: -10, high: 22 },
    expenseRatio: 0.75,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 31,
    sparkline: sampleSparkline(22, 0.62, 0.004),
    illustrativeReturns: { y1: 10.4, y3: 9.6, y5: 10.8 },
  },
  {
    id: 'index50b',
    name: 'Nifty 50 Index Fund – B',
    category: 'Index',
    planCategory: 'index50',
    oneLiner: 'A slice of India’s 50 largest companies; a second fund of the same type',
    risk: 4,
    horizon: '5plus',
    horizonLabel: '5+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.0,
    whatItIs:
      'Like Nifty 50 Index Fund, it holds the same 50 large companies as the index, in the same proportions. No manager picks shares, so costs stay low.',
    mainRisk: 'It can fall 20–30% in a bad year and take years to recover.',
    goodFor: 'Long-term growth over 5+ years without choosing shares yourself.',
    notIdealFor: 'Money you may need within 5 years.',
    illustrativeRange1y: { low: -15, high: 30 },
    expenseRatio: 0.2,
    exitLoad: '0.25% fee if you withdraw within 30 days. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 39,
    sparkline: sampleSparkline(23, 1.0, 0.006),
    illustrativeReturns: { y1: 12.2, y3: 12.5, y5: 13.3 },
  },
  {
    id: 'flexi2',
    name: 'Flexi Cap Fund – B',
    category: 'Equity',
    planCategory: 'flexi',
    oneLiner: 'A manager picks shares across company sizes; a second fund of the same type',
    risk: 5,
    horizon: '5plus',
    horizonLabel: '5+ yrs',
    minSip: 100,
    minOneTime: 500,
    vol: 1.18,
    whatItIs:
      'Like Flexi Cap Fund, a manager picks shares of large, mid and small companies and changes the mix as they see fit. Costs are higher than an index fund.',
    mainRisk: 'It can fall 25–35% in a bad year, and the manager may do worse than the index.',
    goodFor: 'Long-term growth over 5+ years with a manager choosing shares.',
    notIdealFor: 'Money you may need within 5 years.',
    illustrativeRange1y: { low: -18, high: 35 },
    expenseRatio: 0.85,
    exitLoad: '1% fee if you withdraw within 1 year. None after that.',
    whatHappensNext: [
      'Your money buys units at the next day’s price (NAV).',
      'Units arrive in your portfolio in 1–2 working days.',
      'Withdraw any time; money reaches your bank in 1–3 working days.',
    ],
    baseNav: 64,
    sparkline: sampleSparkline(24, 1.18, 0.006),
    illustrativeReturns: { y1: 14.1, y3: 13.0, y5: 14.4 },
  },
];

const BY_ID = new Map<string, Fund>(FUNDS.map((f) => [f.id, f]));

export function getFund(id: string): Fund | undefined {
  return BY_ID.get(id);
}

export function isFundId(id: string): id is FundId {
  return BY_ID.has(id);
}

/** README 7.1 collections. Filters, not advice. */
export type CollectionId = 'start100' | 'need_this_year' | 'steadier_1_3' | 'long_game' | 'simple_low_cost';

export const COLLECTIONS: { id: CollectionId; label: string; fundIds: FundId[] }[] = [
  { id: 'start100', label: 'Start with ₹100', fundIds: FUNDS.filter((f) => f.minSip <= 100).map((f) => f.id) },
  { id: 'need_this_year', label: 'Money I may need this year', fundIds: FUNDS.filter((f) => f.horizon === 'lt1').map((f) => f.id) },
  { id: 'steadier_1_3', label: 'Steadier ride, 1–3 years', fundIds: FUNDS.filter((f) => f.horizon === '1to3').map((f) => f.id) },
  { id: 'long_game', label: 'Long game, 5+ years', fundIds: FUNDS.filter((f) => f.horizon === '5plus').map((f) => f.id) },
  {
    id: 'simple_low_cost',
    label: 'Simple and low-cost',
    fundIds: FUNDS.filter((f) => (f.category === 'Index' || f.category === 'Liquid') && f.expenseRatio <= 0.3).map((f) => f.id),
  },
];

/** Plan categories (Stage 7a): the planner names one of these, never a single fund. */
export const PLAN_CATEGORIES: Record<
  PlanCategoryId,
  { label: string; /** Short noun for sentences, e.g. "liquid funds". */ plural: string; oneLiner: string; term?: { id: string; text: string } }
> = {
  liquid: { label: 'Liquid funds', plural: 'liquid funds', oneLiner: 'A parking spot for money you may need soon', term: { id: 'liquid-fund', text: 'Liquid fund' } },
  short_debt: { label: 'Short duration debt funds', plural: 'short duration debt funds', oneLiner: 'Lends for short periods; steadier than shares', term: { id: 'debt-fund', text: 'Debt fund' } },
  balanced: { label: 'Balanced advantage funds', plural: 'balanced advantage funds', oneLiner: 'A shares and bonds mix that shifts with markets', term: { id: 'hybrid-fund', text: 'Hybrid fund' } },
  index50: { label: 'Nifty 50 index funds', plural: 'Nifty 50 index funds', oneLiner: 'A slice of India’s 50 largest companies', term: { id: 'index', text: 'Index fund' } },
  flexi: { label: 'Flexi cap funds', plural: 'flexi cap funds', oneLiner: 'A manager picks shares across company sizes', term: { id: 'equity', text: 'Equity fund' } },
};

/** The funds in a plan category, sorted by name (never by return or cost). */
export function fundsInPlanCategory(id: PlanCategoryId): Fund[] {
  return FUNDS.filter((f) => f.planCategory === id).sort((a, b) => a.name.localeCompare(b.name));
}
