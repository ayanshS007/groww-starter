import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  daysBetween,
  isISODate,
  monthsBetweenCeil,
  nextDateForDay,
  realToday,
} from './dates';

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-12-30', 7)).toBe('2027-01-06');
    expect(addDays('2026-03-10', -10)).toBe('2026-02-28');
  });
  it('adds months and clamps the day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
    expect(addYears('2026-10-07', 1)).toBe('2027-10-07');
  });
  it('counts days and months', () => {
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
    expect(monthsBetweenCeil('2026-10-07', '2027-04-07')).toBe(6);
    expect(monthsBetweenCeil('2026-10-07', '2027-04-08')).toBe(7);
    expect(monthsBetweenCeil('2026-10-07', '2026-10-20')).toBe(1);
  });
  it('finds the next date for a day of month', () => {
    expect(nextDateForDay('2026-10-07', 10)).toBe('2026-10-10');
    expect(nextDateForDay('2026-10-07', 7)).toBe('2026-10-07');
    expect(nextDateForDay('2026-10-07', 4)).toBe('2026-11-04');
    expect(nextDateForDay('2026-12-20', 4)).toBe('2027-01-04');
  });
  it('validates ISO dates', () => {
    expect(isISODate('2026-10-07')).toBe(true);
    expect(isISODate('7 Oct')).toBe(false);
    expect(isISODate(42)).toBe(false);
  });
  it('turns a local Date into an ISO day', () => {
    expect(realToday(new Date(2026, 9, 7, 23, 30))).toBe('2026-10-07');
  });
});
