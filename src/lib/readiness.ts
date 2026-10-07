// Readiness check for stocks (README 8.9, PLAN C13). Pass at 4 of 5.
import { READINESS_QUESTIONS } from '../data/learn';

export const READINESS_PASS = 4;

export type ReadinessResult = { score: number; total: number; passed: boolean; wrongIds: string[] };

/** `answers[i]` is the chosen option index for question i (undefined = unanswered). */
export function scoreReadiness(answers: (number | undefined)[]): ReadinessResult {
  let score = 0;
  const wrongIds: string[] = [];
  READINESS_QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score += 1;
    else wrongIds.push(q.id);
  });
  return { score, total: READINESS_QUESTIONS.length, passed: score >= READINESS_PASS, wrongIds };
}
