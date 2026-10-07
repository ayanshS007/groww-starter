// The single reducer behind the store (PLAN section 4 "Reducer actions").
// Pure: no React, no storage, no real clock. The simulated date comes from
// state.market; only `reset` and `loadPersona` take a real date.
import { getFund } from '../data/funds';
import { buildPersona } from '../data/personas';
import { getStock } from '../data/stocks';
import {
  advanceWeek,
  applyBuy,
  applyRedeem,
  nextId,
  postInstalment,
} from '../lib/activity';
import { addMonths, addYears } from '../lib/dates';
import { formatINR, ordinal } from '../lib/format';
import { currentNav, simToday } from '../lib/market';
import type { MilestoneId } from '../lib/milestones';
import { buildPlan, isCompleteCheckin } from '../lib/planner';
import { createInitialState } from './initialState';
import type {
  ActivityItem,
  AssetId,
  CheckinAnswers,
  FundId,
  Goal,
  InvestDraft,
  ISODate,
  KycProgress,
  NotifKind,
  Order,
  PersonaId,
  PickReason,
  Scenario,
  Sip,
  State,
  StopReason,
} from './types';

export type Action =
  | { type: 'signUp'; mobile: string; name: string }
  | { type: 'saveCheckinAnswer'; answers: Partial<CheckinAnswers> }
  | { type: 'completeCheckin' }
  | { type: 'setPlanSplit'; cushionPct: number }
  | { type: 'kycAdvance'; progress: Partial<KycProgress> }
  | { type: 'kycComplete' }
  | { type: 'startInvestDraft'; draft: Omit<InvestDraft, 'startedAt'> }
  | { type: 'updateInvestDraft'; patch: Partial<InvestDraft> }
  | { type: 'clearInvestDraft' }
  | { type: 'placeInvestOrder' }
  | { type: 'withdraw'; holdingId: string; amount?: number; units?: number; all?: boolean }
  | { type: 'skipNext'; sipId: string }
  | { type: 'undoSkip'; sipId: string }
  | { type: 'pauseSip'; sipId: string; months: 1 | 2 | 3 }
  | { type: 'resumeSip'; sipId: string }
  | { type: 'editSip'; sipId: string; amount?: number; dayOfMonth?: number }
  | { type: 'toggleStepUp'; sipId: string }
  | { type: 'stopSip'; sipId: string; reason: StopReason }
  | { type: 'toggleWatchlist'; assetId: AssetId }
  | { type: 'setScenario'; scenario: Scenario }
  | { type: 'advanceWeek' }
  | { type: 'createGoal'; name: string; target: number; byDate: ISODate; isCushion?: boolean; sipIds?: string[] }
  | { type: 'updateGoal'; goalId: string; patch: Partial<Pick<Goal, 'name' | 'target' | 'byDate'>> }
  | { type: 'deleteGoal'; goalId: string }
  | { type: 'linkSipToGoal'; sipId: string; goalId: string | null }
  | {
      type: 'buyStock';
      stockId: string;
      shares: number;
      orderType: 'market' | 'limit';
      limitPrice?: number;
      pickReason?: PickReason;
    }
  | { type: 'setStockBudget'; pct: number }
  | { type: 'passReadiness'; passed: boolean }
  | { type: 'setView'; view: 'starter' | 'pro' }
  | { type: 'setNotifPref'; kind: NotifKind; on: boolean }
  | { type: 'markNotificationsRead'; ids: string[] }
  | { type: 'seeMilestone'; id: MilestoneId }
  | { type: 'setPayday'; day: number }
  | { type: 'loadPersona'; persona: PersonaId; today: ISODate }
  | { type: 'reset'; today: ISODate };

// ---------- helpers ----------
const clampDay = (d: number) => Math.min(28, Math.max(1, Math.round(d)));

function pushActivity(state: State, item: Omit<ActivityItem, 'id'>): State {
  return { ...state, activity: [...state.activity, { id: nextId('act', state.activity), ...item }] };
}

function patchSip(state: State, sipId: string, patch: Partial<Sip>): State {
  return { ...state, sips: state.sips.map((s) => (s.id === sipId ? { ...s, ...patch } : s)) };
}

