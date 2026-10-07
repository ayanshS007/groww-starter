// Demo personas for reviewers (README 7.4 as changed by PLAN C2 and C15).
// Each is built with the same lib functions the app uses, so its numbers are
// exactly what the app would compute. Seeded histories are deterministic: the
// simulated today equals the real `today` passed in.
import { nextId, postInstalment } from '../lib/activity';
import { addDays, addMonths, dayOfMonth } from '../lib/dates';
import { simDate } from '../lib/market';
import { buildPlan } from '../lib/planner';
import { createInitialState } from '../state/initialState';
import type { CheckinAnswers, FundId, ISODate, Order, PersonaId, Scenario, Sip, State } from '../state/types';

type SeedSip = { fundId: FundId; amount: number; buyWeeks: number[]; goal?: { name: string; target: number; monthsAhead: number } };

type PersonaSeed = {
  id: PersonaId;
  label: string;
  summary: string;
  name: string;
  mobile: string;
  kycDone: boolean;
  payday?: number;
  checkin: CheckinAnswers;
  history: Scenario[];
  /** Scenario applied on the next "Advance one week". */
  scenario: Scenario;
  sips: SeedSip[];
  watchlist?: string[];
};

export const PERSONA_SEEDS: PersonaSeed[] = [
  {
    id: 'riya',
    label: 'Riya, 22, first job',
    summary: 'Salary ₹25–50k, no cushion, 5+ yrs. Index SIP ₹2,000 after two sharp dips.',
    name: 'Riya',
    mobile: '9876543210',
    kycDone: true,
    payday: 1,
    checkin: {
      incomeType: 'salary',
      incomeBand: '25to50k',
      cushion: 'no',
      purpose: 'wealth',
      horizon: '5plus',
      dipReaction: 'wait',
      monthly: 4000,
      monthlyChoice: 'custom',
    },
    // Two dip_sharp weeks: week 6 (mid-history) and week 12 (latest, also the current scenario).
    // Tuned so the overall change is about −12% (PLAN item 16).
    history: ['normal', 'up', 'dip_small', 'normal', 'up', 'dip_sharp', 'flat', 'flat', 'dip_small', 'normal', 'flat', 'dip_sharp'],
    scenario: 'dip_sharp',
    sips: [{ fundId: 'index50', amount: 2000, buyWeeks: [1, 5, 9] }],
  },
  {
    id: 'kabir',
    label: 'Kabir, 21, student',
    summary: 'Stipend < ₹10k, no cushion, 1–3 yrs, would sell on a dip. Nothing invested yet.',
    name: 'Kabir',
    mobile: '9123456780',
    kycDone: false,
    checkin: {
      incomeType: 'stipend',
      incomeBand: 'lt10k',
      cushion: 'no',
      purpose: 'exploring',
      horizon: '1to3',
      dipReaction: 'sell',
      monthly: 500,
      monthlyChoice: 500,
    },
    history: ['normal', 'flat', 'up', 'dip_small', 'normal', 'normal', 'dip_small', 'flat'],
    scenario: 'normal',
    sips: [],
  },
  {
    id: 'meera',
    label: 'Meera, 23, part-timer',
    summary: 'Part-time ₹10–25k, saving for a laptop within a year. Liquid SIP ₹1,500.',
    name: 'Meera',
    mobile: '9988776655',
    kycDone: true,
    checkin: {
      incomeType: 'parttime',
      incomeBand: '10to25k',
      cushion: 'some',
      purpose: 'goal',
      horizon: 'lt1',
      dipReaction: 'wait',
      monthly: 1500,
      monthlyChoice: 'custom',
    },
    history: ['normal', 'normal', 'dip_small', 'flat', 'up', 'normal', 'dip_small', 'normal', 'flat', 'normal'],
    scenario: 'normal',
    sips: [{ fundId: 'liquid1', amount: 1500, buyWeeks: [2, 6], goal: { name: 'Laptop', target: 45000, monthsAhead: 10 } }],
  },
  {
    id: 'arjun',
    label: 'Arjun, 24, curious about stocks',
    summary: 'Salary ₹50k+, cushion in place, 5+ yrs. Index SIP ₹5,000 and 3 stocks saved.',
    name: 'Arjun',
    mobile: '9000011111',
    kycDone: true,
    payday: 1,
    checkin: {
      incomeType: 'salary',
      incomeBand: 'gt50k',
      cushion: 'yes',
      purpose: 'wealth',
      horizon: '5plus',
      dipReaction: 'stay',
      monthly: 5000,
      monthlyChoice: 'custom',
    },
    history: ['normal', 'up', 'normal', 'dip_small', 'up', 'normal', 'flat', 'dip_small', 'normal', 'up'],
    scenario: 'normal',
    sips: [{ fundId: 'index50', amount: 5000, buyWeeks: [1, 5, 9] }],
    watchlist: ['stk_orbitly', 'stk_monsoon', 'stk_voltara'],
  },
];

