// Milestone cards (README 8.10, PLAN item 36). Counts instalments; skips and
// pauses never reset anything. No streaks, no confetti.
import type { State } from '../state/types';
import { scenarioMove } from './market';

export type MilestoneId = 'first_investment' | 'instalments_3' | 'instalments_6' | 'instalments_12' | 'first_dip';

export const MILESTONE_ORDER: MilestoneId[] = ['first_investment', 'instalments_3', 'first_dip', 'instalments_6', 'instalments_12'];

export const MILESTONE_COPY: Record<MilestoneId, { title: string; body: string }> = {
  first_investment: { title: 'Your first investment is in', body: 'You started. Everything after this is just showing up.' },
  instalments_3: { title: '3 instalments made', body: 'Three months of putting money aside. Skips never undo this.' },
  instalments_6: { title: '6 instalments made', body: 'Half a year of investing, at your own pace.' },
  instalments_12: { title: '12 instalments made', body: 'A full year of instalments. That’s a real habit.' },
  first_dip: { title: 'You stayed invested through your first dip', body: 'Markets fell for a week and you kept your plan. That’s the hard part.' },
};

export type EarnedMilestone = { id: MilestoneId; week: number };

const INVEST_KINDS = new Set(['sip_instalment', 'one_time', 'buy']);

/** Earned milestones with the simulated week each was earned in. */
export function earnedMilestones(state: Pick<State, 'activity' | 'market'>): EarnedMilestone[] {
  const out: EarnedMilestone[] = [];
  const invests = state.activity.filter((a) => INVEST_KINDS.has(a.kind));
  if (invests.length === 0) return out;
  const firstWeek = Math.min(...invests.map((a) => a.week));
  out.push({ id: 'first_investment', week: firstWeek });

  const instalments = state.activity.filter((a) => a.kind === 'sip_instalment');
  for (const n of [3, 6, 12] as const) {
    if (instalments.length >= n) out.push({ id: `instalments_${n}`, week: instalments[n - 1].week });
  }

  const stoppedWeeks = new Set(state.activity.filter((a) => a.kind === 'sip_stopped').map((a) => a.week));
  const { history, week } = state.market;
  for (let k = firstWeek + 1; k <= week; k++) {
    const s = history[k - 1];
    if (s && scenarioMove(s) < 0 && !stoppedWeeks.has(k)) {
      out.push({ id: 'first_dip', week: k });
      break;
    }
  }
  return out.sort((a, b) => MILESTONE_ORDER.indexOf(a.id) - MILESTONE_ORDER.indexOf(b.id));
}

/** The next milestone card to show on Home, or null. Each shows once. */
export function nextUnseen(state: Pick<State, 'activity' | 'market' | 'seenMilestones'>): MilestoneId | null {
  return earnedMilestones(state).find((m) => !state.seenMilestones.includes(m.id))?.id ?? null;
}
