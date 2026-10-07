// Invest flow logic (README 9 item 9, PLAN items 19–20, 24, 27, 32). Pure: the
// screens hold the copy that needs Terms; everything that decides lives here.
import { getFund } from '../data/funds';
import type { Fund, FundId, InvestDraft, InvestStep, ISODate, Order, PlanBucket, Sip, State } from '../state/types';
import { firstAutoDate, nextDueDate } from './activity';
import { addDays } from './dates';
import { dateLabel, formatINR, ordinal } from './format';
import { simToday } from './market';
import { comfortCeiling, defaultSipDay } from './planner';
import { missingBuckets } from './planStatus';
import { assetName } from './portfolio';

export const MAX_INVEST = 100_000;

export type InvestType = 'sip' | 'one_time';
export type AmountCheck = { ok: true; value: number } | { ok: false; error: string };

/** Smallest amount this fund accepts for the given investment type. */
export function minFor(fund: Fund, type: InvestType): number {
  return type === 'sip' ? fund.minSip : fund.minOneTime;
}

export function validateInvestAmount(input: string | number, p: { min: number; type: InvestType }): AmountCheck {
  const raw = typeof input === 'string' ? input.replace(/[₹,\s]/g, '') : input;
  if (raw === '' || raw === null || raw === undefined) return { ok: false, error: 'Enter an amount.' };
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: 'Enter an amount in rupees.' };
  if (!Number.isInteger(n)) return { ok: false, error: 'Use whole rupees.' };
  if (n < p.min) {
    const what = p.type === 'sip' ? 'a SIP' : 'a one-time investment';
    return { ok: false, error: `The minimum for ${what} in this fund is ${formatINR(p.min)}.` };
  }
  if (n > MAX_INVEST) return { ok: false, error: `The maximum here is ${formatINR(MAX_INVEST)}.` };
  return { ok: true, value: n };
}

export type Preset = { value: number; fromPlan: boolean };

/** PLAN item 27: the plan's amount for this fund, then ₹100, ₹500, ₹1,000 (at or above the minimum). */
export function amountPresets(min: number, planAmount?: number): Preset[] {
  const map = new Map<number, boolean>();
  if (planAmount && planAmount >= min) map.set(planAmount, true);
  for (const v of [100, 500, 1000]) if (v >= min && !map.has(v)) map.set(v, false);
  return [...map].map(([value, fromPlan]) => ({ value, fromPlan })).sort((a, b) => a.value - b.value);
}

/** The plan bucket for this fund, if the fund is in the plan. */
export function planBucketFor(state: Pick<State, 'plan'>, fundId: FundId): PlanBucket | undefined {
  return state.plan?.buckets.find((b) => b.fundId === fundId);
}

/**
 * Soft note (never blocks): all monthly SIPs, including this one, against the
 * comfort ceiling for the user's income band. `except` leaves out funds that
 * this order is about to replace or add.
 */
export function ceilingNote(state: Pick<State, 'checkin' | 'sips'>, add: number, except: FundId[] = []): string | undefined {
  if (!state.checkin) return undefined;
  const ceiling = comfortCeiling(state.checkin.incomeBand);
  const existing = state.sips
    .filter((s) => s.status !== 'stopped' && !except.includes(s.fundId))
    .reduce((sum, s) => sum + s.amount, 0);
  const total = existing + add;
  if (total <= ceiling) return undefined;
  return `With this, your monthly SIPs add up to ${formatINR(total)}. That is above the ${formatINR(ceiling)} that usually feels easy at your income. It’s a note, not a rule.`;
}

/**
 * One plain line when a SIP amount the app suggests (a goal's "Increase SIP to
 * ₹X") would take monthly SIPs over the comfort ceiling (QA #18). Never blocks.
 * `sipId` is the SIP being raised, so its old amount isn't counted twice.
 */
export function suggestedOverCeiling(state: Pick<State, 'checkin' | 'sips'>, sipId: string, newAmount: number): string | undefined {
  if (!state.checkin) return undefined;
  const ceiling = comfortCeiling(state.checkin.incomeBand);
  const others = state.sips.filter((s) => s.status !== 'stopped' && s.id !== sipId).reduce((sum, s) => sum + s.amount, 0);
  if (others + newAmount <= ceiling) return undefined;
  return `That’s more than the ${formatINR(ceiling)} a month that usually feels easy at your income. Your call.`;
}

/** README 8.2: salary → payday + 3 (default payday 1st); anything else → the 10th. */
export function suggestedDay(state: Pick<State, 'checkin' | 'user'>): number {
  return defaultSipDay(state.checkin?.incomeType ?? 'none', state.user.payday ?? 1);
}

export function isSalary(state: Pick<State, 'checkin'>): boolean {
  return state.checkin?.incomeType === 'salary';
}

