import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { fresh, oneTime, run, TODAY, withCheckin } from '../test/fixtures';
import { defaultPay, paydayCushionTarget, paydayFromState, splitPay, validatePay } from './paydaySplit';

describe('splitPay', () => {
  it('cushion below target: tops up 10% of pay, rounded to ₹50', () => {
    const r = splitPay({ pay: 28000, activeSipTotal: 2000, cushionValue: 0, cushionTarget: 112500 });
    expect(r).toEqual({ toSips: 2000, topUp: 2800, toSpend: 23200, cushionGap: 112500 });
  });
  it('rounds the top-up to the nearest ₹50', () => {
    expect(splitPay({ pay: 17777, activeSipTotal: 0, cushionValue: 0, cushionTarget: 50000 }).topUp).toBe(1800); // 1777.7
    expect(splitPay({ pay: 17720, activeSipTotal: 0, cushionValue: 0, cushionTarget: 50000 }).topUp).toBe(1750); // 1772
  });
  it('caps the top-up at the gap to the target', () => {
    const r = splitPay({ pay: 28000, activeSipTotal: 0, cushionValue: 111500, cushionTarget: 112500 });
    expect(r.cushionGap).toBe(1000);
    expect(r.topUp).toBe(1000);
  });
  it('cushion at or above target: no top-up', () => {
    expect(splitPay({ pay: 28000, activeSipTotal: 2000, cushionValue: 112500, cushionTarget: 112500 }).topUp).toBe(0);
    expect(splitPay({ pay: 28000, activeSipTotal: 2000, cushionValue: 200000, cushionTarget: 112500 })).toMatchObject({
      topUp: 0,
      toSpend: 26000,
      cushionGap: 0,
    });
  });
  it('SIPs larger than pay: no top-up, spend never below ₹0, with a note', () => {
    const r = splitPay({ pay: 3000, activeSipTotal: 4000, cushionValue: 0, cushionTarget: 15000 });
    expect(r.topUp).toBe(0);
    expect(r.toSpend).toBe(0);
    expect(r.toSips).toBe(4000);
    expect(r.note).toBeDefined();
  });
  it('top-up never pushes spending below zero', () => {
    const r = splitPay({ pay: 5000, activeSipTotal: 4900, cushionValue: 0, cushionTarget: 15000 });
    expect(r.topUp).toBe(100);
    expect(r.toSpend).toBe(0);
    expect(r.note).toBeUndefined();
  });
});

describe('Payday Split from state (PLAN item 33)', () => {
  it('Simulate pay credit defaults: ₹28,000 for Riya, the income-band midpoint for others', () => {
    expect(defaultPay(buildPersona('riya', TODAY))).toBe(28000);
    expect(defaultPay(buildPersona('meera', TODAY))).toBe(17500);
    expect(defaultPay(buildPersona('arjun', TODAY))).toBe(50000);
    expect(defaultPay(withCheckin(fresh(), { incomeBand: 'lt10k' }))).toBe(5000);
  });
  it('cushion target: 3 × band midpoint, or an Emergency cushion goal’s target', () => {
    const s = withCheckin(fresh());
    expect(paydayCushionTarget(s)).toBe(112500);
    const g = run(s, { type: 'createGoal', name: 'Emergency cushion', target: 60000, byDate: '2027-10-07', isCushion: true });
    expect(paydayCushionTarget(g)).toBe(60000);
  });
  it('Riya: ₹2,000 already to SIPs, ₹2,800 top-up, ₹23,200 to spend', () => {
    const r = buildPersona('riya', TODAY);
    const p = paydayFromState(r, 28000, paydayCushionTarget(r));
    expect(p).toMatchObject({ toSips: 2000, topUp: 2800, toSpend: 23200, cushionValue: 0, cushionTarget: 112500 });
  });
  it('the top-up lands in the cushion: a one-time into liquid1 raises cushion value by about the top-up', () => {
    const r = buildPersona('riya', TODAY);
    const before = paydayFromState(r, 28000, 112500);
    const after = oneTime(r, 'liquid1', before.topUp);
    const p = paydayFromState(after, 28000, 112500);
    expect(p.cushionValue).toBeGreaterThan(2700);
    expect(p.cushionValue).toBeLessThan(2900);
    expect(p.cushionGap).toBeLessThan(before.cushionGap);
  });
  it('payday amount smaller than the SIP total: no top-up, ₹0 to spend, a note', () => {
    const r = buildPersona('riya', TODAY);
    expect(paydayFromState(r, 1500, 112500)).toMatchObject({ toSips: 2000, topUp: 0, toSpend: 0 });
    expect(paydayFromState(r, 1500, 112500).note).toMatch(/skip a month/);
  });
  it('validates the pay amount', () => {
    expect(validatePay('28,000')).toEqual({ ok: true, value: 28000 });
    expect(validatePay('')).toMatchObject({ ok: false });
    expect(validatePay('99')).toMatchObject({ ok: false });
    expect(validatePay('10000001')).toMatchObject({ ok: false });
  });
});
