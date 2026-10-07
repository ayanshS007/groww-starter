// Check-in → Starter plan (README 8.1, PLAN items 1–10, C7). Pure functions.
import { getFund } from '../data/funds';
import type {
  AnswerKey,
  CheckinAnswers,
  CushionAnswer,
  DipReaction,
  FundId,
  Horizon,
  IncomeBand,
  IncomeType,
  ISODate,
  PlanBucket,
  PlanFactor,
  PlanRule,
  Purpose,
  RiskComfort,
  StarterPlan,
} from '../state/types';
import { PLAN_LABEL } from '../state/types';
import { formatINR } from './format';
import { HORIZON_TEXT } from './market';

export const MIN_MONTHLY = 100;
export const MAX_MONTHLY = 100_000;
/** Smallest SIP the plan will create; smaller parts are merged. */
export const MIN_PART = 100;
export const CUSHION_FUND: FundId = 'liquid1';

// ---------- labels (shared with the check-in screens) ----------
export const INCOME_TYPE_LABEL: Record<IncomeType, string> = {
  stipend: 'Stipend or pocket money',
  parttime: 'Part-time or freelance',
  salary: 'Salary',
  none: 'Not earning yet',
};
export const INCOME_BAND_LABEL: Record<IncomeBand, string> = {
  lt10k: '< ₹10k',
  '10to25k': '₹10–25k',
  '25to50k': '₹25–50k',
  gt50k: '₹50k+',
};
export const CUSHION_LABEL: Record<CushionAnswer, string> = { yes: 'Yes, a few months', some: 'Some', no: 'Not yet' };
export const PURPOSE_LABEL: Record<Purpose, string> = {
  wealth: 'Grow wealth',
  goal: 'A specific goal',
  cushion: 'Build a cushion',
  exploring: 'Just exploring',
};
export const HORIZON_LABEL: Record<Horizon, string> = { lt1: '< 1 yr', '1to3': '1–3 yrs', '3to5': '3–5 yrs', '5plus': '5+ yrs' };
export const DIP_LABEL: Record<DipReaction, string> = { sell: 'Probably sell', wait: 'Wait it out', stay: 'Stay, maybe add' };

// ---------- derived values ----------
export function riskComfort(d: DipReaction): RiskComfort {
  return d === 'sell' ? 'low' : d === 'wait' ? 'moderate' : 'high';
}

export const COMFORT_CEILING: Record<IncomeBand, number> = { lt10k: 1500, '10to25k': 4000, '25to50k': 10000, gt50k: 25000 };

export function comfortCeiling(band: IncomeBand): number {
  return COMFORT_CEILING[band];
}

/** PLAN item 8. */
export const INCOME_MIDPOINT: Record<IncomeBand, number> = { lt10k: 5000, '10to25k': 17500, '25to50k': 37500, gt50k: 50000 };

/** Cushion target = 3 × income-band midpoint. */
export function cushionTarget(band: IncomeBand): number {
  return 3 * INCOME_MIDPOINT[band];
}

/** A first, reachable cushion step shown before the full target (QA #20). */
export const CUSHION_FIRST_STEP = 10000;

/**
 * What the cushion is measured against on screen: the first ₹10,000 until it is
 * reached (or when the full target is smaller), then the full target.
 */
export function cushionStep(value: number, target: number): { main: number; full: number; first: boolean } {
  const first = target > CUSHION_FIRST_STEP && value < CUSHION_FIRST_STEP;
  return { main: first ? CUSHION_FIRST_STEP : target, full: target, first };
}

/** README 8.2: salary → payday + 3 (default payday 1st); irregular income → 10th. Range 1–28. */
export function defaultSipDay(incomeType: IncomeType, payday = 1): number {
  if (incomeType !== 'salary') return 10;
  return Math.min(28, Math.max(1, payday + 3));
}

// ---------- step A: split ----------
const RULE_PCT: Record<PlanRule, number> = { A1: 100, A2: 100, A3: 70, A4: 50, A5: 30, A6: 0 };

/** First match wins (README 8.1 step A). Returns the cushion %. */
export function splitRule(a: Pick<CheckinAnswers, 'purpose' | 'horizon' | 'cushion' | 'incomeType'>): {
  rule: PlanRule;
  cushionPct: number;
} {
  let rule: PlanRule;
  if (a.purpose === 'cushion') rule = 'A1';
  else if (a.horizon === 'lt1') rule = 'A2';
  else if (a.cushion === 'no' && a.incomeType !== 'salary') rule = 'A3';
  else if (a.cushion === 'no') rule = 'A4';
  else if (a.cushion === 'some') rule = 'A5';
  else rule = 'A6';
  return { rule, cushionPct: RULE_PCT[rule] };
}

