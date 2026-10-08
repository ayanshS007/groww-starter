// Dashboard logic (README 9 item 21, PLAN S30 and item 37). Only the user's own
// money and plan: no indices, gainers/losers, other users or projections.
import { getFund } from '../data/funds';
import type { ActivityItem, FundId, ISODate, State } from '../state/types';
import { addDays, dayOfMonth, nextDateForDay } from './dates';
import { cushionValue, goalSavingsValue, portfolioValue, seriesWithFlow, simDate, simToday, stockValue } from './market';
import type { HealthCheck } from './planHealth';
import { assetName } from './portfolio';

// ---------- periods ----------
export type Period = '4w' | '12w' | 'all';

export const PERIODS: { id: Period; label: string }[] = [
  { id: '4w', label: 'Last 4 weeks' },
  { id: '12w', label: 'Last 12 weeks' },
  { id: 'all', label: 'Since start' },
];

const PERIOD_WEEKS: Record<Exclude<Period, 'all'>, number> = { '4w': 4, '12w': 12 };

// ---------- value vs invested ----------
export type ChartPoint = {
  week: number;
  date: ISODate;
  invested: number;
  value: number;
  /** Market move that week: value change minus money in or out. */
  move: number;
  /** The portfolio fell that week (by at least ₹1). */
  down: boolean;
  /** A down week in which no SIP was stopped (README 9 item 21). */
  stayedInvested: boolean;
};

/** Weekly points from the first week with money in, to the current week. */
export function chartPoints(state: Pick<State, 'activity' | 'market'>): ChartPoint[] {
  const series = seriesWithFlow(state);
  const start = series.findIndex((p) => p.invested > 0 || p.value > 0);
  if (start < 0) return [];
  const stoppedWeeks = new Set(state.activity.filter((a) => a.kind === 'sip_stopped').map((a) => a.week));
  return series.slice(start).map((p, i, all) => {
    const prev = i > 0 ? all[i - 1] : undefined;
    const move = prev ? p.value - prev.value - p.flow : 0;
    const down = !!prev && prev.value > 0 && move <= -1;
    return {
      week: p.week,
      date: simDate(state.market.startDate, p.week),
      invested: p.invested,
      value: p.value,
      move,
      down,
      stayedInvested: down && !stoppedWeeks.has(p.week),
    };
  });
}

/** The last N weeks (N + 1 points) or everything. */
export function periodPoints<T>(points: T[], period: Period): T[] {
  if (period === 'all') return points;
  return points.slice(-(PERIOD_WEEKS[period] + 1));
}

/** The most recent down week, if any. */
export function latestDip(points: ChartPoint[]): ChartPoint | undefined {
  for (let i = points.length - 1; i >= 0; i--) if (points[i].down) return points[i];
  return undefined;
}

// ---------- where your money is ----------
export type AllocationId = 'cushion' | 'goals' | 'grow' | 'stocks' | 'gold';
export type AllocationSlice = { id: AllocationId; label: string; value: number; pct: number };

export const ALLOCATION_LABEL: Record<AllocationId, string> = {
  cushion: 'Emergency fund',
  goals: 'Goal savings',
  grow: 'Long-term investing',
  stocks: 'Stocks',
  gold: 'Gold',
};

/**
 * Cushion (liquid funds not behind a goal), grow funds (other funds except gold),
 * stocks and gold: always these four. Goal savings (liquid funds behind a goal,
 * QA #17) is added only when there is some.
 */
