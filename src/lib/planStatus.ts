// Which parts of the starter plan already have a running SIP. Shared by the
// Next-step card, the /invest/plan guard and the plan flow.
import { fundsInPlanCategory } from '../data/funds';
import type { FundId, PlanBucket, Sip, StarterPlan, State } from '../state/types';
import { formatINR } from './format';

/** True when a non-stopped SIP exists in this fund. */
export function hasLiveSip(sips: Sip[], fundId: FundId): boolean {
  return sips.some((s) => s.fundId === fundId && s.status !== 'stopped');
}

/** True when a running SIP exists in any fund of this plan part's category. */
export function bucketHasLiveSip(sips: Sip[], bucket: PlanBucket): boolean {
  return bucket.candidateFundIds.some((id) => hasLiveSip(sips, id));
}

/**
 * The fund a plan part points to: the user's own pick, else the fund in the category they
 * run a SIP in (or last ran one in). Undefined until they pick (Stage 7a: the plan never chooses).
 */
export function bucketFundId(sips: Sip[], bucket: PlanBucket): FundId | undefined {
  if (bucket.fundId) return bucket.fundId;
  const live = bucket.candidateFundIds.find((id) => hasLiveSip(sips, id));
  if (live) return live;
  return [...sips].reverse().find((s) => bucket.candidateFundIds.includes(s.fundId))?.fundId;
}

/**
 * The liquid fund a cushion top-up goes to: the one the user picked, else one they run a
 * SIP in, else one they already hold. Undefined until they have a fund of their own there.
 */
export function cushionFundId(state: Pick<State, 'plan' | 'sips' | 'holdings'>): FundId | undefined {
  const bucket = state.plan?.buckets.find((b) => b.role === 'cushion');
  const own = bucket ? bucketFundId(state.sips, bucket) : undefined;
  if (own) return own;
  return fundsInPlanCategory('liquid').find((f) => state.holdings.some((h) => h.assetId === f.id && h.units > 0))?.id;
}

/** The plan part whose category lists this fund, if any. */
export function bucketForFund(plan: Pick<StarterPlan, 'buckets'> | undefined, fundId: FundId): PlanBucket | undefined {
  return plan?.buckets.find((b) => b.candidateFundIds.includes(fundId));
}

/** Plan buckets that still need a SIP, in plan order. */
export function missingBuckets(state: Pick<State, 'plan' | 'sips'>): PlanBucket[] {
  return (state.plan?.buckets ?? []).filter((b) => !bucketHasLiveSip(state.sips, b));
}

/** Parts that still need a SIP and have no fund picked yet. */
export function unpickedBuckets(state: Pick<State, 'plan' | 'sips'>): PlanBucket[] {
  return missingBuckets(state).filter((b) => !bucketFundId(state.sips, b));
}

/** Route that starts a SIP for one part: the picked fund's flow, else the plan flow (which asks for a pick). */
export function bucketInvestPath(sips: Sip[], bucket: PlanBucket): string {
  const id = bucketFundId(sips, bucket);
  return id ? `/invest/${id}?amount=${bucket.amount}` : '/invest/plan';
}

/**
 * At least one SIP from the plan is active. Home offers "Got paid? Split it"
 * only from then on, so it doesn't compete with starting the plan (QA #19).
 */
export function hasRunningPlanSip(state: Pick<State, 'plan' | 'sips'>): boolean {
  const ids = new Set((state.plan?.buckets ?? []).flatMap((b) => b.candidateFundIds));
  return state.sips.some((s) => s.status === 'active' && ids.has(s.fundId));
}

export type PlanAction = { title: string; body: string; cta: string; to: string };

/**
 * The Starter plan screen's call to action, matching what is already running
 * (QA #8): nothing yet → start it; some parts → set up the rest; all → see SIPs.
 */
export function planAction(state: Pick<State, 'plan' | 'sips'>): PlanAction | null {
  const plan = state.plan;
  if (!plan) return null;
  const n = plan.buckets.length;
  const missing = missingBuckets(state);
  const sips = n === 1 ? 'One SIP' : `${n} SIPs`;
  if (missing.length === n) {
    return { title: 'Ready when you are', body: `${sips}, ${formatINR(plan.monthly)} a month, one autopay. Change or skip later.`, cta: 'Start this plan', to: '/invest/plan' };
  }
  if (missing.length > 0) {
    const rest = missing.reduce((sum, b) => sum + b.amount, 0);
    return {
      title: 'Finish your plan',
      body: `${n - missing.length} of ${n} SIPs already running. This sets up the rest: ${formatINR(rest)} a month.`,
      cta: 'Set up the rest',
      to: '/invest/plan',
    };
  }
  return { title: 'Your plan is running', body: `${n === 1 ? 'Your SIP is' : `All ${n} SIPs are`} set up. Change or skip any of them from Portfolio.`, cta: 'See my SIPs', to: '/portfolio' };
}
