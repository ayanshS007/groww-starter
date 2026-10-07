import { describe, expect, it } from 'vitest';
import { RIYA_ANSWERS } from '../test/fixtures';
import { firstUnansweredStep, isCheckinStarted, isStepAnswered } from './checkin';

describe('check-in steps', () => {
  it('step 1 needs both income type and band', () => {
    expect(isStepAnswered(1, { incomeType: 'salary' })).toBe(false);
    expect(isStepAnswered(1, { incomeType: 'salary', incomeBand: '25to50k' })).toBe(true);
  });
  it('step 6 needs a valid amount (₹99 and ₹1,00,001 are not answers)', () => {
    expect(isStepAnswered(6, { monthlyChoice: 'custom', monthly: 99 })).toBe(false);
    expect(isStepAnswered(6, { monthlyChoice: 'custom', monthly: 100_001 })).toBe(false);
    expect(isStepAnswered(6, { monthlyChoice: 'custom', monthly: 100 })).toBe(true);
    expect(isStepAnswered(6, { monthlyChoice: 500, monthly: 500 })).toBe(true);
  });
  it('unknown steps are never answered', () => {
    expect(isStepAnswered(7, RIYA_ANSWERS)).toBe(false);
  });
  it('finds the first unanswered step', () => {
    expect(firstUnansweredStep(undefined)).toBe(1);
    expect(firstUnansweredStep({ incomeType: 'salary', incomeBand: 'lt10k', cushion: 'no' })).toBe(3);
    expect(firstUnansweredStep(RIYA_ANSWERS)).toBe(6);
  });
  it('knows when a check-in was started', () => {
    expect(isCheckinStarted(undefined)).toBe(false);
    expect(isCheckinStarted({})).toBe(false);
    expect(isCheckinStarted({ cushion: 'no' })).toBe(true);
  });
});
