import { describe, expect, it } from 'vitest';
import { dateLabel, formatINR, formatPct, formatSigned, formatUnits, keepSignsTogether, maskMobile, MINUS, ordinal } from './format';

describe('formatINR', () => {
  it('uses Indian grouping', () => {
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(1234567)).toBe('₹12,34,567');
    expect(formatINR(99)).toBe('₹99');
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
    expect(formatINR(0)).toBe('₹0');
  });
  it('formats negatives with a minus sign', () => {
    expect(formatINR(-1500)).toBe(`${MINUS}₹1,500`);
    expect(formatINR(-100000)).toBe(`${MINUS}₹1,00,000`);
  });
  it('rounds to whole rupees by default and never shows −₹0', () => {
    expect(formatINR(1499.5)).toBe('₹1,500');
    expect(formatINR(1499.49)).toBe('₹1,499');
    expect(formatINR(-0.4)).toBe('₹0');
    expect(formatINR(-2.5)).toBe(`${MINUS}₹3`);
  });
  it('supports decimals', () => {
    expect(formatINR(1234.567, 2)).toBe('₹1,234.57');
    expect(formatINR(-0.004, 2)).toBe('₹0.00');
  });
});

describe('formatPct and formatSigned', () => {
  it('formats percentages', () => {
    expect(formatPct(4.25)).toBe('4.3%');
    expect(formatPct(-8)).toBe(`${MINUS}8.0%`);
    expect(formatPct(-0.01)).toBe('0.0%');
    expect(formatPct(12.345, 2)).toBe('12.35%');
  });
  it('adds a sign to non-zero values', () => {
    expect(formatSigned(200)).toBe('+₹200');
    expect(formatSigned(-200)).toBe(`${MINUS}₹200`);
    expect(formatSigned(0)).toBe('₹0');
    expect(formatSigned(1.24, 'pct')).toBe('+1.2%');
    expect(formatSigned(-1.24, 'pct')).toBe(`${MINUS}1.2%`);
    expect(formatSigned(0.01, 'pct')).toBe('0.0%');
  });
});

describe('misc', () => {
  it('masks a mobile number', () => {
    expect(maskMobile('9876543210')).toBe('••••••3210');
    expect(maskMobile('12')).toBe('••••');
  });
  it('labels dates', () => {
    expect(dateLabel('2026-10-07')).toBe('7 Oct 2026');
    expect(dateLabel('2027-01-04', { short: true })).toBe('4 Jan');
  });
  it('makes ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 28].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '28th',
    ]);
  });
  it('formats units', () => {
    expect(formatUnits(12.34567)).toBe('12.346');
  });
});

describe('keepSignsTogether', () => {
  it('adds a word joiner after each minus, once', () => {
    const once = keepSignsTogether('Overall: −₹732 (−12.2%)');
    expect(once).toBe('Overall: −\u2060₹732 (−\u206012.2%)');
    expect(keepSignsTogether(once)).toBe(once);
  });
});
