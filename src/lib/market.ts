// Simulated market (README 8.4, PLAN items 11–12). Pure functions, no React.
import { getFund } from '../data/funds';
import { getStock } from '../data/stocks';
import type { ActivityItem, AssetId, Fund, Holding, Horizon, ISODate, MarketState, Scenario, State } from '../state/types';
import { addDays } from './dates';

/** Weekly benchmark move per scenario. */
export const SCENARIO_MOVE: Record<Scenario, number> = {
  normal: 0.006,
  dip_small: -0.018,
  dip_sharp: -0.08,
  up: 0.024,
  flat: 0.001,
};

export const SCENARIOS: Scenario[] = ['normal', 'dip_small', 'dip_sharp', 'up', 'flat'];

export function scenarioMove(s: Scenario): number {
  return SCENARIO_MOVE[s];
}

/** Volatility factor: fund `vol` or stock `volFactor`. Unknown assets don't move. */
export function assetVol(assetId: AssetId): number {
  return getFund(assetId)?.vol ?? getStock(assetId)?.volFactor ?? 0;
}

/** Price at simulated week 0: fund baseNav or stock sample price. */
export function baseNav(assetId: AssetId): number {
  return getFund(assetId)?.baseNav ?? getStock(assetId)?.price ?? 0;
}

export function assetMove(assetId: AssetId, s: Scenario): number {
  return scenarioMove(s) * assetVol(assetId);
}

/** NAV(asset, week) = baseNav × Π(1 + scenarioMove × vol) over history[0..week-1]. */
export function navAt(assetId: AssetId, week: number, history: Scenario[]): number {
  let nav = baseNav(assetId);
  const vol = assetVol(assetId);
  for (let i = 0; i < week && i < history.length; i++) nav *= 1 + scenarioMove(history[i]) * vol;
  return nav;
}

/** NAV for every week 0..history.length. */
export function navSeries(assetId: AssetId, history: Scenario[]): number[] {
  const out = [baseNav(assetId)];
  const vol = assetVol(assetId);
  for (let i = 0; i < history.length; i++) out.push(out[i] * (1 + scenarioMove(history[i]) * vol));
  return out;
}

export function simDate(startDate: ISODate, week: number): ISODate {
  return addDays(startDate, 7 * week);
}

export function simToday(market: MarketState): ISODate {
  return simDate(market.startDate, market.week);
}

export function currentNav(assetId: AssetId, market: MarketState): number {
  return navAt(assetId, market.week, market.history);
}

export function holdingValue(h: Holding, market: MarketState): number {
  return h.units * currentNav(h.assetId, market);
}

type MoneyState = Pick<State, 'holdings' | 'market'>;

export function portfolioValue(state: MoneyState): number {
  return state.holdings.reduce((sum, h) => sum + holdingValue(h, state.market), 0);
}

export function totalInvested(state: Pick<State, 'holdings'>): number {
  return state.holdings.reduce((sum, h) => sum + h.invested, 0);
}

export type Change = { amount: number; pct: number };

/**
 * Direction as the user will read it (QA #31): flat when the shown rupees are
 * ₹0 or the shown percent is 0.0%, so a ₹1 wobble isn't "down" with an arrow.
 */
export function changeDirection(c: Change): 'up' | 'down' | 'flat' {
  if (Math.round(Math.abs(c.amount)) === 0 || Math.round(Math.abs(c.pct) * 10) === 0) return 'flat';
  return c.amount < 0 ? 'down' : 'up';
}

/** Value against total invested. */
export function overallChange(state: MoneyState): Change {
  const invested = totalInvested(state);
  const amount = portfolioValue(state) - invested;
  return { amount, pct: invested > 0 ? (amount / invested) * 100 : 0 };
}

export type SeriesPoint = { week: number; invested: number; value: number };
/** A weekly point plus the money that went in (+) or out (−) that week. */
export type FlowPoint = SeriesPoint & { flow: number };

const UNIT_KINDS = new Set<ActivityItem['kind']>(['sip_instalment', 'one_time', 'buy', 'redeem']);

/** Weekly points with each week's net money in or out, from week 0 to the current week. */
export function seriesWithFlow(state: Pick<State, 'activity' | 'market'>): FlowPoint[] {
  const { week, history } = state.market;
  const byWeek = new Map<number, ActivityItem[]>();
  for (const a of state.activity) {
    if (!UNIT_KINDS.has(a.kind) || !a.assetId || a.units === undefined) continue;
    const list = byWeek.get(a.week) ?? [];
    list.push(a);
    byWeek.set(a.week, list);
  }
  const navs = new Map<AssetId, number[]>();
  const nav = (id: AssetId, w: number) => {
    let s = navs.get(id);
    if (!s) navs.set(id, (s = navSeries(id, history)));
    return s[Math.min(w, s.length - 1)];
  };
  const units = new Map<AssetId, number>();
  const invested = new Map<AssetId, number>();
  const out: FlowPoint[] = [];
  for (let w = 0; w <= week; w++) {
    let flow = 0;
    for (const a of byWeek.get(w) ?? []) {
      const id = a.assetId as AssetId;
      const u = units.get(id) ?? 0;
      const inv = invested.get(id) ?? 0;
      if (a.kind === 'redeem') {
        const share = u > 0 ? Math.min(1, (a.units ?? 0) / u) : 0;
        units.set(id, Math.max(0, u - (a.units ?? 0)));
        invested.set(id, inv * (1 - share));
        flow -= a.amount ?? 0;
      } else {
        units.set(id, u + (a.units ?? 0));
        invested.set(id, inv + (a.amount ?? 0));
        flow += a.amount ?? 0;
      }
    }
    let value = 0;
    let inv = 0;
    for (const [id, u] of units) value += u * nav(id, w);
    for (const v of invested.values()) inv += v;
    out.push({ week: w, invested: inv, value, flow });
  }
  return out;
}

