// Formatting for money, percentages and dates (en-IN conventions).
import type { ISODate } from '../state/types';
import { parseISO } from './dates';

export const MINUS = '−'; // typographic minus, read correctly by screen readers

/** Indian digit grouping: 1234567 → "12,34,567". Input must be a non-negative integer string. */
function groupIndian(intDigits: string): string {
  if (intDigits.length <= 3) return intDigits;
  const last3 = intDigits.slice(-3);
  const rest = intDigits.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

function roundAbs(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(Math.abs(n) * f + Number.EPSILON) / f;
}

/** ₹ with Indian grouping. formatINR(100000) → "₹1,00,000"; negatives use a minus sign. */
export function formatINR(n: number, decimals = 0): string {
  const abs = roundAbs(n, decimals);
  const [int, frac] = abs.toFixed(decimals).split('.');
  const body = '₹' + groupIndian(int) + (frac ? '.' + frac : '');
  return n < 0 && abs !== 0 ? MINUS + body : body;
}

/** Percentage, one decimal by default. formatPct(-4.25) → "−4.3%". */
export function formatPct(n: number, decimals = 1): string {
  const abs = roundAbs(n, decimals);
  const body = abs.toFixed(decimals) + '%';
  return n < 0 && abs !== 0 ? MINUS + body : body;
}

/** Always shows a sign for non-zero values: "+₹200", "−₹200", "₹0"; or "+1.2%". */
export function formatSigned(n: number, kind: 'inr' | 'pct' = 'inr', decimals?: number): string {
  const text = kind === 'inr' ? formatINR(n, decimals ?? 0) : formatPct(n, decimals ?? 1);
  if (text.startsWith(MINUS)) return text;
  const isZero = kind === 'inr' ? roundAbs(n, decimals ?? 0) === 0 : roundAbs(n, decimals ?? 1) === 0;
  return isZero ? text : '+' + text;
}

/** "9876543210" → "••••••3210". */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return '•'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-07" → "7 Oct 2026"; with { short: true } → "7 Oct". */
export function dateLabel(iso: ISODate, opts: { short?: boolean } = {}): string {
  const d = parseISO(iso);
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return opts.short ? base : `${base} ${d.getUTCFullYear()}`;
}

/** 4 → "4th", 1 → "1st", 22 → "22nd". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** Units are shown with up to 3 decimals. */
export function formatUnits(n: number): string {
  return (Math.round(n * 1000) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 });
}
