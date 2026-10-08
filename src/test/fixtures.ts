// Shared builders for tests. Uses the real reducer so flows match the app.
import { hasInvested } from '../lib/activity';
import { withinCutoff } from '../lib/cutoff';
import { simToday } from '../lib/market';
import { upcomingSips } from '../lib/nextStep';
import { createInitialState } from '../state/initialState';
import { reducer, type Action } from '../state/reducer';
import type { CheckinAnswers, FundId, Holding, State } from '../state/types';

export const TODAY = '2026-10-07';

export const RIYA_ANSWERS: CheckinAnswers = {
  incomeType: 'salary',
  incomeBand: '25to50k',
  cushion: 'no',
  purpose: 'wealth',
  horizon: '5plus',
  dipReaction: 'wait',
  monthly: 4000,
  monthlyChoice: 'custom',
};

export function fresh(today = TODAY): State {
  return createInitialState(today);
}

export function run(state: State, ...actions: Action[]): State {
  return actions.reduce(reducer, state);
}

export function withCheckin(state: State, patch: Partial<CheckinAnswers> = {}): State {
  return run(
    state,
    { type: 'signUp', mobile: '9876543210', name: 'Test' },
    { type: 'saveCheckinAnswer', answers: { ...RIYA_ANSWERS, ...patch } },
    { type: 'completeCheckin' },
  );
}

/**
 * The plan names categories; the user picks the funds (Stage 7a). By default this picks the first
 * fund in each list, which is liquid1 for the cushion and index50 for Riya's grow part.
 */
export function withPicks(state: State, picks: Partial<Record<'cushion' | 'grow', FundId>> = {}): State {
  let s = state;
  for (const b of state.plan?.buckets ?? []) {
    s = run(s, { type: 'pickPlanFund', role: b.role, fundId: picks[b.role] ?? b.candidateFundIds[0] });
  }
  return s;
}

/**
 * The app used to apply one dip_small week straight after a first investment
 * (PLAN item 13). It no longer does (QA #15). Tests built on these helpers were
 * written around that week (dates, a settled order, a market move), so the
 * helpers apply it explicitly, as a reviewer pressing "Advance one week" would.
 */
function withFirstWeek(before: State, after: State): State {
  if (hasInvested(before)) return after;
  return advance(after, 1, 'dip_small');
}

export function startSip(state: State, fundId: FundId, amount: number, dayOfMonth = 10): State {
  return withFirstWeek(
    state,
    run(
      state,
      { type: 'startInvestDraft', draft: { mode: 'single', fundId, type: 'sip', amount, dayOfMonth, step: 'review', riskAck: true } },
      { type: 'placeInvestOrder' },
    ),
  );
}

export function oneTime(state: State, fundId: FundId, amount: number): State {
  return withFirstWeek(
    state,
    run(
      state,
      { type: 'startInvestDraft', draft: { mode: 'single', fundId, type: 'one_time', amount, step: 'review', riskAck: true } },
      { type: 'placeInvestOrder' },
    ),
  );
}

export function advance(state: State, weeks: number, scenario?: State['market']['scenario']): State {
  let s = scenario ? run(state, { type: 'setScenario', scenario }) : state;
  for (let i = 0; i < weeks; i++) s = run(s, { type: 'advanceWeek' });
  return s;
}

/** A holding at week 0 prices: units = value ÷ baseNav. */
export function holding(assetId: string, kind: Holding['kind'], units: number, invested = 0): Holding {
  return { id: `h_${assetId}`, kind, assetId, units, invested, createdAt: TODAY, createdWeek: 0 };
}

/**
 * A SIP three weeks old, so its next debit can be moved by changing the day of the month
 * (a new SIP's first automatic debit is always at least 15 days away).
 */
export function agedSip(): State {
  return advance(startSip(withCheckin(fresh()), 'index50', 2000, 20), 3, 'normal');
}

/** The same state with sip_1's day set so its next debit is inside (or outside) the 3-business-day cutoff. */
export function withNextDebit(state: State, inside: boolean): State {
  const today = simToday(state.market);
  for (let day = 1; day <= 28; day++) {
    const s = { ...state, sips: state.sips.map((x) => (x.id === 'sip_1' ? { ...x, dayOfMonth: day } : x)) };
    const u = upcomingSips(s).find((x) => x.sip.id === 'sip_1');
    if (u && withinCutoff(today, u.date) === inside) return s;
  }
  throw new Error('no such day');
}