/** Weekly { week, invested, value } points from week 0 to the current week (README 8.4). */
export function valueSeries(state: Pick<State, 'activity' | 'market'>): SeriesPoint[] {
  return seriesWithFlow(state).map(({ week, invested, value }) => ({ week, invested, value }));
}

/**
 * The portfolio's market move in the latest week: the value change minus the
 * money that went in or out that week. Percent is against last week's value.
 */
export function weekChange(state: Pick<State, 'activity' | 'market'>): Change {
  const s = seriesWithFlow(state);
  if (s.length < 2) return { amount: 0, pct: 0 };
  const cur = s[s.length - 1];
  const prev = s[s.length - 2];
  const amount = cur.value - prev.value - cur.flow;
  return { amount, pct: prev.value > 0 ? (amount / prev.value) * 100 : 0 };
}

// ---------- horizons ----------
const HORIZON_RANK: Record<Horizon, number> = { lt1: 0, '1to3': 1, '3to5': 2, '5plus': 3 };

export function horizonRank(h: Horizon): number {
  return HORIZON_RANK[h];
}

export const HORIZON_TEXT: Record<Horizon, string> = {
  lt1: 'under 1 year',
  '1to3': '1–3 years',
  '3to5': '3–5 years',
  '5plus': '5+ years',
};

/** Fund holdings only, resolved to their fund records. */
export function heldFunds(holdings: Holding[]): Fund[] {
  const out: Fund[] = [];
  for (const h of holdings) {
    const f = h.kind === 'fund' ? getFund(h.assetId) : undefined;
    if (f && h.units > 0) out.push(f);
  }
  return out;
}

/**
 * A fund holding first bought this simulated week is still processing (QA #15):
 * its value equals what was invested until the next week is applied.
 */
export const PROCESSING_NOTE = 'Processing, units arrive in 1–2 working days';

export function isProcessing(h: Holding, market: Pick<State['market'], 'week'>): boolean {
  return h.kind === 'fund' && h.createdWeek === market.week;
}

type GoalLinks = Partial<Pick<State, 'goals' | 'sips'>>;

/**
 * Funds behind a goal other than an Emergency cushion goal: that money is
 * saved for something, so it isn't the emergency cushion (QA #17).
 */
export function goalFundIds(state: GoalLinks): Set<string> {
  const ids = new Set<string>();
  for (const g of state.goals ?? []) {
    if (g.isCushion) continue;
    for (const sipId of g.sipIds) {
      const sip = state.sips?.find((s) => s.id === sipId);
      if (sip) ids.add(sip.fundId);
    }
  }
  return ids;
}

function liquidHoldings(state: MoneyState) {
  return state.holdings.filter((h) => h.kind === 'fund' && getFund(h.assetId)?.category === 'Liquid');
}

/**
 * The "cushion" (PLAN item 33, QA #17): liquid-category holdings that aren't
 * behind a goal. An Emergency cushion goal's money still counts.
 */
export function cushionValue(state: MoneyState & GoalLinks): number {
  const forGoals = goalFundIds(state);
  return liquidHoldings(state)
    .filter((h) => !forGoals.has(h.assetId))
    .reduce((sum, h) => sum + holdingValue(h, state.market), 0);
}

/** Liquid holdings saved for a goal: shown as "Goal savings", not cushion. */
export function goalSavingsValue(state: MoneyState & GoalLinks): number {
  const forGoals = goalFundIds(state);
  return liquidHoldings(state)
    .filter((h) => forGoals.has(h.assetId))
    .reduce((sum, h) => sum + holdingValue(h, state.market), 0);
}

export function stockValue(state: MoneyState): number {
  return state.holdings.filter((h) => h.kind === 'stock').reduce((sum, h) => sum + holdingValue(h, state.market), 0);
}

/** One plain sentence per scenario for Starter Explore (PLAN item 39). */
export const MARKETS_THIS_WEEK: Record<Scenario, string> = {
  normal: 'Markets this week: a small rise. Normal for a week.',
  dip_small: 'Markets this week: a small dip. Normal for a week.',
  dip_sharp: 'Markets this week: a bigger dip than usual. These happen every few years.',
  up: 'Markets this week: a good rise. One week is not a trend.',
  flat: 'Markets this week: almost no change.',
};
