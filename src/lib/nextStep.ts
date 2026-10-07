// Home's single Next-step card and status line (README 9 item 5 as changed by
// PLAN C6), plus the upcoming-SIP list used by Home and the sidebar plan card.
import { getFund } from '../data/funds';
import type { ISODate, PlanBucket, Sip, State } from '../state/types';
import { nextDueDate } from './activity';
import { firstUnansweredStep, isCheckinStarted } from './checkin';
import { addDays, daysBetween, nextDateForDay } from './dates';
import { dateLabel, formatINR } from './format';
import { simToday } from './market';
import { hasLiveSip } from './planStatus';
import { buildPath } from './routes';

export type NextStep =
  | { kind: 'checkin'; title: string; body: string; cta: string; to: string }
  | { kind: 'first_sip'; title: string; body: string; cta: string; to: string }
  | { kind: 'second_bucket'; title: string; body: string; cta: string; to: string; bucket: PlanBucket }
  | { kind: 'set'; title: string; body: string; cta: string; to: string };

export type UpcomingSip = {
  sip: Sip;
  /** Date money next leaves the account. */
  date: ISODate;
  /** Set when the instalment before `date` is being skipped. */
  skippedDate?: ISODate;
};

/** Active SIPs with their next debit date, earliest first. Paused and stopped SIPs are left out. */
export function upcomingSips(state: Pick<State, 'sips' | 'market'>): UpcomingSip[] {
  const today = simToday(state.market);
  const out: UpcomingSip[] = [];
  for (const sip of state.sips) {
    if (sip.status !== 'active') continue;
    // Strictly after today: today's instalment, if any, was posted with the week.
    const due = nextDueDate(sip, addDays(today, 1));
    if (sip.skipNext) out.push({ sip, date: nextDateForDay(addDays(due, 1), sip.dayOfMonth), skippedDate: due });
    else out.push({ sip, date: due });
  }
  return out.sort((a, b) => (a.date === b.date ? a.sip.id.localeCompare(b.sip.id) : a.date < b.date ? -1 : 1));
}

/** For this many simulated days after a stop, the plan's missing part is not pushed (PLAN C6, owner decision). */
export const QUIET_AFTER_STOP_DAYS = 30;

/**
 * Plan parts the user stopped within the last 30 simulated days and has not
 * restarted. Home leaves these out of the Next-step card and mentions them once, quietly.
 */
export function recentlyStopped(state: Pick<State, 'plan' | 'sips' | 'market'>): PlanBucket[] {
  if (!state.plan) return [];
  const today = simToday(state.market);
  return state.plan.buckets.filter((b) => {
    if (hasLiveSip(state.sips, b.fundId)) return false;
    const stops = state.sips.filter((s) => s.fundId === b.fundId && s.status === 'stopped' && s.stoppedAt).map((s) => s.stoppedAt!);
    if (stops.length === 0) return false;
    const last = stops.reduce((a, c) => (c > a ? c : a));
    return daysBetween(last, today) < QUIET_AFTER_STOP_DAYS;
  });
}

export type QuietRestart = { text: string; linkText: string; to: string };

/** The one quiet line on Home while a recently stopped part is being left alone. */
export function quietRestart(state: Pick<State, 'plan' | 'sips' | 'market'>): QuietRestart | null {
  const parts = recentlyStopped(state);
  if (parts.length === 0) return null;
  return {
    text:
      parts.length === 1
        ? 'One part of your plan isn’t running. Restart any time.'
        : 'Two parts of your plan aren’t running. Restart any time.',
    linkText: 'Restart',
    to: parts.length === 1 ? buildPath(`/invest/${parts[0].fundId}`, { amount: String(parts[0].amount) }) : '/invest/plan',
  };
}

const ROLE_WORD = { cushion: 'cushion', grow: 'grow' } as const;