// ---------- step B: grow category ----------
export type Conflict = 'short_high' | 'long_low';
export type GrowCategory = { fundId: FundId; alternativeFundId?: FundId; conflict?: Conflict };

const MATRIX: Record<Horizon, Record<RiskComfort, GrowCategory>> = {
  lt1: {
    low: { fundId: 'liquid1' },
    moderate: { fundId: 'liquid1' },
    high: { fundId: 'liquid1', conflict: 'short_high' },
  },
  '1to3': {
    low: { fundId: 'shortdebt1' },
    moderate: { fundId: 'shortdebt1' },
    high: { fundId: 'shortdebt1', alternativeFundId: 'balanced1' },
  },
  '3to5': {
    low: { fundId: 'shortdebt1' },
    moderate: { fundId: 'balanced1' },
    high: { fundId: 'balanced1', alternativeFundId: 'index50' },
  },
  '5plus': {
    low: { fundId: 'balanced1', conflict: 'long_low' },
    moderate: { fundId: 'index50' },
    high: { fundId: 'index50', alternativeFundId: 'flexi1' },
  },
};

export function growCategory(horizon: Horizon, comfort: RiskComfort): GrowCategory {
  return MATRIX[horizon][comfort];
}

export const CONFLICT_NOTES: Record<Conflict, string> = {
  short_high:
    "You're fine with ups and downs, but you need this within a year. Shares could be down exactly when you withdraw, so we're starting you steadier.",
  long_low:
    'You have lots of time, but a big fall would worry you. A balanced fund grows with a smoother ride.',
};

export const SPLIT_NOTES = {
  less: 'Less cushion means a surprise bill could force you to sell.',
  more: 'More cushion is steadier, but grows more slowly.',
  liquid: 'You need this within a year, so all of it stays in a liquid fund.',
} as const;

// ---------- validation and rounding ----------
export type MonthlyCheck = { ok: true; value: number } | { ok: false; error: string };

export function validateMonthly(input: number | string): MonthlyCheck {
  const raw = typeof input === 'string' ? input.replace(/[₹,\s]/g, '') : input;
  if (raw === '' || raw === null || raw === undefined) return { ok: false, error: 'Enter an amount.' };
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: 'Enter an amount in rupees.' };
  if (!Number.isInteger(n)) return { ok: false, error: 'Use whole rupees.' };
  if (n < MIN_MONTHLY) return { ok: false, error: `The minimum is ${formatINR(MIN_MONTHLY)} a month.` };
  if (n > MAX_MONTHLY) return { ok: false, error: `The maximum here is ${formatINR(MAX_MONTHLY)} a month.` };
  return { ok: true, value: n };
}

export function roundTo50(n: number): number {
  return Math.round(n / 50) * 50;
}

/** Slider input: clamp to 0–100 and snap to steps of 10. */
export function normaliseCushionPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, Math.round(pct / 10) * 10));
}

export type SplitAmounts = { cushion: number; grow: number; mergeNote?: string };

/** Cushion rounded to ₹50, grow gets the rest; parts under ₹100 merge (ties go to the cushion). */
export function splitAmounts(monthly: number, cushionPct: number): SplitAmounts {
  let cushion = Math.min(monthly, Math.max(0, roundTo50((monthly * cushionPct) / 100)));
  let grow = monthly - cushion;
  if (cushionPct <= 0 || cushionPct >= 100) {
    return cushionPct >= 100 ? { cushion: monthly, grow: 0 } : { cushion: 0, grow: monthly };
  }
  const min = formatINR(MIN_PART);
  if (cushion < MIN_PART && grow < MIN_PART) {
    return {
      cushion: monthly,
      grow: 0,
      mergeNote: `Both parts are under the ${min} SIP minimum, so all ${formatINR(monthly)} goes to your cushion.`,
    };
  }
  if (cushion < MIN_PART) {
    const part = cushion > 0 ? cushion : Math.round((monthly * cushionPct) / 100);
    cushion = 0;
    grow = monthly;
    return { cushion, grow, mergeNote: `The cushion part (${formatINR(part)}) is under the ${min} SIP minimum, so it joins the grow part.` };
  }
  if (grow < MIN_PART) {
    const part = grow;
    return {
      cushion: monthly,
      grow: 0,
      mergeNote: `The grow part (${formatINR(part)}) is under the ${min} SIP minimum, so it joins your cushion.`,
    };
  }
  return { cushion, grow };
}

