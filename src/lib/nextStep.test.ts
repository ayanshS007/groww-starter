import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import { greeting, nextStep, statusLine, upcomingSips } from './nextStep';

describe('Next-step card (PLAN C6)', () => {
  it('no account → check-in via sign-up', () => {
    const n = nextStep(fresh());
    expect(n.kind).toBe('checkin');
    expect(n.to).toBe('/signup?next=%2Fcheckin%2F1');
  });
  it('a started check-in resumes at the first unanswered step', () => {
    const s = run(fresh(), { type: 'signUp', mobile: '9876543210', name: 'R' }, {
      type: 'saveCheckinAnswer',
      answers: { incomeType: 'salary', incomeBand: 'lt10k', cushion: 'no' },
    });
    const n = nextStep(s);
    expect(n).toMatchObject({ kind: 'checkin', to: '/checkin/3', cta: 'Continue check-in' });
  });
  it('plan, no SIPs → first SIP with verification included; KYC is never its own step', () => {
    const n = nextStep(withCheckin(fresh()));
    expect(n).toMatchObject({ kind: 'first_sip', to: '/invest/plan', title: 'Start your first SIP (quick verification included)' });
  });
  it('one of two buckets running → set up the missing one (Riya: cushion)', () => {
    const riya = buildPersona('riya', TODAY);
    const n = nextStep(riya);
    expect(n.kind).toBe('second_bucket');
    expect(n.title).toBe('Set up your cushion SIP');
    expect(n.to).toBe('/invest/liquid1?amount=2000');
  });
  it('all buckets running → You’re set with the next SIP date', () => {
    let s = withCheckin(fresh());
    s = startSip(s, 'liquid1', 2000);
    s = startSip(s, 'index50', 2000);
    const n = nextStep(s);
    expect(n.kind).toBe('set');
    expect(n.title).toMatch(/^You’re set\. Next SIP on \d+ \w{3}$/);
  });
  it('a stopped SIP does not count as running', () => {
    let s = withCheckin(fresh());
    s = startSip(s, 'liquid1', 2000);
    s = startSip(s, 'index50', 2000);
    s = run(s, { type: 'stopSip', sipId: 'sip_2', reason: 'none' });
    expect(nextStep(s).kind).toBe('second_bucket');
  });
});

describe('after stopping every SIP in the plan', () => {
  it('reads as a restart, not a first SIP, and says what stays invested', () => {
    let s = withCheckin(fresh());
    s = startSip(s, 'liquid1', 2000);
    s = startSip(s, 'index50', 2000);
    s = run(s, { type: 'stopSip', sipId: 'sip_1', reason: 'none' }, { type: 'stopSip', sipId: 'sip_2', reason: 'market_fell' });
    const n = nextStep(s);
    expect(n).toMatchObject({ kind: 'first_sip', to: '/invest/plan', cta: 'Restart my plan', title: 'Restart your plan whenever you like' });
    expect(n.body).toContain('stays invested');
    expect(n.title).not.toContain('first SIP');
  });
});

describe('upcoming SIPs', () => {
  it('lists active SIPs by next date and moves past a skipped one', () => {
    let s = startSip(fresh(), 'index50', 1000, 20);
    s = advance(s, 1);
    const [first] = upcomingSips(s);
    expect(first.skippedDate).toBeUndefined();
    const skipped = upcomingSips(run(s, { type: 'skipNext', sipId: 'sip_1' }))[0];
    expect(skipped.skippedDate).toBe(first.date);
    expect(skipped.date > first.date).toBe(true);
  });
  it('leaves out paused SIPs', () => {
    const s = run(startSip(fresh(), 'index50', 1000), { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    expect(upcomingSips(s)).toEqual([]);
  });
});

describe('status line and greeting', () => {
  it('describes each state in one line', () => {
    expect(statusLine(fresh())).toBe('You’re looking around. No account needed.');
    expect(statusLine(withCheckin(fresh()))).toBe('Your starter plan is ready: ₹4,000 a month.');
    expect(statusLine(buildPersona('riya', TODAY))).toBe('1 of 2 SIPs in your plan are running.');
  });
  it('greets by first name and time of day', () => {
    expect(greeting('Riya Sharma', 9)).toBe('Good morning, Riya');
    expect(greeting(undefined, 20)).toBe('Good evening');
  });
});
