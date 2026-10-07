import { describe, expect, it } from 'vitest';
import { READINESS_QUESTIONS } from '../data/learn';
import { scoreReadiness } from './readiness';

const correct = READINESS_QUESTIONS.map((q) => q.correctIndex);
const wrong = (i: number) => (READINESS_QUESTIONS[i].correctIndex + 1) % READINESS_QUESTIONS[i].options.length;

describe('scoreReadiness', () => {
  it('has 5 questions', () => {
    expect(READINESS_QUESTIONS).toHaveLength(5);
  });
  it('passes at 5/5', () => {
    expect(scoreReadiness(correct)).toMatchObject({ score: 5, passed: true, wrongIds: [] });
  });
  it('passes at 4/5', () => {
    const a = [...correct];
    a[2] = wrong(2);
    expect(scoreReadiness(a)).toMatchObject({ score: 4, passed: true, wrongIds: [READINESS_QUESTIONS[2].id] });
  });
  it('does not pass at 3/5', () => {
    const a = [...correct];
    a[0] = wrong(0);
    a[4] = wrong(4);
    expect(scoreReadiness(a)).toMatchObject({ score: 3, passed: false });
  });
  it('counts unanswered questions as not correct', () => {
    expect(scoreReadiness([]).score).toBe(0);
  });
});