/** Creates a SIP and posts its first payment (instalment 1) at this week's NAV. */
function createSipWithFirstPayment(
  state: State,
  p: { fundId: FundId; amount: number; dayOfMonth: number; batchId?: string; pickReason?: PickReason },
): { state: State; orderId: string } {
  const today = simToday(state.market);
  const week = state.market.week;
  const sip: Sip = {
    id: nextId('sip', state.sips),
    fundId: p.fundId,
    amount: p.amount,
    dayOfMonth: clampDay(p.dayOfMonth),
    status: 'active',
    skipNext: false,
    instalments: 0,
    createdAt: today,
    createdWeek: week,
  };
  if (p.batchId) sip.batchId = p.batchId;
  let s: State = { ...state, sips: [...state.sips, sip] };
  s = postInstalment(s, sip.id, today, 'first');
  const units = s.activity[s.activity.length - 1].units;
  const order: Order = {
    id: nextId('ord', s.orders),
    kind: 'fund',
    assetId: p.fundId,
    amount: p.amount,
    units,
    type: 'sip_first',
    status: 'processing',
    week,
    createdAt: today,
  };
  if (p.batchId) order.batchId = p.batchId;
  if (p.pickReason) order.pickReason = p.pickReason;
  return { state: { ...s, orders: [...s.orders, order] }, orderId: order.id };
}

function placeInvestOrder(state: State): State {
  const d = state.investDraft;
  if (!d) return state;
  const today = simToday(state.market);
  const week = state.market.week;
  let s = state;

  if (d.mode === 'plan') {
    const parts = (d.planAmounts ?? []).filter((p) => p.amount >= (getFund(p.fundId)?.minSip ?? Infinity));
    if (parts.length === 0) return state;
    const batchIds = state.orders.filter((o) => o.batchId).map((o) => ({ id: o.batchId! }));
    const batchId = nextId('batch', batchIds);
    for (const p of parts) {
      s = createSipWithFirstPayment(s, {
        fundId: p.fundId,
        amount: p.amount,
        dayOfMonth: d.dayOfMonth ?? 10,
        batchId,
        pickReason: 'plan',
      }).state;
    }
    s = { ...s, user: { ...s.user, autopay: true } };
  } else {
    const fund = d.fundId ? getFund(d.fundId) : undefined;
    const amount = d.amount ?? 0;
    if (!fund) return state;
    if (d.type === 'sip') {
      if (amount < fund.minSip) return state;
      s = createSipWithFirstPayment(s, {
        fundId: fund.id,
        amount,
        dayOfMonth: d.dayOfMonth ?? 10,
        pickReason: d.pickReason,
      }).state;
      s = { ...s, user: { ...s.user, autopay: true } };
    } else {
      if (amount < fund.minOneTime) return state;
      const units = amount / currentNav(fund.id, s.market);
      s = { ...s, holdings: applyBuy(s.holdings, { assetId: fund.id, kind: 'fund', units, amount, date: today, week }) };
      s = pushActivity(s, { at: today, week, kind: 'one_time', assetId: fund.id, amount, units });
      const order: Order = {
        id: nextId('ord', s.orders),
        kind: 'fund',
        assetId: fund.id,
        amount,
        units,
        type: 'one_time',
        status: 'processing',
        week,
        createdAt: today,
      };
      if (d.pickReason) order.pickReason = d.pickReason;
      s = { ...s, orders: [...s.orders, order] };
    }
  }
  s = { ...s, investDraft: undefined };
  // No automatic market week after a first investment (QA #15, owner decision).
  return s;
}

/** Id of the order the next placeInvestOrder will create (for the Success route). */
export function nextOrderId(state: State): string {
  return nextId('ord', state.orders);
}

function withdraw(state: State, a: Extract<Action, { type: 'withdraw' }>): State {
  const h = state.holdings.find((x) => x.id === a.holdingId);
  if (!h) return state;
  const nav = currentNav(h.assetId, state.market);
  if (nav <= 0) return state;
  let units = a.all ? h.units : a.units ?? (a.amount ?? 0) / nav;
  if (h.kind === 'stock') units = Math.floor(units);
  units = Math.min(units, h.units);
  if (!(units > 0)) return state;
  const amount = units * nav;
  const today = simToday(state.market);
  const week = state.market.week;
  let s: State = { ...state, holdings: applyRedeem(state.holdings, h.id, units) };
  s = {
    ...s,
    orders: [
      ...s.orders,
      { id: nextId('ord', s.orders), kind: h.kind, assetId: h.assetId, amount, units, type: 'redeem', status: 'processing', week, createdAt: today },
    ],
  };
  return pushActivity(s, { at: today, week, kind: 'redeem', assetId: h.assetId, amount, units });
}

