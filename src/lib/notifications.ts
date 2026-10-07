// Calm, event-based inbox (README 8.12, PLAN items 18, 37). Derived from
// state only, with deterministic ids so read state survives reloads.
import { getFund } from '../data/funds';
import type { ISODate, NotifKind, State } from '../state/types';
import { nextDueDate } from './activity';
import { daysBetween } from './dates';
import { dateLabel, formatINR } from './format';
import { goalProgress, GOAL_THRESHOLDS } from './goals';
import { navSeries, simDate, simToday } from './market';
import { earnedMilestones, MILESTONE_COPY } from './milestones';

export type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  at: ISODate;
  week: number;
  route: string;
  read: boolean;
};

const fundName = (id?: string) => (id ? getFund(id)?.name ?? 'your fund' : 'your fund');

/** Goal value at each week, from linked funds' units in the activity log. */
function goalValueByWeek(state: State, sipIds: string[]): number[] {
  const funds = new Set(state.sips.filter((s) => sipIds.includes(s.id)).map((s) => s.fundId as string));
  const { week, history } = state.market;
  const navs = new Map([...funds].map((f) => [f, navSeries(f, history)]));
  const units = new Map<string, number>();
  const out: number[] = [];
  for (let w = 0; w <= week; w++) {
    for (const a of state.activity) {
      if (a.week !== w || !a.assetId || !funds.has(a.assetId) || a.units === undefined) continue;
      const sign = a.kind === 'redeem' ? -1 : a.kind === 'sip_instalment' || a.kind === 'one_time' ? 1 : 0;
      units.set(a.assetId, (units.get(a.assetId) ?? 0) + sign * a.units);
    }
    let v = 0;
    for (const [f, u] of units) v += u * (navs.get(f)?.[w] ?? 0);
    out.push(v);
  }
  return out;
}

export function deriveNotifications(state: State): Notification[] {
  const today = simToday(state.market);
  const { week, startDate } = state.market;
  const at = (w: number) => simDate(startDate, w);
  const list: Omit<Notification, 'read'>[] = [];

  for (const sip of state.sips) {
    if (sip.status !== 'active' || sip.skipNext) continue;
    const due = nextDueDate(sip, today);
    const days = daysBetween(today, due);
    if (days >= 0 && days <= 2) {
      list.push({
        id: `sip_due:${sip.id}:${due}`,
        kind: 'sip_due',
        title: days === 0 ? 'SIP due today' : `SIP due in ${days} day${days === 1 ? '' : 's'}`,
        body: `${formatINR(sip.amount)} into ${fundName(sip.fundId)} on ${dateLabel(due, { short: true })}. Skip it free if you need to.`,
        at: today,
        week,
        route: `/portfolio/sip/${sip.id}`,
      });
    }
  }

  for (const a of state.activity) {
    if (a.kind === 'sip_instalment') {
      list.push({
        id: `sip_done:${a.id}`,
        kind: 'sip_done',
        title: 'Instalment done',
        body: `${formatINR(a.amount ?? 0)} went into ${fundName(a.assetId)}.`,
        at: a.at,
        week: a.week,
        route: a.sipId ? `/portfolio/sip/${a.sipId}` : '/portfolio',
      });
    } else if (a.kind === 'sip_skipped' || a.kind === 'sip_paused') {
      list.push({
        id: `sip_skipped_paused:${a.id}`,
        kind: 'sip_skipped_paused',
        title: a.kind === 'sip_skipped' ? 'Instalment skipped' : 'SIP paused',
        body:
          a.kind === 'sip_skipped'
            ? `You skipped ${formatINR(a.amount ?? 0)} for ${fundName(a.assetId)}. Your plan is still on.`
            : `${fundName(a.assetId)} is paused. It restarts on its own.`,
        at: a.at,
        week: a.week,
        route: a.sipId ? `/portfolio/sip/${a.sipId}` : '/portfolio',
      });
    }
  }

  if (week >= 1 && state.holdings.some((h) => h.createdWeek < week)) {
    list.push({
      id: `insight:${week}`,
      kind: 'insight_ready',
      title: 'Your weekly insight is ready',
      body: 'A short note on what moved this week and whether it matters.',
      at: today,
      week,
      route: '/portfolio',
    });
  }

  for (const goal of state.goals) {
    const values = goalValueByWeek(state, goal.sipIds);
    for (const t of GOAL_THRESHOLDS) {
      const w = values.findIndex((v) => goalProgress(goal.target, v).pct >= t);
      if (w < 0) continue;
      list.push({
        id: `goal:${goal.id}:${t}`,
        kind: 'goal_progress',
        title: t === 100 ? `${goal.name}: target reached` : `${goal.name}: ${t}% there`,
        body: `You’ve put aside ${t}% of ${formatINR(goal.target)}.`,
        at: at(w),
        week: w,
        route: `/portfolio/goal/${goal.id}`,
      });
    }
  }

  for (const m of earnedMilestones(state)) {
    list.push({
      id: `milestone:${m.id}`,
      kind: 'milestone',
      title: MILESTONE_COPY[m.id].title,
      body: MILESTONE_COPY[m.id].body,
      at: at(m.week),
      week: m.week,
      route: '/home',
    });
  }

  if (state.user.kyc === 'in_progress') {
    list.push({
      id: 'kyc_pending',
      kind: 'kyc_pending',
      title: 'Verification not finished',
      body: 'Pick up where you left off. It takes about 2 minutes.',
      at: today,
      week,
      route: `/kyc/${state.kycProgress?.step ?? 1}`,
    });
  }

  return list
    .filter((n) => state.prefs.notif[n.kind])
    .map((n) => ({ ...n, read: state.readNotifications.includes(n.id) }))
    .sort((a, b) => (a.at === b.at ? b.week - a.week : a.at < b.at ? 1 : -1));
}

/** "Today" means created in the current simulated week (PLAN item 18). */
export function groupNotifications(list: Notification[], currentWeek: number): { today: Notification[]; earlier: Notification[] } {
  return {
    today: list.filter((n) => n.week === currentWeek),
    earlier: list.filter((n) => n.week !== currentWeek),
  };
}

export function unreadCount(state: State): number {
  return deriveNotifications(state).filter((n) => !n.read).length;
}