export function getPersonaSeed(id: PersonaId): PersonaSeed {
  return PERSONA_SEEDS.find((p) => p.id === id)!;
}

/** Builds the full state for a persona so that the simulated today is `today`. */
export function buildPersona(id: PersonaId, today: ISODate): State {
  const seed = getPersonaSeed(id);
  const weeks = seed.history.length;
  const startDate = addDays(today, -7 * weeks);
  let s = createInitialState(startDate);
  s = {
    ...s,
    user: {
      signedUp: true,
      name: seed.name,
      mobile: seed.mobile,
      kyc: seed.kycDone ? 'done' : 'none',
      bankLinked: seed.kycDone,
      autopay: seed.sips.length > 0,
      persona: id,
      ...(seed.payday ? { payday: seed.payday } : {}),
    },
    checkinDraft: { ...seed.checkin },
    checkin: { ...seed.checkin },
    plan: buildPlan(seed.checkin, startDate),
    watchlist: [...(seed.watchlist ?? [])],
  };

  const sipIds = new Map<SeedSip, string>();
  for (let w = 0; w <= weeks; w++) {
    const date = simDate(startDate, w);
    for (const seedSip of seed.sips) {
      if (!seedSip.buyWeeks.includes(w)) continue;
      let sipId = sipIds.get(seedSip);
      if (!sipId) {
        const lastBuy = simDate(startDate, Math.max(...seedSip.buyWeeks));
        const sip: Sip = {
          id: nextId('sip', s.sips),
          fundId: seedSip.fundId,
          amount: seedSip.amount,
          dayOfMonth: Math.min(28, dayOfMonth(lastBuy)),
          status: 'active',
          skipNext: false,
          instalments: 0,
          createdAt: date,
          createdWeek: w,
        };
        sipId = sip.id;
        sipIds.set(seedSip, sipId);
        s = { ...s, sips: [...s.sips, sip] };
        s = postInstalment(s, sipId, date, 'first');
        const order: Order = {
          id: nextId('ord', s.orders),
          kind: 'fund',
          assetId: seedSip.fundId,
          amount: seedSip.amount,
          units: s.activity[s.activity.length - 1].units,
          type: 'sip_first',
          status: 'done',
          week: w,
          createdAt: date,
        };
        s = { ...s, orders: [...s.orders, order] };
      } else {
        s = postInstalment(s, sipId, date);
      }
    }
    if (w < weeks) {
      s = { ...s, market: { ...s.market, history: [...s.market.history, seed.history[w]], week: w + 1 } };
    }
  }

  for (const seedSip of seed.sips) {
    if (!seedSip.goal) continue;
    const sipId = sipIds.get(seedSip)!;
    const goal = {
      id: nextId('goal', s.goals),
      name: seedSip.goal.name,
      target: seedSip.goal.target,
      byDate: addMonths(today, seedSip.goal.monthsAhead),
      sipIds: [sipId],
      isCushion: false,
      createdAt: startDate,
    };
    s = { ...s, goals: [...s.goals, goal], sips: s.sips.map((x) => (x.id === sipId ? { ...x, goalId: goal.id } : x)) };
    s = {
      ...s,
      activity: [{ id: 'act_0', at: startDate, week: 0, kind: 'goal_created', note: goal.name }, ...s.activity],
    };
  }

  return { ...s, market: { ...s.market, scenario: seed.scenario } };
}
