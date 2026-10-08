import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import { addDays } from './dates';
import { simToday } from './market';
import { greeting, nextSipGroup, nextStep, QUIET_AFTER_STOP_DAYS, quietRestart, recentlyStopped, statusLine, upcomingSips } from './nextStep';

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
    // Riya hasn't picked a cushion fund, so the plan flow asks her to (Stage 7a).
    expect(n.to).toBe('/invest/plan');
    expect(n.body).toBe('₹2,000 a month into liquid funds completes your plan. You pick the fund next.');
    // Once picked, the button goes straight to that fund.
    const picked = run(riya, { type: 'pickPlanFund', role: 'cushion', fundId: 'liquid2' });
    expect(nextStep(picked).to).toBe('/invest/liquid2?amount=2000');
    expect(nextStep(picked).body).toBe('₹2,000 a month into Liquid Fund – B completes your plan.');
  });
  it('plan with one part, no SIPs → names the category, not a fund', () => {
    const s = withCheckin(fresh(), { purpose: 'cushion' });
    expect(nextStep(s).body).toBe('₹4,000 a month into liquid funds. You pick the fund next.');
  });
  it('all buckets running → You’re set with the next SIP date', () => {
    let s = withCheckin(fresh());
    s = startSip(s, 'liquid1', 2000);
    s = startSip(s, 'index50', 2000);
    const n = nextStep(s);
    expect(n.kind).toBe('set');
    // Both SIPs fall on the same date, so both are named (QA #29).
    expect(n.title).toMatch(/^You’re set\. Next SIPs on \d+ \w{3}$/);
    expect(n.body).toBe('₹2,000 into Liquid Fund – A and ₹2,000 into Nifty 50 Index Fund. Nothing to do today.');
    expect(nextSipGroup(s).map((u) => u.sip.fundId)).toEqual(['liquid1', 'index50']);
  });
  it('a stopped SIP does not count as running: after the quiet period its part is offered again', () => {
    let s = withCheckin(fresh());
    s = startSip(s, 'liquid1', 2000);
    s = startSip(s, 'index50', 2000);
    s = run(s, { type: 'stopSip', sipId: 'sip_2', reason: 'none' });
    s = advance(s, 5, 'normal'); // 35 simulated days
    expect(nextStep(s).kind).toBe('second_bucket');
  });
});

/** Moves a stop back in time so the day counts are exact (weekly advances can't land on day 29/30). */
const stoppedDaysAgo = (state: ReturnType<typeof fresh>, sipId: string, days: number) => ({
  ...state,
  sips: state.sips.map((x) => (x.id === sipId ? { ...x, stoppedAt: addDays(simToday(state.market), -days) } : x)),
});

describe('after a stop: 30 quiet simulated days (owner decision)', () => {
  const twoSips = () => startSip(startSip(withCheckin(fresh()), 'liquid1', 2000), 'index50', 2000);
  const stoppedOne = () => run(twoSips(), { type: 'stopSip', sipId: 'sip_2', reason: 'market_fell' });

  it('the Next-step card skips “Set up your … SIP” for the stopped part and moves on to the next item', () => {
    const s = stoppedOne();
    expect(recentlyStopped(s).map((b) => b.category)).toEqual(['index50']);
    const n = nextStep(s);
    expect(n.kind).toBe('set');
    expect(n.title).not.toMatch(/Set up your/);
    expect(n.title).toMatch(/^You’re set\. Next SIP on /); // the running part's next date
  });
  it('shows one quiet line with a small link to restart that part', () => {
    const q = quietRestart(stoppedOne())!;
    expect(q.text).toBe('One part of your plan isn’t running. Restart any time.');
    expect(q.linkText).toBe('Restart');
    expect(q.to).toBe('/invest/index50?amount=2000');
  });
  it('is quiet through day 29 and returns on day 30 (the card is back, the line is gone)', () => {
    const s = stoppedOne();
    const d29 = stoppedDaysAgo(s, 'sip_2', QUIET_AFTER_STOP_DAYS - 1);
    expect(nextStep(d29).kind).toBe('set');
    expect(quietRestart(d29)).not.toBeNull();
    const d30 = stoppedDaysAgo(s, 'sip_2', QUIET_AFTER_STOP_DAYS);
    expect(nextStep(d30)).toMatchObject({ kind: 'second_bucket', title: 'Set up your grow SIP' });
    expect(quietRestart(d30)).toBeNull();
  });
  it('real weeks: still quiet after 4 weeks (28 days), back after 5 (35 days)', () => {
    expect(nextStep(advance(stoppedOne(), 4, 'normal')).kind).toBe('set');
    expect(nextStep(advance(stoppedOne(), 5, 'normal')).kind).toBe('second_bucket');
  });
  it('restarting the SIP clears it: no line, the part is running again', () => {
    let s = stoppedOne();
    s = startSip(s, 'index50', 2000);
    expect(quietRestart(s)).toBeNull();
    expect(recentlyStopped(s)).toEqual([]);
    expect(nextStep(s).kind).toBe('set');
  });
  it('a part that was never started still gets its card, even while another part is quiet', () => {
    // Plan has two parts; only the grow part was ever started, and it was stopped.
    let s = startSip(withCheckin(fresh()), 'index50', 2000);
    s = run(s, { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    const n = nextStep(s);
    expect(n).toMatchObject({ kind: 'second_bucket', title: 'Set up your cushion SIP' });
    expect(quietRestart(s)!.text).toBe('One part of your plan isn’t running. Restart any time.');
  });
  it('both parts stopped: no restart card at all, a plural quiet line pointing at the whole plan', () => {
    const s = run(twoSips(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' }, { type: 'stopSip', sipId: 'sip_2', reason: 'none' });
    const n = nextStep(s);
    expect(n.kind).toBe('set');
    expect(n.title).toBe('You’re set');
    expect(n.body).toBe('No SIP is scheduled right now. What you own stays invested.');
    expect(quietRestart(s)).toMatchObject({ text: 'Two parts of your plan aren’t running. Restart any time.', to: '/invest/plan' });
    expect(statusLine(s)).toBe('No SIP is running right now. What you own stays invested.');
  });
  it('after the quiet period, with every part stopped, it reads as a restart (not a first SIP)', () => {
    const s = advance(
      run(twoSips(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' }, { type: 'stopSip', sipId: 'sip_2', reason: 'market_fell' }),
      5,
      'normal',
    );
    const n = nextStep(s);
    expect(n).toMatchObject({ kind: 'first_sip', to: '/invest/plan', cta: 'Restart my plan', title: 'Restart your plan whenever you like' });
    expect(n.body).toContain('stays invested');
    expect(n.title).not.toContain('first SIP');
    expect(quietRestart(s)).toBeNull();
  });
  it('a pause is not a stop: no quiet line, nothing changes for paused SIPs', () => {
    const s = run(twoSips(), { type: 'pauseSip', sipId: 'sip_2', months: 1 });
    expect(quietRestart(s)).toBeNull();
    expect(recentlyStopped(s)).toEqual([]);
  });
  it('never pushes: the line is plain, with no urgency or advice words', () => {
    const q = quietRestart(stoppedOne())!;
    for (const w of ['now!', 'hurry', 'don’t miss', 'last chance', 'best', 'should']) expect(q.text.toLowerCase()).not.toContain(w);
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
