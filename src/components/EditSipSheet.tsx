// Edit a SIP's amount and date (README 9 item 12). Changes apply from the next
// instalment; nothing already invested changes. Used by SIP detail and by the
// Stop coach's "Lower amount".
import { useState } from 'react';
import { getFund } from '../data/funds';
import { formatINR, ordinal } from '../lib/format';
import { ceilingNote } from '../lib/invest';
import { checkSipEdit } from '../lib/sip';
import { useStore } from '../state/store';
import type { Sip } from '../state/types';
import { AmountInput } from './AmountInput';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { StepperInput } from './StepperInput';
import { useToast } from './Toast';

type Props = { sip: Sip; open: boolean; onClose: () => void; onSaved?: () => void };

function EditForm({ sip, onClose, onSaved }: Omit<Props, 'open'>) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const fund = getFund(sip.fundId);
  const [amount, setAmount] = useState(String(sip.amount));
  const [day, setDay] = useState(sip.dayOfMonth);
  const [touched, setTouched] = useState(false);

  const check = checkSipEdit({ amount, day }, sip, fund);
  const error = touched && !check.ok ? check.error : undefined;
  const note = check.ok ? ceilingNote(state, check.amount, [sip.fundId]) : undefined;

  const save = () => {
    setTouched(true);
    if (!check.ok) return;
    if (!check.changed) {
      onClose();
      return;
    }
    dispatch({ type: 'editSip', sipId: sip.id, amount: check.amount, dayOfMonth: check.day });
    const parts = [
      check.amount !== sip.amount ? formatINR(check.amount) : undefined,
      check.day !== sip.dayOfMonth ? `the ${ordinal(check.day)}` : undefined,
    ].filter(Boolean);
    toast.show(`SIP updated: ${parts.join(' on ')}. It applies from the next instalment.`);
    onClose();
    onSaved?.();
  };

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <p className="text-base text-ink">Changes apply from the next instalment. What you already own stays as it is.</p>
      <AmountInput
        label="Amount each month"
        value={amount}
        onChange={(v) => {
          setAmount(v);
          setTouched(true);
        }}
        onBlur={() => setTouched(true)}
        error={error}
        note={note ?? `Smallest SIP here: ${formatINR(fund?.minSip ?? 100)}.`}
      />
      <StepperInput label="SIP date" value={day} min={1} max={28} format={(v) => ordinal(v)} onChange={setDay} hint="Any day from 1 to 28." />
      <Button type="submit" block>
        Save changes
      </Button>
    </form>
  );
}

export function EditSipSheet({ sip, open, onClose, onSaved }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Edit amount or date">
      <EditForm sip={sip} onClose={onClose} onSaved={onSaved} />
    </BottomSheet>
  );
}