// ---------- reasons and factors ----------
const INCOME_PHRASE: Record<IncomeType, string> = {
  salary: 'You earn a monthly salary',
  stipend: 'Your money comes as a stipend or pocket money',
  parttime: 'Your part-time or freelance income can vary',
  none: 'You’re not earning yet',
};
const CUSHION_PHRASE: Record<CushionAnswer, string> = {
  yes: 'You already have a few months set aside',
  some: 'You have some money set aside',
  no: 'You don’t have emergency money yet',
};
const PURPOSE_PHRASE: Record<Purpose, string> = {
  wealth: 'You want to grow wealth',
  goal: 'You’re saving for a specific goal',
  cushion: 'You want to build a cushion',
  exploring: 'You’re exploring for now',
};
const HORIZON_PHRASE: Record<Horizon, string> = {
  lt1: 'You may need this within a year',
  '1to3': 'You may need this in 1–3 years',
  '3to5': 'You may need this in 3–5 years',
  '5plus': 'You can leave this for 5+ years',
};
const DIP_PHRASE: Record<DipReaction, string> = {
  sell: 'A 10% fall might make you sell',
  wait: 'You’d wait out a 10% fall',
  stay: 'You’d stay, maybe add, if it fell 10%',
};

function cushionReason(a: CheckinAnswers, rule: PlanRule): { reason: string; cited: AnswerKey[] } {
  const close =
    a.purpose === 'goal'
      ? 'Your goal money stays steady in a liquid fund, ready when you need it.'
      : 'A liquid fund keeps it steady and quick to withdraw.';
  switch (rule) {
    case 'A1':
      return { reason: `${PURPOSE_PHRASE.cushion}. ${HORIZON_PHRASE[a.horizon]}. ${close}`, cited: ['purpose', 'horizon'] };
    case 'A2':
      return { reason: `${HORIZON_PHRASE.lt1}. ${PURPOSE_PHRASE[a.purpose]}. ${close}`, cited: ['horizon', 'purpose'] };
    case 'A3':
    case 'A4':
      return {
        reason: `${CUSHION_PHRASE.no}. ${INCOME_PHRASE[a.incomeType]}. So part of each month builds a cushion first. ${close}`,
        cited: ['cushion', 'incomeType'],
      };
    case 'A5':
      return {
        reason: `${CUSHION_PHRASE.some}. ${INCOME_PHRASE[a.incomeType]}. A smaller part tops up your cushion. ${close}`,
        cited: ['cushion', 'incomeType'],
      };
    case 'A6':
      return {
        reason: `${CUSHION_PHRASE.yes}. ${PURPOSE_PHRASE[a.purpose]}. You chose to keep some extra aside. ${close}`,
        cited: ['cushion', 'purpose'],
      };
  }
}

function growReason(a: CheckinAnswers, fundId: FundId): { reason: string; cited: AnswerKey[] } {
  const name = getFund(fundId)?.name ?? 'This fund';
  const cited: AnswerKey[] = ['horizon', 'dipReaction'];
  let close: string;
  switch (a.purpose) {
    case 'goal':
      close = `${name} works toward your goal at a pace that suits your time frame.`;
      cited.push('purpose');
      break;
    case 'exploring':
      close = `${name} is a simple way to start and learn as you go.`;
      cited.push('purpose');
      break;
    case 'cushion':
      close = `${name} lets this part grow while your cushion builds.`;
      cited.push('purpose');
      break;
    default:
      close = `${name} aims to grow your money over that time.`;
  }
  return { reason: `${HORIZON_PHRASE[a.horizon]}. ${DIP_PHRASE[a.dipReaction]}. ${close}`, cited };
}

