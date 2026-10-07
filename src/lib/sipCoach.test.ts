import { describe, expect, it } from 'vitest';
import type { Sip } from '../state/types';
import { coachFor, COACH_REASONS, type CoachReason } from './sipCoach';

const sip = (patch: Partial<Sip> = {}): Sip => ({
  id: 'sip_1',
  fundId: 'index50',
  amount: 2000,
  dayOfMonth: 4,
  status: 'active',
  skipNext: false,
  instalments: 3,
  createdAt: '2026-07-01',
  createdWeek: 0,
  ...patch,
});

const ids = (reason: CoachReason | null, s = sip()) => coachFor(reason, s).options.map((o) => o.id);

describe('coachFor', () => {
  it('lists the five README reasons', () => {
    expect(COACH_REASONS.map((r) => r.label)).toEqual([
      'Market fell',
      'Money is tight',
      'I need the money',
      'Found a better fund',
      'Something else',
    ]);
  });
  it('before a reason: Keep my SIP + Stop anyway', () => {
    const c = coachFor(null, sip());
    expect(c.response).toBeNull();
    expect(c.options.map((o) => o.label)).toEqual(['Keep my SIP', 'Stop anyway']);
    expect(c.options[0].primary).toBe(true);
  });
  it.each([
    ['market_fell', ['keep_going', 'pause', 'stop_anyway']],
    ['money_tight', ['skip_next', 'lower_amount', 'pause', 'stop_anyway']],
    ['need_money', ['withdraw', 'stop_anyway']],
    ['better_fund', ['keep', 'stop_anyway']],
    ['other', ['pause', 'stop_anyway']],
  ] as const)('%s returns its options in order', (reason, expected) => {
    expect(ids(reason)).toEqual(expected);
  });
  it('labels match README 8.6', () => {
    expect(coachFor('market_fell', sip()).options.map((o) => o.label)).toEqual(['Keep going', 'Pause 1–3 months', 'Stop anyway']);
    expect(coachFor('money_tight', sip()).options.map((o) => o.label)).toEqual(['Skip next instalment', 'Lower amount', 'Pause', 'Stop anyway']);
    expect(coachFor('need_money', sip()).options.map((o) => o.label)).toEqual(['Go to Withdraw', 'Stop anyway']);
  });
  it('"Stop anyway" is always present, last and never the primary', () => {
    for (const status of ['active', 'paused'] as const) {
      for (const r of [null, ...COACH_REASONS.map((x) => x.id)]) {
        const opts = coachFor(r, sip({ status })).options;
        expect(opts.at(-1)).toMatchObject({ id: 'stop_anyway', label: 'Stop anyway', primary: false });
        expect(opts.filter((o) => o.id === 'stop_anyway')).toHaveLength(1);
        expect(opts.filter((o) => o.primary)).toHaveLength(1);
        expect(opts[0].primary).toBe(true);
      }
    }
  });
  it('on a paused SIP, Pause becomes "Keep it paused"', () => {
    const paused = sip({ status: 'paused', pausedUntil: '2026-11-01' });
    for (const r of ['market_fell', 'money_tight', 'other'] as const) {
      const labels = coachFor(r, paused).options.map((o) => o.label);
      expect(labels).toContain('Keep it paused');
      expect(labels).not.toContain('Pause');
      expect(labels).not.toContain('Pause 1–3 months');
    }
  });
  it('on a paused SIP, no "Skip next" or "Keep going" (QA #10)', () => {
    const paused = sip({ status: 'paused', pausedUntil: '2026-11-01' });
    expect(coachFor('market_fell', paused).options.map((o) => o.id)).toEqual(['keep_paused', 'resume', 'stop_anyway']);
    expect(coachFor('money_tight', paused).options.map((o) => o.id)).toEqual(['keep_paused', 'lower_amount', 'stop_anyway']);
    expect(coachFor('money_tight', paused).response).toContain('already paused');
    expect(coachFor('market_fell', paused).response).toContain('paused, so nothing is bought');
  });
  it('responses follow README 8.6', () => {
    const fell = coachFor('market_fell', sip(), { weekChange: { amount: -458, pct: -8 } }).response!;
    expect(fell).toContain('₹458');
    expect(fell).toContain('8.0%');
    expect(fell).toContain('buys more units');
    // An up or flat week: no "lower prices" claim.
    const up = coachFor('market_fell', sip(), { weekChange: { amount: 120, pct: 1.2 } }).response!;
    expect(up).toContain('+₹120');
    expect(up).not.toContain('while prices are lower');
    expect(up).toContain('more units when prices dip and fewer when they rise');
    expect(coachFor('money_tight', sip()).response).toBe('Skipping is free and keeps your plan alive.');
    const need = coachFor('need_money', sip()).response!;
    expect(need).toContain('doesn’t return any money');
    expect(need).toContain('1–3 working days');
  });
  it('better fund compares risk, horizon, minimum and expense ratio side by side', () => {
    const c = coachFor('better_fund', sip(), { otherFundId: 'flexi1' });
    expect(c.comparison?.rows.map((r) => r.label)).toEqual(['Risk', 'Time frame', 'Min SIP', 'Expense ratio']);
    expect(c.comparison?.rows[0]).toEqual({ label: 'Risk', current: '4 of 5', other: '5 of 5' });
    expect(coachFor('better_fund', sip()).comparison).toBeUndefined();
  });
});
