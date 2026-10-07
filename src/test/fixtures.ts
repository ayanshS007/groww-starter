// Shared builders for tests. Uses the real reducer so flows match the app.
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

export function startSip(state: State, fundId: FundId, amount: number, dayOfMonth = 10): State {
  return run(
    state,
    { type: 'startInvestDraft', draft: { mode: 'single', fundId, type: 'sip', amount, dayOfMonth, step: 'review', riskAck: true } },
    { type: 'placeInvestOrder' },
  );
}

export function oneTime(state: State, fundId: FundId, amount: number): State {
  return run(
    state,
    { type: 'startInvestDraft', draft: { mode: 'single', fundId, type: 'one_time', amount, step: 'review', riskAck: true } },
    { type: 'placeInvestOrder' },
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
