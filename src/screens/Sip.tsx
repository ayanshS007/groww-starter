// S15 SIP detail (README 9 item 12, PLAN S15): change the SIP to fit the month
// without quitting. Skip (undo toast), pause 1/2/3 months, edit amount/date,
// step-up +10% yearly (stored and shown, not simulated), and Stop SIP → coach.
import { useState, type ReactNode } from 'react';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { EditSipSheet } from '../components/EditSipSheet';
import { LetterAvatar } from '../components/LetterAvatar';
import { Note } from '../components/Note';
import { PauseSheet } from '../components/PauseSheet';
import { SipStatusPill } from '../components/StatusPill';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { getFund } from '../data/funds';
import { dateLabel, formatINR } from '../lib/format';
import { singleDraft } from '../lib/invest';
import { sipDateText, sipFacts, sipHoldingId, stepUpAmount, stepUpLine, unitsValue, linkedGoalName } from '../lib/sip';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import type { Sip } from '../state/types';

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function SipDetail({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [sheet, setSheet] = useState<'pause' | 'edit' | null>(null);
  const sip: Sip | undefined = state.sips.find((s) => s.id === id);
  if (!sip) return null;

  const fund = getFund(sip.fundId);
  const facts = sipFacts(state, sip);
  const active = sip.status === 'active';
  const paused = sip.status === 'paused';
  const stopped = sip.status === 'stopped';
  const stepUp = stepUpLine(sip);
  const goal = linkedGoalName(state, sip);
  const holdingId = sipHoldingId(state, sip);
  const kept = unitsValue(state, sip);

  const skip = () => {
    dispatch({ type: 'skipNext', sipId: sip.id });
    toast.show(`Skipped ${facts.nextDate ? dateLabel(facts.nextDate, { short: true }) : 'the next instalment'}. Your plan stays alive.`, {
      undo: () => dispatch({ type: 'undoSkip', sipId: sip.id }),
    });
  };

  const resume = () => {
    dispatch({ type: 'resumeSip', sipId: sip.id });
    toast.show('SIP resumed. It runs on its usual date.');
  };

  const toggleStepUp = () => {
    dispatch({ type: 'toggleStepUp', sipId: sip.id });
    toast.show(sip.stepUpPct ? 'Step-up is off.' : 'Step-up is on. Saved for later; the demo doesn’t run years.');
  };

  const startNew = () => {
    if (!fund) return;
    dispatch({ type: 'startInvestDraft', draft: singleDraft(fund.id, { type: 'sip' }) });
    navigate(`/invest/${fund.id}`);
  };

  // The primary action depends on status (PLAN S15).
  const primary = stopped ? (
    <Button block onClick={startNew}>
      Start a new SIP in this fund
    </Button>
  ) : paused ? (
    <Button block onClick={resume}>
      Resume now
    </Button>
  ) : facts.skippedDate ? (
    <Button block onClick={() => dispatch({ type: 'undoSkip', sipId: sip.id })}>
      Undo skip
    </Button>
  ) : (
    <Button block onClick={skip}>
      Skip next instalment
    </Button>
  );

  const actions = (
    <div className="flex flex-col gap-3">
      {primary}
      {!stopped && (
        <>
          <Button block variant="secondary" onClick={() => setSheet('pause')} aria-haspopup="dialog">
            {paused ? 'Change the pause' : 'Pause 1, 2 or 3 months'}
          </Button>
          <Button block variant="secondary" onClick={() => setSheet('edit')} aria-haspopup="dialog">
            Edit amount or date
          </Button>
          <ButtonLink to={`/portfolio/sip/${sip.id}/stop`} variant="quiet" block>
            Stop SIP
          </ButtonLink>
        </>
      )}
      {stopped && holdingId && (
        <ButtonLink to={`/portfolio/holding/${holdingId}`} variant="secondary" block>
          See what you hold
        </ButtonLink>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-8">
        <BackLink fallback="/portfolio">Portfolio</BackLink>
        <header className="flex items-center gap-4">
          <LetterAvatar name={fund?.name ?? 'Fund'} size="lg" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-ink">{fund?.name ?? 'Your SIP'}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-base text-ink-muted">
              <Term id="sip">SIP</Term> · {formatINR(sip.amount)} a month <SipStatusPill status={sip.status} />
            </p>
          </div>
        </header>

        {paused && sip.pausedUntil && (
          <Note tone="info">
            Paused. It restarts by itself after {dateLabel(sip.pausedUntil)}, or you can resume now. The units you own stay invested.
          </Note>
        )}
        {active && facts.skippedDate && (
          <Note tone="info">
            {dateLabel(facts.skippedDate, { short: true })} is skipped. Nothing resets, and your next instalment is on{' '}
            {facts.nextDate ? dateLabel(facts.nextDate, { short: true }) : 'its usual date'}.
          </Note>
        )}
        {stopped && (
          <Note tone="info">
            This SIP is stopped. The <span className="font-semibold tabular-nums">{formatINR(kept)}</span> you hold in this fund (sample value) stays
            invested. You can withdraw it any time, or start a new SIP.
          </Note>
        )}

        <Card pad="lg" aria-labelledby="sip-facts">
          <h2 id="sip-facts" className="text-lg font-semibold text-ink">
            Your SIP
          </h2>
          <dl className="mt-2">
            <Row label="Amount each month">
              <span className="tabular-nums">{formatINR(sip.amount)}</span>
            </Row>
            <Row label="Date">{sipDateText(sip)}</Row>
            <Row label="Status">
              <SipStatusPill status={sip.status} />
            </Row>
            <Row label="Instalments made">
              <span className="tabular-nums">{sip.instalments}</span>
            </Row>
            <Row label={stopped ? 'Stopped' : paused ? 'Restarts' : 'Next instalment'}>
              {stopped ? (sip.stoppedAt ? dateLabel(sip.stoppedAt) : 'Stopped') : paused ? (sip.pausedUntil ? `after ${dateLabel(sip.pausedUntil)}` : 'Paused') : facts.next}
            </Row>
            <Row label="Linked goal">
              {goal && sip.goalId ? (
                <Link to={`/portfolio/goal/${sip.goalId}`} className="inline-flex min-h-tap items-center text-brand-text underline-offset-4 hover:underline">
                  {goal}
                </Link>
              ) : (
                <Link to="/portfolio/goals" className="inline-flex min-h-tap items-center font-normal text-brand-text underline-offset-4 hover:underline">
                  None yet · link one in Goals
                </Link>
              )}
            </Row>
          </dl>
        </Card>

        <div className="lg:hidden">{actions}</div>

        {!stopped && (
          <Card pad="lg" aria-labelledby="sip-stepup">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="sip-stepup" className="text-lg font-semibold text-ink">
                  <Term id="step-up">Step-up</Term> +10% yearly
                </h2>
                <p className="mt-1 text-base text-ink-muted">
                  Raise this SIP by 10% once a year, only if you want to.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!sip.stepUpPct}
                aria-labelledby="sip-stepup"
                onClick={toggleStepUp}
                className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-full"
              >
                <span
                  aria-hidden
                  className={`flex h-8 w-14 items-center rounded-full border-2 px-0.5 transition ${
                    sip.stepUpPct ? 'justify-end border-brand bg-brand' : 'justify-start border-border bg-surface2'
                  }`}
                >
                  <span className="h-6 w-6 rounded-full border border-border bg-surface shadow" />
                </span>
                <span className="sr-only">{sip.stepUpPct ? 'On' : 'Off'}</span>
              </button>
            </div>
            <p aria-live="polite" className="mt-3 rounded-card-sm bg-surface2 p-3 text-sm text-ink">
              {stepUp ? (
                <>
                  {stepUp}. <span className="text-ink-muted">Saved here only. This demo doesn’t run years, so nothing changes today.</span>
                </>
              ) : (
                <>Off. Your amount stays {formatINR(sip.amount)} unless you change it. Next would be {formatINR(stepUpAmount(sip.amount))}.</>
              )}
            </p>
          </Card>
        )}

        <p className="text-sm text-ink-muted">
          {fund && (
            <Link to={`/fund/${fund.id}?from=portfolio`} className="font-semibold text-brand-text underline-offset-4 hover:underline">
              Read about this fund
            </Link>
          )}
        </p>
        <Disclaimer />
      </div>

      <aside className="hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <Card pad="lg" className="lg:sticky lg:top-24" aria-label="Actions">
          <h2 className="text-lg font-semibold text-ink">Change it, don’t lose it</h2>
          <p className="mb-5 mt-1 text-sm text-ink-muted">Skipping and pausing are free. Nothing resets and nothing is lost.</p>
          {actions}
        </Card>
      </aside>

      <PauseSheet sip={sip} open={sheet === 'pause'} onClose={() => setSheet(null)} />
      <EditSipSheet sip={sip} open={sheet === 'edit'} onClose={() => setSheet(null)} />
    </div>
  );
}