export function allocation(state: Pick<State, 'holdings' | 'market'> & Partial<Pick<State, 'goals' | 'sips'>>): { total: number; slices: AllocationSlice[] } {
  const total = portfolioValue(state);
  const cushion = cushionValue(state);
  const goals = goalSavingsValue(state);
  const stocks = stockValue(state);
  const gold = portfolioValue({
    market: state.market,
    holdings: state.holdings.filter((h) => h.kind === 'fund' && getFund(h.assetId)?.category === 'Gold'),
  });
  const grow = Math.max(0, total - cushion - goals - stocks - gold);
  const values: Record<AllocationId, number> = { cushion, goals, grow, stocks, gold };
  const ids: AllocationId[] = goals > 0.005 ? ['cushion', 'goals', 'grow', 'stocks', 'gold'] : ['cushion', 'grow', 'stocks', 'gold'];
  return {
    total,
    slices: ids.map((id) => ({ id, label: ALLOCATION_LABEL[id], value: values[id], pct: total > 0 ? (values[id] / total) * 100 : 0 })),
  };
}

/** Whole-number split that always adds up to 100. */
function split(cushionPct: number): [number, number] {
  const c = Math.min(100, Math.max(0, Math.round(cushionPct)));
  return [c, 100 - c];
}

/**
 * "Plan split: 50 / 50 · Actual: 62 / 38" (cushion / grow). The actual split is
 * liquid funds against everything else (PLAN item 37).
 */
export function splitLine(state: Pick<State, 'plan' | 'holdings' | 'market'> & Partial<Pick<State, 'goals' | 'sips'>>): string {
  const total = portfolioValue(state);
  // Compared like for like with the plan, whose cushion part is a liquid fund:
  // all liquid money counts here, including goal savings (QA #17 follow-up).
  const liquid = cushionValue(state) + goalSavingsValue(state);
  const actual = split(total > 0 ? (liquid / total) * 100 : 0);
  const actualText = `Actual: ${actual[0]} / ${actual[1]}`;
  if (!state.plan) return `${actualText} (emergency fund / long-term investing)`;
  const plan = split(state.plan.cushionPct);
  return `Plan split: ${plan[0]} / ${plan[1]} · ${actualText}`;
}

// ---------- this month's SIPs ----------
export type MonthSipStatus = 'done' | 'upcoming' | 'skipped' | 'paused';

export type MonthSipRow = {
  key: string;
  sipId: string;
  fundId: FundId;
  date: ISODate;
  amount: number;
  status: MonthSipStatus;
};

function monthBounds(today: ISODate): { first: ISODate; last: ISODate } {
  const first = addDays(today, 1 - dayOfMonth(today));
  const nextFirst = nextDateForDay(addDays(first, 28), 1);
  return { first, last: addDays(nextFirst, -1) };
}

/**
 * Every SIP date in the simulated current month with its status: done or
 * skipped (from the activity log), paused (missed while paused, or still ahead
 * inside a pause), and upcoming (the next skipped one shows as skipped).
 */
