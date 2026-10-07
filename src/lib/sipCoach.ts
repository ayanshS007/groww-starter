// Stop coach (README 8.6, PLAN item 23 and C12). One screen; "Stop anyway" is
// always present, always last and the same size as the other options.
import { getFund } from '../data/funds';
import type { Fund, FundId, Sip, StopReason } from '../state/types';
import { formatINR, formatPct, formatSigned } from './format';
import type { Change } from './market';

export type CoachReason = Exclude<StopReason, 'none'>;

export const COACH_REASONS: { id: CoachReason; label: string }[] = [
  { id: 'market_fell', label: 'Market fell' },
  { id: 'money_tight', label: 'Money is tight' },
  { id: 'need_money', label: 'I need the money' },
  { id: 'better_fund', label: 'Found a better fund' },
  { id: 'other', label: 'Something else' },
];

export type CoachOptionId =
  | 'keep_sip'
  | 'keep_going'
  | 'pause'
  | 'keep_paused'
  | 'skip_next'
  | 'lower_amount'
  | 'withdraw'
  | 'keep'
  | 'stop_anyway';

export type CoachOption = { id: CoachOptionId; label: string; primary: boolean };

export type ComparisonRow = { label: string; current: string; other: string };

export type Coaching = {
  response: string | null;
  options: CoachOption[];
  comparison?: { currentFund: Fund; otherFund: Fund; rows: ComparisonRow[] };
};

export type CoachContext = {
  /** The portfolio's move this week, for "Market fell". */
  weekChange?: Change;
  /** Fund the user is comparing against, for "Found a better fund". */
  otherFundId?: FundId;
};

const STOP: Omit<CoachOption, 'primary'> = { id: 'stop_anyway', label: 'Stop anyway' };

function withPrimary(opts: Omit<CoachOption, 'primary'>[]): CoachOption[] {
  return [...opts, STOP].map((o, i) => ({ ...o, primary: i === 0 && o.id !== 'stop_anyway' }));
}

export function compareFunds(current: Fund, other: Fund): ComparisonRow[] {
  return [
    { label: 'Risk', current: `${current.risk} of 5`, other: `${other.risk} of 5` },
    { label: 'Time frame', current: current.horizonLabel, other: other.horizonLabel },
    { label: 'Min SIP', current: formatINR(current.minSip), other: formatINR(other.minSip) },
    { label: 'Expense ratio', current: formatPct(current.expenseRatio, 2), other: formatPct(other.expenseRatio, 2) },
  ];
}

export function coachFor(reason: CoachReason | null, sip: Sip, context: CoachContext = {}): Coaching {
  const paused = sip.status === 'paused';
  const pause: Omit<CoachOption, 'primary'> = paused
    ? { id: 'keep_paused', label: 'Keep it paused' }
    : { id: 'pause', label: 'Pause' };

  switch (reason) {
    case null:
      return { response: null, options: withPrimary([{ id: 'keep_sip', label: 'Keep my SIP' }]) };

    case 'market_fell': {
      const move = context.weekChange
        ? `This week your portfolio moved ${formatSigned(context.weekChange.amount)} (${formatSigned(context.weekChange.pct, 'pct')}). `
        : '';
      return {
        response: `${move}If you keep going, the same ${formatINR(sip.amount)} buys more units while prices are lower.`,
        options: withPrimary([
          { id: 'keep_going', label: 'Keep going' },
          paused ? pause : { id: 'pause', label: 'Pause 1–3 months' },
        ]),
      };
    }

    case 'money_tight':
      return {
        response: 'Skipping is free and keeps your plan alive.',
        options: withPrimary([
          { id: 'skip_next', label: 'Skip next' },
          { id: 'lower_amount', label: 'Lower amount' },
          pause,
        ]),
      };

    case 'need_money':
      return {
        response:
          'Stopping a SIP doesn’t return any money. Withdraw does: it usually reaches your bank in 1–3 working days.',
        options: withPrimary([{ id: 'withdraw', label: 'Go to Withdraw' }]),
      };

    case 'better_fund': {
      const current = getFund(sip.fundId);
      const other = context.otherFundId ? getFund(context.otherFundId) : undefined;
      const comparison = current && other ? { currentFund: current, otherFund: other, rows: compareFunds(current, other) } : undefined;
      return {
        response: 'Here’s how they compare. Your current units stay invested either way.',
        options: withPrimary([{ id: 'keep', label: 'Keep' }]),
        comparison,
      };
    }

    case 'other':
      return { response: null, options: withPrimary([pause]) };
  }
}

/** Toast after stopping (PLAN S16). */
export function stopToast(investedValue: number): string {
  return `SIP stopped. Your ${formatINR(investedValue)} stays invested.`;
}
