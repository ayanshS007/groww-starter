import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { advance, fresh, oneTime, run, startSip, TODAY, withCheckin } from '../test/fixtures';
import {
  activityRows,
  allocation,
  chartPoints,
  hasDashboardData,
  healthLink,
  latestDip,
  monthSips,
  periodPoints,
  splitLine,
} from './dashboard';
import { portfolioValue } from './market';
import { planHealth } from './planHealth';
import { parseHash, resolveRoute } from './routes';

const riya = () => buildPersona('riya', TODAY);

describe('chartPoints (value vs invested)', () => {
  it('is empty before any money goes in', () => {
    expect(chartPoints(fresh())).toEqual([]);
    expect(hasDashboardData(fresh())).toBe(false);
  });
  it('starts at the first investment week and runs to the current week', () => {
    const s = riya();
    const pts = chartPoints(s);
    expect(pts[0].week).toBe(1);
    expect(pts[pts.length - 1].week).toBe(s.market.week);
    expect(pts[pts.length - 1].value).toBeCloseTo(portfolioValue(s), 6);
    expect(pts[0].move).toBe(0);
  });
  it('marks every down week, and the latest dip is the current sharp week', () => {
    const pts = chartPoints(riya());
    expect(pts.filter((p) => p.down).map((p) => p.week)).toEqual([3, 6, 9, 12]);
    expect(pts.every((p) => p.down === p.stayedInvested)).toBe(true);
    expect(latestDip(pts)?.week).toBe(12);
  });
  it('an up week is never marked as a dip, even when a SIP payment lands in it', () => {
    const s = advance(riya(), 1, 'up');
    expect(chartPoints(s).at(-1)!.down).toBe(false);
  });
  it('a week in which a SIP was stopped is a down week but not "You stayed invested"', () => {
    const s = run(riya(), { type: 'stopSip', sipId: 'sip_1', reason: 'market_fell' });
    const dip = latestDip(chartPoints(s))!;
    expect(dip.week).toBe(12);
    expect(dip.down).toBe(true);
    expect(dip.stayedInvested).toBe(false);
  });
  it('updates with every advanced week', () => {
    const before = chartPoints(riya()).length;
    expect(chartPoints(advance(riya(), 3)).length).toBe(before + 3);
  });
});

describe('periodPoints', () => {
  const pts = Array.from({ length: 20 }, (_, i) => i);
  it('keeps the last 4 or 12 weeks (plus the starting point) or everything', () => {
    expect(periodPoints(pts, '4w')).toEqual([15, 16, 17, 18, 19]);
    expect(periodPoints(pts, '12w')).toHaveLength(13);
    expect(periodPoints(pts, 'all')).toHaveLength(20);
    expect(periodPoints([1, 2], '12w')).toEqual([1, 2]);
  });
});

describe('allocation and plan split', () => {
  it('Riya holds only grow funds', () => {
    const { total, slices } = allocation(riya());
    expect(slices.map((s) => s.id)).toEqual(['cushion', 'grow', 'stocks', 'gold']);
    expect(slices.find((s) => s.id === 'grow')!.value).toBeCloseTo(total, 6);
    expect(splitLine(riya())).toBe('Plan split: 50 / 50 · Actual: 0 / 100');
  });
  it('splits cushion, grow, stocks and gold, and the parts add up', () => {
    let s = oneTime(withCheckin(fresh()), 'liquid1', 3000);
    s = oneTime(s, 'gold1', 1000);
    s = oneTime(s, 'index50', 2000);
    s = run(s, { type: 'buyStock', stockId: 'stk_pinecrest', shares: 2, orderType: 'market' });
    const { total, slices } = allocation(s);
    for (const sl of slices) expect(sl.value).toBeGreaterThan(0);
    expect(slices.reduce((a, b) => a + b.value, 0)).toBeCloseTo(total, 6);
    expect(slices.reduce((a, b) => a + b.pct, 0)).toBeCloseTo(100, 6);
    const [, actual] = splitLine(s).split('Actual: ');
    const [c, g] = actual.split(' / ').map(Number);
    expect(c + g).toBe(100);
    expect(c).toBe(Math.round((slices[0].value / total) * 100));
  });
  it('QA #17: Meera’s goal money is "Goal savings" in the donut, but liquid like her plan in the split line', () => {
    const m = buildPersona('meera', '2026-10-07');
    const { slices } = allocation(m);
    expect(slices.map((x) => x.id)).toEqual(['cushion', 'goals', 'grow', 'stocks', 'gold']);
    expect(slices.find((x) => x.id === 'cushion')!.value).toBe(0);
    expect(slices.find((x) => x.id === 'goals')!.pct).toBeCloseTo(100, 6);
    expect(splitLine(m)).toBe('Plan split: 100 / 0 · Actual: 100 / 0');
  });
  it('without a plan it shows only the actual split', () => {
    const s = oneTime(fresh(), 'liquid1', 500);
    expect(splitLine(s)).toBe('Actual: 100 / 0 (cushion / grow)');
  });
});

