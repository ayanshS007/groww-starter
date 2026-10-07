// Weekly posting of SIP instalments (README 8.4, PLAN items 11–12) and the
// holding/activity helpers shared by the reducer and persona seeds.
import type { ActivityItem, AssetId, Holding, ISODate, Sip, State } from '../state/types';
import { addDays, nextDateForDay } from './dates';
import { navAt, simDate } from './market';

/** Auto instalments start on the first SIP date at least this many days after the first payment. */
export const FIRST_AUTO_GAP_DAYS = 15;

/** "sip_3" style ids; uses max suffix + 1 so deleted items never cause clashes. */
export function nextId(prefix: string, existing: { id: string }[]): string {
  let max = 0;
  for (const { id } of existing) {
    const m = id.startsWith(prefix + '_') ? Number(id.slice(prefix.length + 1)) : NaN;
    if (Number.isFinite(m) && m > max) max = m;
  }
  return `${prefix}_${max + 1}`;
}

export function holdingIdFor(assetId: AssetId): string {
  return `h_${assetId}`;
}

/** First date the SIP may auto-debit, given its first payment date. */
export function firstAutoDate(sip: Pick<Sip, 'createdAt' | 'dayOfMonth'>): ISODate {
  return nextDateForDay(addDays(sip.createdAt, FIRST_AUTO_GAP_DAYS), sip.dayOfMonth);
}

/** Next date this SIP is due on or after `from` (ignores status). */
export function nextDueDate(sip: Pick<Sip, 'createdAt' | 'dayOfMonth'>, from: ISODate): ISODate {
  const first = firstAutoDate(sip);
  return from <= first ? first : nextDateForDay(from, sip.dayOfMonth);
}

export type DueInstalment = { sipId: string; date: ISODate };

/**
 * Every date in (fromDate, toDate] on which a non-stopped SIP falls due,
 * sorted by date then SIP id. Status (paused, skip) is applied by postWeek.
 */
export function dueInstalments(sips: Sip[], fromDate: ISODate, toDate: ISODate): DueInstalment[] {
  const out: DueInstalment[] = [];
  for (const sip of sips) {
    if (sip.status === 'stopped') continue;
    let d = nextDueDate(sip, addDays(fromDate, 1));
    while (d <= toDate) {
      out.push({ sipId: sip.id, date: d });
      d = nextDateForDay(addDays(d, 1), sip.dayOfMonth);
    }
  }
  return out.sort((a, b) => (a.date === b.date ? a.sipId.localeCompare(b.sipId) : a.date < b.date ? -1 : 1));
}

/** Adds units to the asset's single holding, creating it if needed. */
export function applyBuy(
  holdings: Holding[],
  p: { assetId: AssetId; kind: Holding['kind']; units: number; amount: number; date: ISODate; week: number },
): Holding[] {
  const id = holdingIdFor(p.assetId);
  const existing = holdings.find((h) => h.id === id);
  if (!existing) {
    return [
      ...holdings,
      { id, kind: p.kind, assetId: p.assetId, units: p.units, invested: p.amount, createdAt: p.date, createdWeek: p.week },
    ];
  }
  return holdings.map((h) => (h.id === id ? { ...h, units: h.units + p.units, invested: h.invested + p.amount } : h));
}

/** Removes units and reduces invested pro rata; drops the holding when empty. */
export function applyRedeem(holdings: Holding[], holdingId: string, units: number): Holding[] {
  const out: Holding[] = [];
  for (const h of holdings) {
    if (h.id !== holdingId) {
      out.push(h);
      continue;
    }
    const take = Math.min(units, h.units);
    const left = h.units - take;
    if (left <= 1e-9) continue;
    out.push({ ...h, units: left, invested: h.invested * (left / h.units) });
  }
  return out;
}

function pushActivity(state: State, item: Omit<ActivityItem, 'id'>): State {
  return { ...state, activity: [...state.activity, { id: nextId('act', state.activity), ...item }] };
}

function updateSip(state: State, id: string, patch: Partial<Sip>): State {
  return { ...state, sips: state.sips.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

/** Records a SIP payment: units at this week's NAV, holding, instalment count, activity. */
export function postInstalment(state: State, sipId: string, date: ISODate, note?: string): State {
  const sip = state.sips.find((s) => s.id === sipId);
  if (!sip) return state;
  const { week, history } = state.market;
  const units = sip.amount / navAt(sip.fundId, week, history);
  let s: State = {
    ...state,
    holdings: applyBuy(state.holdings, { assetId: sip.fundId, kind: 'fund', units, amount: sip.amount, date, week }),
  };
  s = updateSip(s, sipId, { instalments: sip.instalments + 1 });
  return pushActivity(s, { at: date, week, kind: 'sip_instalment', assetId: sip.fundId, sipId, amount: sip.amount, units, note });
}

/**
 * Posts everything that happened in the week just advanced into: instalments
 * (skip consumed, pauses respected) and automatic resumes after `pausedUntil`.
 * Expects state.market.week to be the new week already.
 */
export function postWeek(state: State): State {
  const { week, startDate } = state.market;
  if (week < 1) return state;
  const from = simDate(startDate, week - 1);
  const to = simDate(startDate, week);
  let s = state;

  for (const { sipId, date } of dueInstalments(state.sips, from, to)) {
    const sip = s.sips.find((x) => x.id === sipId);
    if (!sip || sip.status === 'stopped') continue;
    if (sip.status === 'paused') {
      if (!sip.pausedUntil || date <= sip.pausedUntil) continue;
      s = updateSip(s, sipId, { status: 'active', pausedUntil: undefined });
      s = pushActivity(s, { at: date, week, kind: 'sip_resumed', assetId: sip.fundId, sipId, note: 'auto' });
    }
    const current = s.sips.find((x) => x.id === sipId)!;
    if (current.skipNext) {
      s = updateSip(s, sipId, { skipNext: false });
      s = pushActivity(s, { at: date, week, kind: 'sip_skipped', assetId: current.fundId, sipId, amount: current.amount });
      continue;
    }
    s = postInstalment(s, sipId, date);
  }

  // Pauses that end this week without an instalment date in between.
  for (const sip of s.sips) {
    if (sip.status !== 'paused' || !sip.pausedUntil || sip.pausedUntil >= to) continue;
    const resumeAt = addDays(sip.pausedUntil, 1) > from ? addDays(sip.pausedUntil, 1) : addDays(from, 1);
    s = updateSip(s, sip.id, { status: 'active', pausedUntil: undefined });
    s = pushActivity(s, { at: resumeAt, week, kind: 'sip_resumed', assetId: sip.fundId, sipId: sip.id, note: 'auto' });
  }
  return s;
}

/**
 * "Advance one week": appends the current scenario to history, posts the
 * week's SIP events and settles processing orders.
 */
export function advanceWeek(state: State): State {
  const market = {
    ...state.market,
    history: [...state.market.history, state.market.scenario],
    week: state.market.week + 1,
  };
  const s = postWeek({ ...state, market });
  return { ...s, orders: s.orders.map((o) => (o.status === 'processing' ? { ...o, status: 'done' as const } : o)) };
}

/** True once any money has gone in (fund or stock). */
export function hasInvested(state: Pick<State, 'activity'>): boolean {
  return state.activity.some((a) => a.kind === 'sip_instalment' || a.kind === 'one_time' || a.kind === 'buy');
}

/** Sum of monthly amounts for active SIPs. */
export function activeSipTotal(sips: Sip[]): number {
  return sips.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
}
