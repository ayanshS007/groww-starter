// Date helpers for the simulated calendar. All dates are ISO 'YYYY-MM-DD' in UTC,
// so results never depend on the viewer's time zone.
import type { ISODate } from '../state/types';

const DAY_MS = 86_400_000;

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isISODate(v: unknown): v is ISODate {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISO(v).getTime());
}

/** Real today as an ISO date. Only used to seed market.startDate. */
export function realToday(now: Date = new Date()): ISODate {
  return toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISO(new Date(parseISO(iso).getTime() + days * DAY_MS));
}

/** Adds calendar months, clamping the day to the target month's length. */
export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseISO(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return toISO(target);
}

export function addYears(iso: ISODate, years: number): ISODate {
  return addMonths(iso, years * 12);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY_MS);
}

export function dayOfMonth(iso: ISODate): number {
  return parseISO(iso).getUTCDate();
}

/** Next date on or after `from` whose day of month is `day` (1–28). */
export function nextDateForDay(from: ISODate, day: number): ISODate {
  const d = parseISO(from);
  const sameMonth = toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), day)));
  return sameMonth >= from ? sameMonth : toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, day)));
}

/** Whole calendar months from a to b; a partial month counts as a month. */
export function monthsBetweenCeil(a: ISODate, b: ISODate): number {
  const da = parseISO(a);
  const db = parseISO(b);
  let months = (db.getUTCFullYear() - da.getUTCFullYear()) * 12 + (db.getUTCMonth() - da.getUTCMonth());
  if (db.getUTCDate() > da.getUTCDate()) months += 1;
  return months;
}