function buyStock(state: State, a: Extract<Action, { type: 'buyStock' }>): State {
  const stock = getStock(a.stockId);
  const shares = Math.floor(a.shares);
  if (!stock || shares < 1) return state;
  const price = a.orderType === 'limit' && a.limitPrice && a.limitPrice > 0 ? a.limitPrice : currentNav(stock.id, state.market);
  const amount = shares * price;
  const today = simToday(state.market);
  const week = state.market.week;
  let s: State = {
    ...state,
    holdings: applyBuy(state.holdings, { assetId: stock.id, kind: 'stock', units: shares, amount, date: today, week }),
  };
  const order: Order = {
    id: nextId('ord', s.orders),
    kind: 'stock',
    assetId: stock.id,
    amount,
    units: shares,
    type: 'buy',
    orderType: a.orderType,
    status: 'done',
    week,
    createdAt: today,
  };
  if (a.orderType === 'limit') order.limitPrice = price;
  if (a.pickReason) order.pickReason = a.pickReason;
  s = { ...s, orders: [...s.orders, order] };
  s = pushActivity(s, { at: today, week, kind: 'buy', assetId: stock.id, amount, units: shares });
  // No automatic market week after a first investment (QA #15, owner decision).
  return s;
}

function linkSipToGoal(state: State, sipId: string, goalId: string | null): State {
  const sip = state.sips.find((s) => s.id === sipId);
  if (!sip) return state;
  if (goalId && !state.goals.some((g) => g.id === goalId)) return state;
  // A fund can back only one goal: unlink every SIP in this fund from other goals.
  const sameFund = new Set(state.sips.filter((s) => s.fundId === sip.fundId).map((s) => s.id));
  const goals = state.goals.map((g) => {
    const kept = g.sipIds.filter((id) => !(sameFund.has(id) && g.id !== goalId) && id !== sipId);
    return g.id === goalId ? { ...g, sipIds: [...kept, sipId] } : { ...g, sipIds: kept };
  });
  const sips = state.sips.map((s) => {
    if (s.id === sipId) return goalId ? { ...s, goalId } : { ...s, goalId: undefined };
    if (sameFund.has(s.id) && s.goalId && s.goalId !== goalId) return { ...s, goalId: undefined };
    return s;
  });
  return { ...state, goals, sips };
}

