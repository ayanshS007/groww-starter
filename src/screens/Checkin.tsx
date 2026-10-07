// S3 Check-in (README 8.1, 9 item 3): one question per step, "Why we ask",
// Continue disabled until answered, no auto-advance, Back keeps answers.
import { useState, type ReactNode } from 'react';
import { AmountInput } from '../components/AmountInput';
import { Button } from '../components/Button';
import { FlowHeader } from '../components/FlowHeader';
import { Icon } from '../components/Icon';
import { OptionTiles, type Option } from '../components/OptionTile';
import { Term } from '../components/Term';
import { CHECKIN_STEPS, isStepAnswered, MONTHLY_PRESETS } from '../lib/checkin';
import { formatINR } from '../lib/format';
import {
  comfortCeiling,
  CUSHION_LABEL,
  DIP_LABEL,
  HORIZON_LABEL,
  INCOME_BAND_LABEL,
  INCOME_TYPE_LABEL,
  PURPOSE_LABEL,
  validateMonthly,
} from '../lib/planner';
import { goBack, navigate } from '../router';
import { useStore } from '../state/store';
import type { CheckinAnswers, CushionAnswer, DipReaction, Horizon, IncomeBand, IncomeType, Purpose } from '../state/types';

const opts = <T extends string>(labels: Record<T, string>, hints: Partial<Record<T, string>> = {}): Option<T>[] =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value], hint: hints[value] }));

const PRESET_HINT: Record<number, string> = {
  100: 'About a coffee and a snack',
  500: 'About two cinema tickets',
  1000: 'About one dinner out with friends',
  2500: 'About a pair of everyday sneakers',
};

type MonthlyValue = (typeof MONTHLY_PRESETS)[number] | 'custom';

const QUESTION: Record<number, string> = {
  1: 'How does money come in, and roughly how much a month?',
  2: 'Do you have money set aside for emergencies?',
  3: 'What is this money for?',
  4: 'When might you need it?',
  5: 'If it fell 10% for a while, you’d…',
  6: 'How much a month feels easy?',
};

const WHY: Record<number, ReactNode> = {
  1: 'A steady salary and uneven income need different cushions and different SIP dates.',
  2: 'Without a cushion, a surprise bill can force you to sell at a bad time.',
  3: 'It shapes how your plan is split and how we explain it.',
  4: 'Money you need soon should not ride big ups and downs.',
  5: 'There’s no right answer. Most people feel a fall more than they expect.',
  6: (
    <>
      Start small. You can change, skip or pause your <Term id="sip">SIP</Term> any month, free.
    </>
  ),
};