describe("this month's SIPs", () => {
  it('Riya: the 16th is upcoming, then done after three weeks', () => {
    expect(monthSips(riya()).map((r) => [r.date, r.status])).toEqual([['2026-10-16', 'upcoming']]);
    expect(monthSips(advance(riya(), 3)).map((r) => [r.date, r.status])).toEqual([['2026-10-16', 'done']]);
  });
  it('a skipped instalment shows as skipped before and after its date', () => {
    const s = run(riya(), { type: 'skipNext', sipId: 'sip_1' });
    expect(monthSips(s)[0].status).toBe('skipped');
    expect(monthSips(advance(s, 2))[0].status).toBe('skipped');
  });
  it('a paused SIP shows its dates as paused, before and after they pass', () => {
    const s = run(riya(), { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    expect(monthSips(s)[0].status).toBe('paused');
    expect(monthSips(advance(s, 2))[0].status).toBe('paused');
  });
  it('stopped SIPs have no upcoming dates', () => {
    const s = run(riya(), { type: 'stopSip', sipId: 'sip_1', reason: 'none' });
    expect(monthSips(s)).toEqual([]);
  });
  it('a new SIP shows its first payment as done', () => {
    const s = startSip(withCheckin(fresh()), 'liquid1', 500, 28);
    const rows = monthSips(s);
    expect(rows.some((r) => r.status === 'done')).toBe(true);
  });
});

describe('activity rows', () => {
  it('newest first, with a status for every row', () => {
    const rows = activityRows(advance(riya(), 3));
    expect(rows[0].date).toBe('2026-10-16');
    expect(rows[0]).toMatchObject({ what: 'SIP instalment', status: 'Done', amount: 2000, asset: 'Nifty 50 Index Fund' });
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].date >= rows[i].date).toBe(true);
  });
  it('pauses and stops have no amount; an automatic resume says so', () => {
    let s = run(riya(), { type: 'pauseSip', sipId: 'sip_1', months: 1 });
    s = advance(s, 6);
    const rows = activityRows(s);
    const paused = rows.find((r) => r.what === 'SIP paused')!;
    expect(paused.amount).toBeUndefined();
    expect(rows.some((r) => r.what === 'SIP restarted on its own')).toBe(true);
  });
});

describe('plan health links go to the screen that fixes each check', () => {
  it('cushion → Payday Split, stocks → Stock budget, and every link resolves to a screen', () => {
    const s = riya();
    const [cushion, horizon, stocks, sips] = planHealth(s);
    expect(healthLink(cushion)).toEqual({ to: '/payday', label: 'Top up cushion' });
    expect(healthLink(stocks)).toEqual({ to: '/you/trading', label: 'Stock budget' });
    expect(healthLink(horizon)).toEqual({ to: '/plan', label: 'See my plan' });
    // QA #30: Riya's cushion SIP was never set up, so the SIPs row points to it.
    expect(healthLink(sips)).toEqual({ to: '/invest/plan', label: 'Set it up' });
    for (const c of planHealth(s)) expect(resolveRoute(parseHash('#' + healthLink(c).to), s).kind).toBe('screen');
  });
});