export function buildFactors(a: CheckinAnswers): PlanFactor[] {
  const dipWords: Record<DipReaction, string> = { sell: 'probably sell', wait: 'wait it out', stay: 'stay, maybe add' };
  const cushionWords: Record<CushionAnswer, string> = { yes: 'a few months', some: 'some', no: 'not yet' };
  const purposeWords: Record<Purpose, string> = {
    wealth: 'growing wealth',
    goal: 'a specific goal',
    cushion: 'building a cushion',
    exploring: 'exploring',
  };
  return [
    { answer: 'horizon', text: `Time frame: ${HORIZON_TEXT[a.horizon]}` },
    { answer: 'dipReaction', text: `If it fell 10%, you’d ${dipWords[a.dipReaction]}` },
    { answer: 'cushion', text: `Emergency money set aside: ${cushionWords[a.cushion]}` },
    {
      answer: 'incomeType',
      text: `Income: ${INCOME_TYPE_LABEL[a.incomeType].toLowerCase()}, ${INCOME_BAND_LABEL[a.incomeBand]} a month`,
    },
    { answer: 'purpose', text: `This money is for ${purposeWords[a.purpose]}` },
    { answer: 'monthly', text: `Monthly amount: ${formatINR(a.monthly)}` },
  ];
}

// ---------- plan ----------
/**
 * Builds the Starter plan. `cushionPctOverride` comes from the Adjust split
 * slider (PLAN item 9); rounding and merge rules re-run on every change.
 */
export function buildPlan(answers: CheckinAnswers, today: ISODate, cushionPctOverride?: number): StarterPlan {
  const comfort = riskComfort(answers.dipReaction);
  const { rule, cushionPct: suggested } = splitRule(answers);
  const cushionPct = cushionPctOverride === undefined ? suggested : normaliseCushionPct(cushionPctOverride);
  const grow = growCategory(answers.horizon, comfort);
  const ceiling = comfortCeiling(answers.incomeBand);

  let { cushion, grow: growAmt, mergeNote } = splitAmounts(answers.monthly, cushionPct);
  let splitNote: string | undefined;
  if (cushionPct < suggested) splitNote = SPLIT_NOTES.less;
  else if (cushionPct > suggested) splitNote = SPLIT_NOTES.more;

  // Grow category is Liquid: both parts land in the same fund and become one bucket.
  if (grow.fundId === CUSHION_FUND && growAmt > 0) {
    cushion = answers.monthly;
    growAmt = 0;
    mergeNote = undefined;
    splitNote = SPLIT_NOTES.liquid;
  }

  const buckets: PlanBucket[] = [];
  if (cushion > 0) {
    const r = cushionReason(answers, rule);
    buckets.push({ role: 'cushion', fundId: CUSHION_FUND, amount: cushion, reason: r.reason, citedAnswers: r.cited });
  }
  if (growAmt > 0) {
    const r = growReason(answers, grow.fundId);
    buckets.push({ role: 'grow', fundId: grow.fundId, amount: growAmt, reason: r.reason, citedAnswers: r.cited });
  }

  const hasGrow = growAmt > 0;
  let conflictNote: string | undefined;
  if (grow.conflict === 'short_high') conflictNote = CONFLICT_NOTES.short_high;
  else if (grow.conflict === 'long_low' && hasGrow) conflictNote = CONFLICT_NOTES.long_low;

  const overCeilingNote =
    answers.monthly > ceiling
      ? `${formatINR(answers.monthly)} a month is above the ${formatINR(ceiling)} that usually feels easy at your income. Change it any time.`
      : undefined;

  const plan: StarterPlan = {
    monthly: answers.monthly,
    rule,
    riskComfort: comfort,
    suggestedCushionPct: suggested,
    cushionPct,
    buckets,
    factors: buildFactors(answers),
    comfortCeiling: ceiling,
    label: PLAN_LABEL,
    createdAt: today,
  };
  if (hasGrow && grow.alternativeFundId) plan.alternativeFundId = grow.alternativeFundId;
  if (conflictNote) plan.conflictNote = conflictNote;
  if (overCeilingNote) plan.overCeilingNote = overCeilingNote;
  if (mergeNote) plan.mergeNote = mergeNote;
  if (splitNote) plan.splitNote = splitNote;
  return plan;
}

/** True when every key of the check-in has an answer. */
export function isCompleteCheckin(d: Partial<CheckinAnswers> | undefined): d is CheckinAnswers {
  return (
    !!d &&
    !!d.incomeType &&
    !!d.incomeBand &&
    !!d.cushion &&
    !!d.purpose &&
    !!d.horizon &&
    !!d.dipReaction &&
    d.monthlyChoice !== undefined &&
    typeof d.monthly === 'number' &&
    validateMonthly(d.monthly).ok
  );
}