/** Date of the first automatic debit if the SIP is created today on `day`. */
export function firstAutoDebit(today: ISODate, day: number): ISODate {
  return firstAutoDate({ createdAt: today, dayOfMonth: day });
}

// ---------- drafts ----------
export type NewDraft = Omit<InvestDraft, 'startedAt'>;

export function singleDraft(fundId: FundId, opts: { type?: InvestType; amount?: number } = {}): NewDraft {
  const d: NewDraft = { mode: 'single', fundId, type: opts.type ?? 'sip', step: 'amount', riskAck: false };
  if (opts.amount !== undefined) d.amount = opts.amount;
  return d;
}

/** The parts of the plan that still need a SIP (a part with a running SIP is left out). */
export function planParts(state: Pick<State, 'plan' | 'sips'>): { fundId: FundId; amount: number; role: PlanBucket['role'] }[] {
  return missingBuckets(state).map((b) => ({ fundId: b.fundId, amount: b.amount, role: b.role }));
}

export function planDraft(state: Pick<State, 'plan' | 'sips'>): NewDraft {
  return { mode: 'plan', type: 'sip', planAmounts: planParts(state), step: 'date', riskAck: false };
}

/** True when the draft's plan amounts still match the current plan. */
export function planPartsMatch(draft: Pick<InvestDraft, 'planAmounts'>, state: Pick<State, 'plan' | 'sips'>): boolean {
  return JSON.stringify(draft.planAmounts ?? []) === JSON.stringify(planParts(state));
}

// ---------- steps ----------
export function stepsFor(d: Pick<InvestDraft, 'mode' | 'type'>, autopay: boolean): InvestStep[] {
  const mandate: InvestStep[] = autopay ? [] : ['mandate'];
  if (d.mode === 'plan') return ['date', 'review', 'pay', ...mandate];
  if (d.type === 'one_time') return ['amount', 'review', 'pay'];
  return ['amount', 'date', 'review', 'pay', ...mandate];
}

export type StepContext = { autopay: boolean; kycDone: boolean };

/**
 * The step to show. A saved draft can be ahead of what is allowed now:
 * payment steps need KYC (so leaving KYC lands back on review), and a single
 * fund needs an amount before anything after it.
 */
export function resolveStep(d: InvestDraft, ctx: StepContext): InvestStep {
  const steps = stepsFor(d, ctx.autopay);
  let step: InvestStep = d.step;
  if (!steps.includes(step) && step !== 'processing') {
    if (step === 'type') step = steps[0];
    else if (step === 'amount') step = steps[0]; // plan mode has no amount step
    else if (step === 'date') step = 'review'; // one-time has no date step
    else step = 'pay'; // mandate when autopay already exists
  }
  if (d.mode === 'single' && !d.amount && step !== 'amount') step = 'amount';
  if (d.mode === 'plan' && !(d.planAmounts && d.planAmounts.length > 0)) step = 'date';
  if (d.mode === 'single' && step === 'date' && d.type === 'one_time') step = 'review';
  if ((step === 'pay' || step === 'mandate' || step === 'processing') && !ctx.kycDone) step = 'review';
  return step;
}

export function stepProgress(d: InvestDraft, ctx: StepContext): { n: number; of: number } {
  const steps = stepsFor(d, ctx.autopay);
  const i = steps.indexOf(resolveStep(d, ctx));
  return { n: i < 0 ? steps.length : i + 1, of: steps.length };
}

/** Step after the current one; 'processing' after the last. */
export function stepAfter(d: InvestDraft, ctx: StepContext): InvestStep {
  const steps = stepsFor(d, ctx.autopay);
  const i = steps.indexOf(resolveStep(d, ctx));
  return steps[i + 1] ?? 'processing';
}

/** Step before the current one, or null on the first step. */
export function stepBefore(d: InvestDraft, ctx: StepContext): InvestStep | null {
  const steps = stepsFor(d, ctx.autopay);
  const i = steps.indexOf(resolveStep(d, ctx));
  return i > 0 ? steps[i - 1] : null;
}

// ---------- review ----------
export type ReviewRow = { fundId: FundId; amount: number; role?: PlanBucket['role'] };

export function reviewRows(d: InvestDraft): ReviewRow[] {
  if (d.mode === 'plan') return (d.planAmounts ?? []).map((p) => ({ fundId: p.fundId, amount: p.amount, role: p.role }));
  return d.fundId && d.amount ? [{ fundId: d.fundId, amount: d.amount }] : [];
}

/** What leaves the account today: the first payment of each SIP, or the one-time amount. */
export function payToday(d: InvestDraft): number {
  return reviewRows(d).reduce((sum, r) => sum + r.amount, 0);
}

export function isMonthly(d: Pick<InvestDraft, 'type'>): boolean {
  return d.type === 'sip';
}

