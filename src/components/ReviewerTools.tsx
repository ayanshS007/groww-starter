// Reviewer tools (README 9 item 20): scenarios, advance one week, simulate pay
// credit, load persona, jump links, reset. Shared by /review and the desktop right-edge panel.
import { useState } from 'react';
import { PERSONA_SEEDS } from '../data/personas';
import { realToday } from '../lib/dates';
import { dateLabel, formatINR, formatSigned } from '../lib/format';
import { jumpLinks } from '../lib/jumpLinks';
import { SCENARIO_MOVE, SCENARIOS, simToday } from '../lib/market';
import { defaultPay, validatePay } from '../lib/paydaySplit';
import { buildPath } from '../lib/routes';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import type { PersonaId, Scenario } from '../state/types';
import { AmountInput } from './AmountInput';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { useToast } from './Toast';

export const REVIEWER_NOTE = 'For reviewers. Not part of the user experience.';

const SCENARIO_NAME: Record<Scenario, string> = {
  normal: 'Normal week',
  dip_small: 'Small dip',
  dip_sharp: 'Sharp dip',
  up: 'Up week',
  flat: 'Flat week',
};

export function scenarioLabel(s: Scenario): string {
  return `${SCENARIO_NAME[s]} ${formatSigned(SCENARIO_MOVE[s] * 100, 'pct')}`;
}

/** "Simulate pay credit" (README 8.3, PLAN item 33): opens Payday Split with this amount. */
function PayCredit({ compact, onDone }: { compact: boolean; onDone?: () => void }) {
  const { state } = useStore();
  const toast = useToast();
  const [text, setText] = useState(String(defaultPay(state)));
  const [error, setError] = useState<string>();
  const H = compact ? 'h3' : 'h2';
  const go = () => {
    const v = validatePay(text);
    if (!v.ok) return setError(v.error);
    if (!state.plan) return setError('Payday Split needs a starter plan. Load a persona or take the check-in first.');
    navigate(buildPath('/payday', { pay: String(v.value) }));
    toast.show(`Pay credit of ${formatINR(v.value)} simulated.`);
    onDone?.();
  };
  return (
    <Card pad={compact ? 'sm' : 'md'}>
      <H className="text-base font-semibold text-ink">Simulate pay credit</H>
      <p className="mt-1 text-sm text-ink-muted">Pretend pay just arrived, then open Payday Split. No money moves.</p>
      <div className="mt-3">
        <AmountInput
          label="Pay received"
          value={text}
          onChange={(v) => {
            setText(v);
            setError(undefined);
          }}
          error={error}
        />
      </div>
      <Button variant="secondary" block={compact} onClick={go}>
        Simulate pay credit
      </Button>
    </Card>
  );
}

type Confirm = { kind: 'persona'; id: PersonaId } | { kind: 'reset' } | null;

export function ReviewerTools({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const { market } = state;
  const H = compact ? 'h3' : 'h2';

  const advance = () => {
    dispatch({ type: 'advanceWeek' });
    toast.show(`Moved to week ${market.week + 1}: ${SCENARIO_NAME[market.scenario].toLowerCase()}.`);
  };

  const loadPersona = (id: PersonaId) => {
    navigate('/home');
    dispatch({ type: 'loadPersona', persona: id, today: realToday() });
    setConfirm(null);
    toast.show(`Loaded the ${PERSONA_SEEDS.find((p) => p.id === id)?.name} demo.`);
    onDone?.();
  };

  const reset = () => {
    navigate('/');
    dispatch({ type: 'reset', today: realToday() });
    setConfirm(null);
    toast.show('Prototype reset. Everything is back to the start.');
    onDone?.();
  };

  return (
    <div className="space-y-4">
      <p className="rounded-card-sm bg-info-fill px-4 py-3 text-sm font-medium text-info">{REVIEWER_NOTE}</p>

      <Card pad={compact ? 'sm' : 'md'}>
        <H className="text-base font-semibold text-ink">Market scenario</H>
        <p className="mt-1 text-sm text-ink-muted">
          Week {market.week} · simulated date {dateLabel(simToday(market))}. The scenario applies when you advance a week.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Scenario for the next week">
          {SCENARIOS.map((s) => (
            <Chip key={s} selected={market.scenario === s} onClick={() => dispatch({ type: 'setScenario', scenario: s })}>
              {scenarioLabel(s)}
            </Chip>
          ))}
        </div>
        <Button className="mt-4" block={compact} onClick={advance}>
          Advance one week
        </Button>
      </Card>

      <PayCredit key={state.user.persona ?? 'none'} compact={compact} onDone={onDone} />

      <Card pad={compact ? 'sm' : 'md'}>
        <H className="text-base font-semibold text-ink">Load a demo persona</H>
        <p className="mt-1 text-sm text-ink-muted">Replaces the current state. Personas are demo data, not user research.</p>
        <ul className={`mt-3 grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
          {PERSONA_SEEDS.map((p) => (
            <li key={p.id} className="rounded-card-sm border border-border p-4">
              <p className="font-semibold text-ink">{p.label}</p>
              <p className="mt-1 text-sm text-ink-muted">{p.summary}</p>
              {confirm?.kind === 'persona' && confirm.id === p.id ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => loadPersona(p.id)}>
                    Replace and load
                  </Button>
                  <Button variant="quiet" onClick={() => setConfirm(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" className="mt-3" onClick={() => setConfirm({ kind: 'persona', id: p.id })}>
                  Load {p.name}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {!compact && (
        <Card>
          <H className="text-base font-semibold text-ink">Jump to any screen</H>
          <p className="mt-1 text-sm text-ink-muted">Ids come from the current state. Links marked “redirects” show the missing-state rule.</p>
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {jumpLinks(state).map((l) => (
              <li key={l.pattern} className="border-b border-border last:border-0 sm:[&:nth-last-child(2)]:border-0">
                <Link to={l.to} className="flex min-h-tap flex-wrap items-center gap-x-2 py-1 text-sm">
                  <span className="font-mono font-medium text-brand-text underline-offset-4 hover:underline">{l.to}</span>
                  {l.note && <span className="text-ink-muted">({l.note})</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card pad={compact ? 'sm' : 'md'}>
        <H className="text-base font-semibold text-ink">Reset</H>
        <p className="mt-1 text-sm text-ink-muted">Clears everything saved in this browser and returns to the landing page.</p>
        {confirm?.kind === 'reset' ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={reset}>
              Yes, reset everything
            </Button>
            <Button variant="quiet" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="mt-3" onClick={() => setConfirm({ kind: 'reset' })}>
            Reset prototype
          </Button>
        )}
      </Card>
      {compact && (
        <Link to="/review" onClick={onDone} className="inline-flex min-h-tap items-center text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
          Open full reviewer tools, with jump links
        </Link>
      )}
    </div>
  );
}
