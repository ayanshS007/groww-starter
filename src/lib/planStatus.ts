// Which parts of the starter plan already have a running SIP. Shared by the
// Next-step card, the /invest/plan guard and the plan flow.
import type { FundId, PlanBucket, Sip, State } from '../state/types';
import { formatINR } from './format';

/** True when a non-stopped SIP exists in this fund. */
export function hasLiveSip(sips: Sip[], fundId: FundId): boolean {
  return sips.some((s) => s.fundId === fundId && s.status !== 'stopped');
}

/** Plan buckets that still need a SIP, in plan order. */
export function missingBuckets(state: Pick<State, 'plan' | 'sips'>): PlanBucket[] {
  return (state.plan?.buckets ?? []).filter((b) => !hasLiveSip(state.sips, b.fundId));
}

/**
 * At least one SIP from the plan is active. Home offers "Got paid? Split it"
 * only from then on, so it doesn't compete with starting the plan (QA #19).
 */
export function hasRunningPlanSip(state: Pick<State, 'plan' | 'sips'>): boolean {
  const ids = new Set((state.plan?.buckets ?? []).map((b) => b.fundId));
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