export function Checkin({ step }: { step: number }) {
  const { state, dispatch } = useStore();
  const d = state.checkinDraft ?? {};
  const save = (answers: Partial<CheckinAnswers>) => dispatch({ type: 'saveCheckinAnswer', answers });

  const [custom, setCustom] = useState(d.monthlyChoice === 'custom' && d.monthly ? String(d.monthly) : '');
  const [touched, setTouched] = useState(false);

  const answered = isStepAnswered(step, d);
  const ceiling = d.incomeBand ? comfortCeiling(d.incomeBand) : undefined;

  const onContinue = () => {
    if (!answered) return;
    if (step < CHECKIN_STEPS) {
      navigate(`/checkin/${step + 1}`);
      return;
    }
    navigate('/plan');
    dispatch({ type: 'completeCheckin' });
  };

  const onBack = () => (step > 1 ? navigate(`/checkin/${step - 1}`) : goBack('/home'));

  const legend = (
    <h1 className="text-2xl font-bold leading-snug text-ink md:text-3xl">{QUESTION[step]}</h1>
  );

  let body: ReactNode = null;
  switch (step) {
    case 1:
      body = (
        <div className="space-y-8">
          {legend}
          <OptionTiles<IncomeType>
            name="incomeType"
            legend="How money comes in"
            options={opts(INCOME_TYPE_LABEL)}
            value={d.incomeType}
            onChange={(v) => save({ incomeType: v })}
            columns={2}
          />
          <OptionTiles<IncomeBand>
            name="incomeBand"
            legend="Roughly how much a month"
            options={opts(INCOME_BAND_LABEL)}
            value={d.incomeBand}
            onChange={(v) => save({ incomeBand: v })}
            columns={2}
          />
        </div>
      );
      break;
    case 2:
      body = (
        <OptionTiles<CushionAnswer>
          name="cushion"
          legend={legend}
          legendClassName="mb-6"
          options={opts(CUSHION_LABEL, { yes: 'Enough for a few months of expenses', some: 'A little, not a full month', no: 'That’s okay, most people start here' })}
          value={d.cushion}
          onChange={(v) => save({ cushion: v })}
        />
      );
      break;
    case 3:
      body = (
        <OptionTiles<Purpose>
          name="purpose"
          legend={legend}
          legendClassName="mb-6"
          options={opts(PURPOSE_LABEL, {
            wealth: 'Let it grow over the years',
            goal: 'A laptop, a trip, course fees…',
            cushion: 'Money for surprises first',
            exploring: 'Learn how it works with a small amount',
          })}
          value={d.purpose}
          onChange={(v) => save({ purpose: v })}
        />
      );
      break;
    case 4:
      body = (
        <OptionTiles<Horizon>
          name="horizon"
          legend={legend}
          legendClassName="mb-6"
          options={opts(HORIZON_LABEL)}
          value={d.horizon}
          onChange={(v) => save({ horizon: v })}
          columns={2}
        />
      );
      break;
    case 5:
      body = (
        <OptionTiles<DipReaction>
          name="dipReaction"
          legend={legend}
          legendClassName="mb-6"
          options={opts(DIP_LABEL, {
            sell: 'Seeing less money would worry me',
            wait: 'I’d leave it and check back later',
            stay: 'Falls don’t bother me much',
          })}
          value={d.dipReaction}
          onChange={(v) => save({ dipReaction: v })}
        />
      );
      break;
    case 6: {
      const choice = d.monthlyChoice;
      const check = validateMonthly(custom);
      const error = choice === 'custom' && touched && !check.ok ? check.error : undefined;
      const amount = choice === 'custom' ? (check.ok ? check.value : undefined) : d.monthly;
      const note =
        amount !== undefined && ceiling !== undefined && amount > ceiling
          ? `That’s above the ${formatINR(ceiling)} that usually feels easy at your income. You can still choose it.`
          : undefined;
      body = (
        <div className="space-y-4">
          <OptionTiles<MonthlyValue>
            name="monthly"
            legend={legend}
            legendClassName="mb-6"
            options={[
              ...MONTHLY_PRESETS.map((n) => ({ value: n, label: formatINR(n), hint: PRESET_HINT[n] })),
              { value: 'custom' as const, label: 'Custom amount', hint: '₹100 to ₹1,00,000' },
            ]}
            value={choice}
            onChange={(v) => {
              if (v === 'custom') {
                const c = validateMonthly(custom);
                save({ monthlyChoice: 'custom', monthly: c.ok ? c.value : undefined });
              } else save({ monthlyChoice: v, monthly: v });
            }}
            columns={2}
          />
          {choice === 'custom' && (
            <AmountInput
              label="Your monthly amount"
              value={custom}
              autoFocus
              onChange={(v) => {
                setCustom(v);
                setTouched(true);
                const c = validateMonthly(v);
                save({ monthlyChoice: 'custom', monthly: c.ok ? c.value : undefined });
              }}
              error={error}
              note={note}
            />
          )}
          {choice !== 'custom' && (
            <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink-muted">
              {note}
            </p>
          )}
        </div>
      );
      break;
    }
  }

  return (
    <>
      <FlowHeader onBack={onBack} closeTo="/home" closeLabel="Close, your answers are saved" step={step} steps={CHECKIN_STEPS} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-tablet px-safe pt-6 outline-none">
        {body}
        <aside className="mt-6 flex gap-3 rounded-card-sm bg-sky p-4 text-sm text-ink">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-info" />
          <p>
            <span className="font-semibold">Why we ask: </span>
            {WHY[step]}
          </p>
        </aside>
        <div className="sticky bottom-0 -mx-4 mt-6 bg-bg/95 px-4 pb-safe pt-3 backdrop-blur">
          <div className="pb-4">
            <Button block disabled={!answered} onClick={onContinue}>
              {step === CHECKIN_STEPS ? 'See my starter plan' : 'Continue'}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