export function nextStep(state: State): NextStep {
  if (!state.plan || !state.checkin) {
    const started = isCheckinStarted(state.checkinDraft);
    const step = started ? firstUnansweredStep(state.checkinDraft) : 1;
    const checkinPath = `/checkin/${step}`;
    return {
      kind: 'checkin',
      title: started ? 'Finish your money check-in' : 'Start with a 2-minute money check-in',
      body: started
        ? 'Your answers are saved. Pick up where you left off.'
        : 'Six quick questions. You get a starter shortlist based on your answers.',
      cta: started ? 'Continue check-in' : 'Take the check-in',
      to: state.user.signedUp ? checkinPath : buildPath('/signup', { next: checkinPath }),
    };
  }

  const buckets = state.plan.buckets;
  const missing = buckets.filter((b) => !hasLiveSip(state.sips, b.fundId));
  // A part stopped in the last 30 days is not pushed: skip it and move on to the next item.
  const quiet = new Set(recentlyStopped(state).map((b) => b.fundId));
  const due = missing.filter((b) => !quiet.has(b.fundId));

  if (due.length === buckets.length) {
    // Every SIP in the plan was stopped (and the quiet period is over): a restart, not a first SIP.
    const restart = state.sips.length > 0;
    return {
      kind: 'first_sip',
      title: restart ? 'Restart your plan whenever you like' : 'Start your first SIP (quick verification included)',
      body: restart
        ? `What you already own stays invested. Set up ${formatINR(state.plan.monthly)} a month again, in one go.`
        : buckets.length > 1
          ? `Both parts of your plan, ${formatINR(state.plan.monthly)} a month, set up in one go.`
          : `${formatINR(state.plan.monthly)} a month into ${getFund(buckets[0].fundId)?.name ?? 'your fund'}.`,
      cta: restart ? 'Restart my plan' : 'Start my plan',
      to: '/invest/plan',
    };
  }

  if (due.length > 0) {
    const b = due[0];
    const fund = getFund(b.fundId);
    return {
      kind: 'second_bucket',
      title: `Set up your ${ROLE_WORD[b.role]} SIP`,
      body: `${formatINR(b.amount)} a month into ${fund?.name ?? 'your fund'} completes your plan.`,
      cta: `Set up ${formatINR(b.amount)} a month`,
      to: buildPath(`/invest/${b.fundId}`, { amount: String(b.amount) }),
      bucket: b,
    };
  }

  const next = upcomingSips(state)[0];
  return {
    kind: 'set',
    title: next ? `You’re set. Next SIP on ${dateLabel(next.date, { short: true })}` : 'You’re set',
    body: next
      ? `${formatINR(next.sip.amount)} into ${getFund(next.sip.fundId)?.name ?? 'your fund'}. Nothing to do today.`
      : state.sips.some((x) => x.status === 'paused')
        ? 'Your SIPs are paused for now. Resume any time from Portfolio.'
        : 'No SIP is scheduled right now. What you own stays invested.',
    cta: 'See my portfolio',
    to: '/portfolio',
  };
}

/** One short line under the greeting. */
export function statusLine(state: State): string {
  if (!state.user.signedUp && !state.plan) return 'You’re looking around. No account needed.';
  if (!state.plan) return 'Answer six quick questions to get your starter shortlist.';
  const live = state.plan.buckets.filter((b) => hasLiveSip(state.sips, b.fundId)).length;
  const total = state.plan.buckets.length;
  if (live === 0 && state.sips.length > 0) return 'No SIP is running right now. What you own stays invested.';
  if (live === 0) return `Your starter plan is ready: ${formatINR(state.plan.monthly)} a month.`;
  if (live < total) return `${live} of ${total} SIPs in your plan are running.`;
  const paused = state.sips.filter((s) => s.status === 'paused').length;
  if (paused > 0) return `Your plan is set. ${paused} SIP${paused > 1 ? 's are' : ' is'} paused for now.`;
  return 'Your plan is running. Nothing needs you today.';
}

/** "Good morning" style greeting with the user's first name, if known. */
export function greeting(name: string | undefined, hour: number): string {
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}
