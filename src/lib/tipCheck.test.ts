import { describe, expect, it } from 'vitest';
import { PICK_REASONS, TIP_QUESTIONS, offersTipCheck, scoreTipCheck, tipCheckOutcome, type TipAnswers } from './tipCheck';

const safe: TipAnswers = {
  guaranteed: false,
  urgency: false,
  promoter: false,
  canFind: true,
  registered: true,
  wouldHurt: false,
};

describe('scoreTipCheck', () => {
  it('has 6 yes/no questions', () => {
    expect(TIP_QUESTIONS).toHaveLength(6);
  });
  it('0 risk answers → Fine to research further', () => {
    expect(scoreTipCheck(safe)).toMatchObject({ tier: 'fine_to_research', riskCount: 0, drivers: [] });
  });
  it('1 risk answer → Be careful', () => {
    const r = scoreTipCheck({ ...safe, urgency: true });
    expect(r.tier).toBe('be_careful');
    expect(r.drivers).toEqual(['It pushes you to act fast']);
  });
  it('2 risk answers → Be careful (inverted questions count when answered "no")', () => {
    const r = scoreTipCheck({ ...safe, canFind: false, registered: false });
    expect(r.tier).toBe('be_careful');
    expect(r.riskCount).toBe(2);
  });
  it('3 risk answers → Red flag', () => {
    expect(scoreTipCheck({ ...safe, urgency: true, promoter: true, wouldHurt: true }).tier).toBe('red_flag');
  });
  it('a guaranteed return alone → Red flag', () => {
    const r = scoreTipCheck({ ...safe, guaranteed: true });
    expect(r.tier).toBe('red_flag');
    expect(r.riskCount).toBe(1);
    expect(r.drivers).toEqual(['It promises a fixed return']);
  });
  it('always gives one next step and never judges the market call', () => {
    for (const a of [safe, { ...safe, urgency: true }, { ...safe, guaranteed: true }]) {
      const r = scoreTipCheck(a);
      expect(r.nextStep.length).toBeGreaterThan(10);
      expect(r.nextStep.toLowerCase()).not.toMatch(/will (go up|rise|fall)|right call|wrong call/);
    }
  });
});

describe('pick reason in buy flows (README 8.7)', () => {
  it('the four chips, in order', () => {
    expect(PICK_REASONS.map((r) => r.label)).toEqual(['My starter plan', 'I researched it', 'A friend or social media', 'Not sure']);
  });
  it('only "friend or social media" and "not sure" bring the Tip Check offer', () => {
    expect(offersTipCheck('social')).toBe(true);
    expect(offersTipCheck('not_sure')).toBe(true);
    expect(offersTipCheck('plan')).toBe(false);
    expect(offersTipCheck('researched')).toBe(false);
    expect(offersTipCheck(undefined)).toBe(false);
  });
  it('the result needs all six answers', () => {
    expect(tipCheckOutcome({ guaranteed: false })).toMatchObject({ done: false });
    const all = { guaranteed: false, urgency: false, promoter: false, canFind: true, registered: true, wouldHurt: false };
    expect(tipCheckOutcome(all)).toMatchObject({ done: true, result: { tier: 'fine_to_research' } });
  });
});
