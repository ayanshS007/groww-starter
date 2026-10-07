// Create or edit a goal (README 8.8, 9 item 15, PLAN S22). Suggestions:
// Emergency cushion, Laptop, Trip, Course fees. A date today or earlier asks
// for a later one; errors are announced (aria-live).
import { useEffect, useId, useState } from 'react';
import { getFund } from '../data/funds';
import { nextId } from '../lib/activity';
import { addDays } from '../lib/dates';
import { formatINR } from '../lib/format';
import { GOAL_SUGGESTIONS, suggestionPrefill, validateGoalInput, type GoalErrors } from '../lib/goals';
import { simToday } from '../lib/market';
import { cushionTarget } from '../lib/planner';
import { useStore } from '../state/store';
import type { Goal } from '../state/types';
import { AmountInput } from './AmountInput';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Edit mode when given; otherwise create. */
  goal?: Goal;
  /** Only the date field (past-date fix, "Extend date"). */
  dateOnly?: boolean;
  onSaved?: (goalId: string) => void;
};

export function GoalFormSheet({ open, onClose, goal, dateOnly = false, onSaved }: Props) {
  const { state, dispatch } = useStore();
  const id = useId();
  const today = simToday(state.market);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [byDate, setByDate] = useState('');
  const [isCushion, setIsCushion] = useState(false);
  const [sipIds, setSipIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<GoalErrors>({});

  // Fresh form each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? '');
    setTarget(goal ? String(goal.target) : '');
    setByDate(goal && goal.byDate > today ? goal.byDate : '');
    setIsCushion(goal?.isCushion ?? false);
    setSipIds([]);
    setErrors({});
  }, [open, goal, today]);

  const linkable = state.sips.filter((s) => s.status !== 'stopped');
  const band = state.checkin?.incomeBand;

  const pick = (s: (typeof GOAL_SUGGESTIONS)[number]) => {
    const p = suggestionPrefill(s, band ? cushionTarget(band) : undefined, today);
    setName(p.name);
    setIsCushion(p.isCushion);
    if (p.target) setTarget(String(p.target));
    if (p.byDate) setByDate(p.byDate);
    setErrors({});
  };

  const save = () => {
    const v = validateGoalInput({ name: dateOnly && goal ? goal.name : name, target: dateOnly && goal ? goal.target : target, byDate }, today);
    if (!v.ok) return setErrors(v.errors);
    if (goal) {
      dispatch({ type: 'updateGoal', goalId: goal.id, patch: dateOnly ? { byDate: v.value.byDate } : v.value });
      onSaved?.(goal.id);
    } else {
      const newId = nextId('goal', state.goals);
      dispatch({ type: 'createGoal', ...v.value, isCushion, sipIds });
      onSaved?.(newId);
    }
    onClose();
  };

  const title = dateOnly ? 'Pick a new date' : goal ? 'Edit goal' : 'Create a goal';
  const field = 'mt-2 min-h-[56px] w-full rounded-card-sm border-2 bg-surface px-4 text-lg text-ink outline-none focus:border-brand';

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        {!goal && (
          <div>
            <p className="text-sm font-semibold text-ink">Ideas</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Goal ideas">
              {GOAL_SUGGESTIONS.map((s) => (
                <Chip key={s} selected={name === s} onClick={() => pick(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {!dateOnly && (
          <div>
            <label htmlFor={`${id}-name`} className="block text-sm font-semibold text-ink">
              Goal name
            </label>
            <input
              id={`${id}-name`}
              value={name}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => {
                setName(e.target.value);
                setErrors((x) => ({ ...x, name: undefined }));
              }}
              aria-invalid={!!errors.name}
              aria-describedby={`${id}-name-msg`}
              className={`${field} ${errors.name ? 'border-caution' : 'border-border'}`}
            />
            <p id={`${id}-name-msg`} aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-caution">
              {errors.name}
            </p>
          </div>
        )}

        {!dateOnly && (
          <AmountInput
            label="How much you need"
            value={target}
            onChange={(v) => {
              setTarget(v);
              setErrors((x) => ({ ...x, target: undefined }));
            }}
            error={errors.target}
            note={isCushion ? 'Suggested: about 3 months of income.' : 'Your best guess is fine. You can change it later.'}
          />
        )}

        <div>
          <label htmlFor={`${id}-date`} className="block text-sm font-semibold text-ink">
            Need it by
          </label>
          <input
            id={`${id}-date`}
            type="date"
            value={byDate}
            min={addDays(today, 1)}
            onChange={(e) => {
              setByDate(e.target.value);
              setErrors((x) => ({ ...x, byDate: undefined }));
            }}
            aria-invalid={!!errors.byDate}
            aria-describedby={`${id}-date-msg`}
            className={`${field} ${errors.byDate ? 'border-caution' : 'border-border'}`}
          />
          <p id={`${id}-date-msg`} aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
            {errors.byDate ? <span className="text-caution">{errors.byDate}</span> : <span className="text-ink-muted">Today in the prototype is the simulated date.</span>}
          </p>
        </div>

        {!goal && linkable.length > 0 && (
          <fieldset>
            <legend className="text-sm font-semibold text-ink">Count a SIP toward it (optional)</legend>
            <p className="mt-1 text-sm text-ink-muted">A fund can back one goal at a time.</p>
            <div className="mt-2 space-y-2">
              {linkable.map((s) => {
                const on = sipIds.includes(s.id);
                const other = s.goalId ? state.goals.find((g) => g.id === s.goalId)?.name : undefined;
                return (
                  <label
                    key={s.id}
                    className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-card-sm border-2 p-3 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus ${
                      on ? 'border-brand bg-mint' : 'border-border bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={(e) => setSipIds(e.target.checked ? [...sipIds, s.id] : sipIds.filter((x) => x !== s.id))}
                    />
                    <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-brand bg-brand text-on-brand' : 'border-ink-muted'}`}>
                      {on && <Icon name="check" size={16} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 text-base text-ink">
                      {getFund(s.fundId)?.name} · {formatINR(s.amount)}/month
                      {other && <span className="block text-sm text-ink-muted">Now counts toward {other}; ticking moves it here.</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <Button type="submit" block>
          {dateOnly ? 'Save date' : goal ? 'Save changes' : 'Create goal'}
        </Button>
      </form>
    </BottomSheet>
  );
}