/** "10th of every month" style schedule line. */
export function scheduleLine(day: number): string {
  return `${ordinal(day)} of every month`;
}

// ---------- UPI ----------
export const UPI_TILES: { value: 'app1' | 'app2' | 'app3' | 'upi_id'; label: string }[] = [
  { value: 'app1', label: 'UPI app 1' },
  { value: 'app2', label: 'UPI app 2' },
  { value: 'app3', label: 'UPI app 3' },
  { value: 'upi_id', label: 'Enter UPI ID' },
];

export function checkUpiId(input: string): { ok: true } | { ok: false; error: string } {
  const v = input.trim();
  if (!v) return { ok: false, error: 'Enter your UPI ID.' };
  if (!/^[\w.-]{2,}@[a-zA-Z][\w.-]*$/.test(v)) return { ok: false, error: 'A UPI ID looks like name@bank.' };
  return { ok: true };
}

// ---------- success ----------
export type SuccessKind = 'plan' | 'first_sip' | 'sip' | 'one_time' | 'buy' | 'redeem';

export type SuccessRow = { fundId: string; name: string; amount: number; role?: PlanBucket['role']; day?: number; units?: number };

export type SuccessInfo = {
  kind: SuccessKind;
  headline: string;
  rows: SuccessRow[];
  steps: [string, string, string];
  processing: boolean;
  /** Single-fund SIP/one-time order (not a plan batch). */
  single: boolean;
};

function latestSipFor(sips: Sip[], fundId: string): Sip | undefined {
  const mine = sips.filter((s) => s.fundId === fundId);
  return mine[mine.length - 1];
}

/** Everything the Success screen shows, from the order (and its batch). */
export function successInfo(state: State, orderId: string): SuccessInfo | null {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const group: Order[] = order.batchId ? state.orders.filter((o) => o.batchId === order.batchId) : [order];
  const total = group.reduce((sum, o) => sum + o.amount, 0);
  const today = simToday(state.market);
  const bucketRole = (id: string) => state.plan?.buckets.find((b) => b.fundId === id)?.role;
  const name = (id: string) => getFund(id)?.name ?? 'Your fund';

  if (order.type === 'sip_first') {
    const sips = group.map((o) => latestSipFor(state.sips, o.assetId)).filter((s): s is Sip => !!s);
    const groupIds = new Set(sips.map((s) => s.id));
    const isFirstEver = state.sips.every((s) => groupIds.has(s.id));
    const rows: SuccessRow[] = group.map((o) => {
      const sip = latestSipFor(state.sips, o.assetId);
      return { fundId: o.assetId, name: name(o.assetId), amount: o.amount, role: order.batchId ? bucketRole(o.assetId) : undefined, day: sip?.dayOfMonth };
    });
    const dates = sips.map((s) => nextDueDate(s, addDays(today, 1))).sort();
    const next = dates[0];
    const plural = group.length > 1;
    const kind: SuccessKind = plural ? 'plan' : isFirstEver ? 'first_sip' : 'sip';
    const headline = plural
      ? `Your plan is set. ${group.length} SIPs, ${formatINR(total)} a month.`
      : isFirstEver
        ? 'Your first SIP is set.'
        : 'Your SIP is set.';
    return {
      kind,
      headline,
      rows,
      steps: [
        `Today’s payment of ${formatINR(total)} is processing. Units arrive in 1–2 working days.`,
        next
          ? `Your next payment is on ${dateLabel(next, { short: true })}, then on the same day each month.`
          : 'Your next payment follows on your SIP date each month.',
        'Skip a month, pause or stop from Portfolio any time. Skipping is free.',
      ],
      processing: order.status === 'processing',
      single: !order.batchId,
    };
  }

  if (order.type === 'one_time') {
    const fund = getFund(order.assetId);
    return {
      kind: 'one_time',
      headline: `${formatINR(total)} invested.`,
      rows: [{ fundId: order.assetId, name: name(order.assetId), amount: order.amount }],
      steps: fund?.whatHappensNext ?? [
        'Your money buys units at the next price.',
        'Units arrive in your portfolio in 1–2 working days.',
        'Withdraw any time.',
      ],
      processing: order.status === 'processing',
      single: true,
    };
  }

  const isBuy = order.type === 'buy';
  return {
    kind: isBuy ? 'buy' : 'redeem',
    headline: isBuy ? 'Order placed (simulated).' : 'Withdrawal placed (simulated).',
    rows: [{ fundId: order.assetId, name: assetName(order.assetId), amount: order.amount, units: order.units }],
    steps: isBuy
      ? ['Your order is filled at the sample price (simulated).', 'The shares show in your portfolio, held for delivery.', 'Buy more or sell any time from the holding.']
      : ['Your units are removed right away.', 'Money reaches your bank in 1–3 working days.', 'Nothing else changes.'],
    processing: order.status === 'processing',
    single: true,
  };
}
