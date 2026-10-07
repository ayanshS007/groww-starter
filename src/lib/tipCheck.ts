// Tip Check (README 8.7). Never says whether the market call is right or wrong.
import type { PickReason } from '../state/types';

export type TipSource = 'friend' | 'social' | 'chat' | 'news';

export const TIP_SOURCES: { id: TipSource; label: string }[] = [
  { id: 'friend', label: 'A friend' },
  { id: 'social', label: 'Instagram or YouTube' },
  { id: 'chat', label: 'Telegram or WhatsApp' },
  { id: 'news', label: 'News' },
];

export type TipQuestionId = 'guaranteed' | 'urgency' | 'promoter' | 'canFind' | 'registered' | 'wouldHurt';

/** `riskyAnswer` is the yes/no answer that counts as a risk. */
export const TIP_QUESTIONS: { id: TipQuestionId; question: string; riskyAnswer: boolean; driver: string }[] = [
  { id: 'guaranteed', question: 'Does it promise a guaranteed return?', riskyAnswer: true, driver: 'It promises a fixed return' },
  { id: 'urgency', question: 'Does it say “buy now” or “only today”?', riskyAnswer: true, driver: 'It pushes you to act fast' },
  {
    id: 'promoter',
    question: 'Is the person paid to promote it, or selling a course or group?',
    riskyAnswer: true,
    driver: 'The source earns from promoting it',
  },
  {
    id: 'canFind',
    question: 'Can you find out what the company or fund actually does?',
    riskyAnswer: false,
    driver: 'You can’t find what it does',
  },
  {
    id: 'registered',
    question: 'Is the source registered with SEBI (as an RA or RIA)?',
    riskyAnswer: false,
    driver: 'The source isn’t SEBI-registered',
  },
  {
    id: 'wouldHurt',
    question: 'Would losing this money hurt your rent, fees or EMI?',
    riskyAnswer: true,
    driver: 'Losing it would hurt your essentials',
  },
];

export type TipAnswers = Record<TipQuestionId, boolean>;
export type TipTier = 'red_flag' | 'be_careful' | 'fine_to_research';

export const TIER_LABEL: Record<TipTier, string> = {
  red_flag: 'Red flag',
  be_careful: 'Be careful',
  fine_to_research: 'Fine to research further',
};

export type TipResult = { tier: TipTier; label: string; drivers: string[]; riskCount: number; nextStep: string };

const NEXT_STEP: Record<TipTier, string> = {
  red_flag: 'Don’t act on this tip. If money was asked for, you can report it on SEBI’s SCORES portal.',
  be_careful: 'Read what the company or fund does, and only use money you won’t need soon.',
  fine_to_research: 'Read the fund or company page and compare it with your starter plan.',
};

/** Red flag: any guaranteed return, or ≥ 3 risk answers. Be careful: 1–2. Fine: 0. */
export function scoreTipCheck(answers: TipAnswers): TipResult {
  const risky = TIP_QUESTIONS.filter((q) => answers[q.id] === q.riskyAnswer);
  const riskCount = risky.length;
  const tier: TipTier =
    answers.guaranteed || riskCount >= 3 ? 'red_flag' : riskCount >= 1 ? 'be_careful' : 'fine_to_research';
  return { tier, label: TIER_LABEL[tier], drivers: risky.map((q) => q.driver), riskCount, nextStep: NEXT_STEP[tier] };
}

// ---------- pick reason in buy flows (README 8.7) ----------
export const PICK_REASONS: { id: PickReason; label: string }[] = [
  { id: 'plan', label: 'My starter plan' },
  { id: 'researched', label: 'I researched it' },
  { id: 'social', label: 'A friend or social media' },
  { id: 'not_sure', label: 'Not sure' },
];

/**
 * Reasons offered for an asset kind. A starter plan never holds single stocks,
 * so stock buys don't offer "My starter plan" (QA #9).
 */
export function pickReasonsFor(kind: 'fund' | 'stock'): { id: PickReason; label: string }[] {
  return kind === 'stock' ? PICK_REASONS.filter((r) => r.id !== 'plan') : PICK_REASONS;
}

/** "A friend or social media" and "Not sure" bring the inline Tip Check offer. */
export function offersTipCheck(reason: PickReason | undefined): boolean {
  return reason === 'social' || reason === 'not_sure';
}

/** Partial answers → the result, or the ids still unanswered. */
export function tipCheckOutcome(
  answers: Partial<TipAnswers>,
): { done: true; result: TipResult } | { done: false; missing: TipQuestionId[] } {
  const missing = TIP_QUESTIONS.filter((q) => answers[q.id] === undefined).map((q) => q.id);
  if (missing.length > 0) return { done: false, missing };
  return { done: true, result: scoreTipCheck(answers as TipAnswers) };
}
