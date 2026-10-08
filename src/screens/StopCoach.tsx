// S16 Stop coach (README 8.6 and 9 item 13, PLAN item 23 and C12). One screen.
// The reason tiles sit at the top; the action row is in the first render, with
// "Stop anyway" last and the same size as the other options. Picking a reason
// expands its response in place and swaps the row's options (no second screen).
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Disclaimer } from '../components/Disclaimer';
import { EditSipSheet } from '../components/EditSipSheet';
import { FlowHeader } from '../components/FlowHeader';
import { OptionTiles } from '../components/OptionTile';
import { PauseSheet } from '../components/PauseSheet';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { FUNDS, getFund } from '../data/funds';
import { sipChangeWindow } from '../lib/cutoff';
import { dateLabel, formatINR, ordinal } from '../lib/format';
import { weekChange } from '../lib/market';
import { COACH_REASONS, coachFor, stopToast, type CoachOption, type CoachReason } from '../lib/sipCoach';
import { defaultCompareFund, sipHoldingId, unitsValue } from '../lib/sip';
import { navigate } from '../router';
import { useStore } from '../state/store';
import type { FundId } from '../state/types';

export function StopCoach({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState<CoachReason | null>(null);
  const [otherId, setOtherId] = useState<FundId | undefined>(undefined);
  const [sheet, setSheet] = useState<'pause' | 'edit' | null>(null);
  const selectId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  // Picking a reason expands the response above the row. Keep every option, Stop anyway
  // included, on screen: scroll just enough, never past the row (and not on first render).
  useEffect(() => {
    if (!picked.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rowRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [reason]);

  const sip = state.sips.find((s) => s.id === id);
  if (!sip) return null;
  const fund = getFund(sip.fundId);
  const detail = `/portfolio/sip/${sip.id}`;
  const compareId = otherId ?? defaultCompareFund(state, sip);
  // Real autopay rules: only options that can still change the next debit are shown.
  const win = sipChangeWindow(state, sip);
  const coaching = coachFor(reason, sip, {
    weekChange: weekChange(state),
    otherFundId: compareId,
    can: { skip: win.canSkip, pause: win.canPause, edit: win.canEdit },
    cutoffLine: win.line,
  });
  const paused = sip.status === 'paused';

  // After any choice we land back on SIP detail, replacing the coach entry so Back doesn't return here.
  const backToDetail = () => navigate(detail, { replace: true });

  const run = (o: CoachOption) => {
    switch (o.id) {
      case 'keep_sip':
      case 'keep_going':
      case 'keep':
      case 'keep_paused':
        toast.show(paused ? 'Your SIP stays paused. Nothing changes.' : 'Your SIP stays as it is. Nothing changes.');
        return backToDetail();
      case 'pause':
        return setSheet('pause');
      case 'resume':
        dispatch({ type: 'resumeSip', sipId: sip.id });
        toast.show('SIP resumed. It runs on its usual date.');
        return backToDetail();
      case 'lower_amount':
        return setSheet('edit');
      case 'skip_next': {
        dispatch({ type: 'skipNext', sipId: sip.id });
        toast.show('Skipped the next instalment. Your plan stays alive.', {
          undo: () => dispatch({ type: 'undoSkip', sipId: sip.id }),
        });
        return backToDetail();
      }
      case 'withdraw': {
        const holdingId = sipHoldingId(state, sip);
        if (!holdingId) {
          toast.show('You don’t hold any units in this fund right now.');
          return navigate('/portfolio', { replace: true });
        }
        return navigate(`/portfolio/holding/${holdingId}?withdraw=1`, { replace: true });
      }
      case 'stop_anyway': {
        // No reason is needed, and no second confirm: it's their call.
        dispatch({ type: 'stopSip', sipId: sip.id, reason: reason ?? 'none' });
        toast.show(stopToast(unitsValue(state, sip)));
        return backToDetail();
      }
    }
  };

  return (
    <>
      <FlowHeader backTo={detail} closeTo={detail} title="Stop SIP" />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-tablet px-safe pb-10 pt-4 outline-none">
        <h1 className="text-3xl font-bold text-ink">Change or stop your SIP</h1>
        <p className="mt-1 text-base text-ink-muted">
          {fund?.name} · {formatINR(sip.amount)} on the {ordinal(sip.dayOfMonth)}
          {paused && sip.pausedUntil ? ` · paused until ${dateLabel(sip.pausedUntil, { short: true })}` : ''}
        </p>

        <div className="mt-4">
          <OptionTiles
            dense
            name="stop-reason"
            legend="What’s going on? Pick the closest, or skip this."
            legendClassName="mb-2 text-base font-semibold text-ink"
            options={COACH_REASONS.map((r) => ({ value: r.id, label: r.label }))}
            value={reason ?? undefined}
            onChange={(v) => {
              picked.current = true;
              setReason(v);
            }}
          />
        </div>

        <div aria-live="polite" className="mt-4">
          {coaching.response && (
            <Card tint="sky" pad="md" className="space-y-4">
              <p className="text-base text-ink">{coaching.response}</p>
              {reason === 'better_fund' && fund && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor={selectId} className="block text-sm font-semibold text-ink">
                      Compare with
                    </label>
                    <select
                      id={selectId}
                      value={compareId}
                      onChange={(e) => setOtherId(e.target.value as FundId)}
                      className="mt-2 min-h-[48px] w-full rounded-card-sm border-2 border-border bg-surface px-3 text-base text-ink"
                    >
                      {FUNDS.filter((f) => f.id !== fund.id).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {coaching.comparison && (
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Your fund next to {coaching.comparison.otherFund.name}</caption>
                      <thead>
                        <tr className="border-b border-border">
                          <th scope="col" className="py-2 pr-2 font-semibold text-ink-muted">
                            <span className="sr-only">Detail</span>
                          </th>
                          <th scope="col" className="px-2 py-2 font-semibold text-ink">
                            Yours
                          </th>
                          <th scope="col" className="py-2 pl-2 font-semibold text-ink">
                            Other
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {coaching.comparison.rows.map((r) => (
                          <tr key={r.label} className="border-b border-border last:border-0">
                            <th scope="row" className="py-2 pr-2 font-medium text-ink-muted">
                              {r.label === 'Expense ratio' ? <Term id="expense-ratio">{r.label}</Term> : r.label}
                            </th>
                            <td className="px-2 py-2 tabular-nums text-ink">{r.current}</td>
                            <td className="py-2 pl-2 tabular-nums text-ink">{r.other}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="text-xs text-ink-muted">Sample data, side by side. Not a ranking.</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* The action row: always in the page from the first render; options swap in place. */}
        <div ref={rowRef} role="group" aria-label="What would you like to do?" className="mt-4 grid scroll-mb-6 gap-3">
          {coaching.options.map((o) => (
            <Button
              key={o.id}
              block
              variant={o.primary ? 'primary' : 'secondary'}
              aria-haspopup={o.id === 'pause' || o.id === 'lower_amount' ? 'dialog' : undefined}
              onClick={() => run(o)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-muted">Stopping is your call. It ends future instalments only. What you already own stays invested.</p>

        <ConfidenceBlock
          compact
          className="mt-8"
          what={<>Stopping a <Term id="sip">SIP</Term> ends future instalments. Skip and pause are lighter ways to ease a tight month.</>}
          why="You tapped Stop SIP. We offer these options because many people only need a lighter one. The choice stays yours."
          next={<>Pick one and you’re back on your SIP page with the new status. Your units stay invested either way.</>}
        />
        <Disclaimer className="mt-6" />
      </main>

      <PauseSheet sip={sip} open={sheet === 'pause'} onClose={() => setSheet(null)} onPaused={backToDetail} />
      <EditSipSheet sip={sip} open={sheet === 'edit'} onClose={() => setSheet(null)} onSaved={backToDetail} />
    </>
  );
}
