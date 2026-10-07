// Which parts of the starter plan already have a running SIP. Shared by the
// Next-step card, the /invest/plan guard and the plan flow.
import type { FundId, PlanBucket, Sip, State } from '../state/types';

/** True when a non-stopped SIP exists in this fund. */
export function hasLiveSip(sips: Sip[], fundId: FundId): boolean {
  return sips.some((s) => s.fundId === fundId && s.status !== 'stopped');
}

/** Plan buckets that still need a SIP, in plan order. */
export function missingBuckets(state: Pick<State, 'plan' | 'sips'>): PlanBucket[] {
  return (state.plan?.buckets ?? []).filter((b) => !hasLiveSip(state.sips, b.fundId));
}