// ---------- reducer ----------
export function reducer(state: State, action: Action): State {
  const today = simToday(state.market);
  const week = state.market.week;

  switch (action.type) {
    case 'signUp':
      return { ...state, user: { ...state.user, signedUp: true, mobile: action.mobile, name: action.name.trim() } };

    case 'saveCheckinAnswer':
      return { ...state, checkinDraft: { ...state.checkinDraft, ...action.answers } };

    case 'completeCheckin': {
      const d = state.checkinDraft;
      if (!isCompleteCheckin(d)) return state;
      return { ...state, checkin: { ...d }, plan: buildPlan(d, today) };
    }

    case 'setPlanSplit':
      if (!state.checkin) return state;
      return { ...state, plan: buildPlan(state.checkin, state.plan?.createdAt ?? today, action.cushionPct) };

    case 'kycAdvance': {
      const prev: KycProgress = state.kycProgress ?? { step: 1, panOk: false, aadhaarOk: false, selfieOk: false };
      return {
        ...state,
        user: { ...state.user, kyc: state.user.kyc === 'done' ? 'done' : 'in_progress' },
        kycProgress: { ...prev, ...action.progress },
      };
    }

    case 'kycComplete':
      return { ...state, user: { ...state.user, kyc: 'done', bankLinked: true }, kycProgress: undefined };

    case 'startInvestDraft':
      return { ...state, investDraft: { ...action.draft, startedAt: today } };

    case 'updateInvestDraft':
      return state.investDraft ? { ...state, investDraft: { ...state.investDraft, ...action.patch } } : state;

    case 'clearInvestDraft':
      return { ...state, investDraft: undefined };

    case 'placeInvestOrder':
      return placeInvestOrder(state);

    case 'withdraw':
      return withdraw(state, action);

    case 'skipNext': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status !== 'active') return state;
      return patchSip(state, sip.id, { skipNext: true });
    }

    case 'undoSkip':
      return patchSip(state, action.sipId, { skipNext: false });

    case 'pauseSip': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status === 'stopped') return state;
      const s = patchSip(state, sip.id, { status: 'paused', pausedUntil: addMonths(today, action.months) });
      return pushActivity(s, {
        at: today,
        week,
        kind: 'sip_paused',
        assetId: sip.fundId,
        sipId: sip.id,
        note: `${action.months} month${action.months > 1 ? 's' : ''}`,
      });
    }

    case 'resumeSip': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status !== 'paused') return state;
      const s = patchSip(state, sip.id, { status: 'active', pausedUntil: undefined });
      return pushActivity(s, { at: today, week, kind: 'sip_resumed', assetId: sip.fundId, sipId: sip.id });
    }

    case 'editSip': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status === 'stopped') return state;
      const fund = getFund(sip.fundId);
      const patch: Partial<Sip> = {};
      const notes: string[] = [];
      if (action.amount !== undefined && action.amount !== sip.amount) {
        if (!Number.isInteger(action.amount) || action.amount < (fund?.minSip ?? 100) || action.amount > 100_000) return state;
        patch.amount = action.amount;
        notes.push(`Amount ${formatINR(sip.amount)} → ${formatINR(action.amount)}`);
      }
      if (action.dayOfMonth !== undefined && clampDay(action.dayOfMonth) !== sip.dayOfMonth) {
        patch.dayOfMonth = clampDay(action.dayOfMonth);
        notes.push(`Date ${ordinal(sip.dayOfMonth)} → ${ordinal(patch.dayOfMonth)}`);
      }
      if (notes.length === 0) return state;
      return pushActivity(patchSip(state, sip.id, patch), {
        at: today,
        week,
        kind: 'sip_edited',
        assetId: sip.fundId,
        sipId: sip.id,
        note: notes.join('; '),
      });
    }

    case 'toggleStepUp': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status === 'stopped') return state;
      if (sip.stepUpPct) return patchSip(state, sip.id, { stepUpPct: undefined, nextStepUpDate: undefined });
      let next = addYears(sip.createdAt, 1);
      while (next <= today) next = addYears(next, 1);
      return patchSip(state, sip.id, { stepUpPct: 10, nextStepUpDate: next });
    }

    case 'stopSip': {
      const sip = state.sips.find((s) => s.id === action.sipId);
      if (!sip || sip.status === 'stopped') return state;
      const s = patchSip(state, sip.id, {
        status: 'stopped',
        stopReason: action.reason,
        stoppedAt: today,
        skipNext: false,
        pausedUntil: undefined,
      });
      return pushActivity(s, { at: today, week, kind: 'sip_stopped', assetId: sip.fundId, sipId: sip.id, note: action.reason });
    }

    case 'toggleWatchlist':
      return {
        ...state,
        watchlist: state.watchlist.includes(action.assetId)
          ? state.watchlist.filter((id) => id !== action.assetId)
          : [...state.watchlist, action.assetId],
      };

    case 'setScenario':
      return { ...state, market: { ...state.market, scenario: action.scenario } };

    case 'advanceWeek':
      return advanceWeek(state);

    case 'createGoal': {
      if (!action.name.trim() || !(action.target > 0)) return state;
      const goal: Goal = {
        id: nextId('goal', state.goals),
        name: action.name.trim(),
        target: Math.round(action.target),
        byDate: action.byDate,
        sipIds: [],
        isCushion: action.isCushion ?? false,
        createdAt: today,
      };
      let s: State = { ...state, goals: [...state.goals, goal] };
      s = pushActivity(s, { at: today, week, kind: 'goal_created', note: goal.name });
      for (const sipId of action.sipIds ?? []) s = linkSipToGoal(s, sipId, goal.id);
      return s;
    }

    case 'updateGoal':
      return { ...state, goals: state.goals.map((g) => (g.id === action.goalId ? { ...g, ...action.patch } : g)) };

    case 'deleteGoal':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.goalId),
        sips: state.sips.map((s) => (s.goalId === action.goalId ? { ...s, goalId: undefined } : s)),
      };

    case 'linkSipToGoal':
      return linkSipToGoal(state, action.sipId, action.goalId);

    case 'buyStock':
      return buyStock(state, action);

    case 'setStockBudget':
      return { ...state, prefs: { ...state.prefs, stockBudgetPct: Math.min(100, Math.max(1, Math.round(action.pct))) } };

    case 'passReadiness':
      return { ...state, prefs: { ...state.prefs, readinessPassed: state.prefs.readinessPassed || action.passed } };

    case 'setView':
      return { ...state, prefs: { ...state.prefs, view: action.view } };

    case 'setNotifPref':
      return { ...state, prefs: { ...state.prefs, notif: { ...state.prefs.notif, [action.kind]: action.on } } };

    case 'markNotificationsRead':
      return { ...state, readNotifications: [...new Set([...state.readNotifications, ...action.ids])] };

    case 'seeMilestone':
      return state.seenMilestones.includes(action.id) ? state : { ...state, seenMilestones: [...state.seenMilestones, action.id] };

    case 'setPayday':
      return { ...state, user: { ...state.user, payday: clampDay(action.day) } };

    case 'loadPersona':
      return buildPersona(action.persona, action.today);

    case 'reset':
      return createInitialState(action.today);
  }
}