export function monthSips(state: Pick<State, 'sips' | 'activity' | 'market'>): MonthSipRow[] {
  const today = simToday(state.market);
  const { first, last } = monthBounds(today);
  const rows: MonthSipRow[] = [];
  const seen = new Set<string>();
  const add = (r: Omit<MonthSipRow, 'key'>) => {
    const key = `${r.sipId}:${r.date}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ key, ...r });
  };

  for (const a of state.activity) {
    if (a.at < first || a.at > today || !a.sipId) continue;
    if (a.kind !== 'sip_instalment' && a.kind !== 'sip_skipped') continue;
    const sip = state.sips.find((s) => s.id === a.sipId);
    add({
      sipId: a.sipId,
      fundId: (sip?.fundId ?? a.assetId) as FundId,
      date: a.at,
      amount: a.amount ?? sip?.amount ?? 0,
      status: a.kind === 'sip_instalment' ? 'done' : 'skipped',
    });
  }

  for (const sip of state.sips) {
    if (sip.status === 'stopped') continue;
    const resumedLater = (date: ISODate) =>
      state.activity.some((a) => a.sipId === sip.id && a.kind === 'sip_resumed' && a.at > date);
    // Dates already passed this month that posted nothing: missed while paused.
    let d = nextDateForDay(first, sip.dayOfMonth);
    if (d <= today && d >= sip.createdAt && !seen.has(`${sip.id}:${d}`) && (sip.status === 'paused' || resumedLater(d))) {
      add({ sipId: sip.id, fundId: sip.fundId, date: d, amount: sip.amount, status: 'paused' });
    }
    // Dates still ahead this month.
    let firstAhead = true;
    d = nextDateForDay(addDays(today, 1), sip.dayOfMonth);
    while (d <= last) {
      if (d >= sip.createdAt) {
        const paused = sip.status === 'paused' && (!sip.pausedUntil || d <= sip.pausedUntil);
        const skipped = !paused && sip.skipNext && firstAhead;
        add({ sipId: sip.id, fundId: sip.fundId, date: d, amount: sip.amount, status: paused ? 'paused' : skipped ? 'skipped' : 'upcoming' });
        if (!paused) firstAhead = false;
      }
      d = nextDateForDay(addDays(d, 1), sip.dayOfMonth);
    }
  }

  return rows.sort((a, b) => (a.date === b.date ? a.sipId.localeCompare(b.sipId) : a.date < b.date ? -1 : 1));
}

// ---------- recent activity ----------
export type ActivityTone = 'good' | 'watch' | 'neutral';

export type ActivityRow = {
  id: string;
  date: ISODate;
  what: string;
  asset?: string;
  amount?: number;
  status: string;
  tone: ActivityTone;
};

const ACTIVITY_TEXT: Record<ActivityItem['kind'], { what: string; status: string; tone: ActivityTone }> = {
  sip_instalment: { what: 'SIP instalment', status: 'Done', tone: 'good' },
  sip_skipped: { what: 'Instalment skipped', status: 'Skipped', tone: 'neutral' },
  sip_paused: { what: 'SIP paused', status: 'Paused', tone: 'watch' },
  sip_resumed: { what: 'SIP resumed', status: 'Resumed', tone: 'good' },
  sip_stopped: { what: 'SIP stopped', status: 'Stopped', tone: 'neutral' },
  sip_edited: { what: 'SIP changed', status: 'Changed', tone: 'neutral' },
  one_time: { what: 'One-time investment', status: 'Done', tone: 'good' },
  buy: { what: 'Bought shares', status: 'Done', tone: 'good' },
  redeem: { what: 'Withdrawal', status: 'Withdrawn', tone: 'neutral' },
  goal_created: { what: 'Goal created', status: 'New', tone: 'neutral' },
};

const idNum = (id: string) => Number(id.split('_').pop()) || 0;

/** Newest first; ties keep the order things happened in, reversed. */
export function activityRows(state: Pick<State, 'activity'>): ActivityRow[] {
  return [...state.activity]
    .sort((a, b) => (a.at === b.at ? idNum(b.id) - idNum(a.id) : a.at < b.at ? 1 : -1))
    .map((a) => {
      const t = ACTIVITY_TEXT[a.kind];
      const what = a.kind === 'sip_resumed' && a.note === 'auto' ? 'SIP restarted on its own' : t.what;
      return {
        id: a.id,
        date: a.at,
        what,
        asset: a.assetId ? assetName(a.assetId) : a.note,
        amount: a.kind === 'sip_paused' || a.kind === 'sip_resumed' || a.kind === 'sip_stopped' ? undefined : a.amount,
        status: t.status,
        tone: t.tone,
      };
    });
}

/** Rows shown before "See all". */
export const ACTIVITY_PREVIEW = 8;

/** True when there is something of the user's own to show. */
export function hasDashboardData(state: Pick<State, 'holdings'>): boolean {
  return state.holdings.some((h) => h.units > 0);
}

// ---------- plan health links ----------
/** Each plan-health row links to the screen that fixes it (Payday Split, Stock budget, …). */
export function healthLink(check: HealthCheck): { to: string; label: string } {
  return { to: check.fixRoute, label: check.fixLabel };
}
