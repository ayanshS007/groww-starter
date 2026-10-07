import { describe, expect, it } from 'vitest';
import { splitPay } from './paydaySplit';

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
