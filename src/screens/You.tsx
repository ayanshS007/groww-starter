// S19 You (README 9 item 18). Account, verification status, bank and autopay,
// Redo check-in, Starter/Pro view, stock budget and readiness, notification
// toggles, Help, About, Reviewer tools, Log out.
// No theme toggle, language switcher or referral offers.
import { useState, type ReactNode } from 'react';
import { Avatar } from '../components/Avatar';
import { BottomSheet } from '../components/BottomSheet';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { ViewToggle } from '../components/ViewToggle';
import { HELP_FAQS } from '../data/learn';
import { realToday } from '../lib/dates';
import { maskMobile } from '../lib/format';
import { buildPath } from '../lib/routes';
import { Link, navigate } from '../router';
import { useStore } from '../state/store';
import { NOTIF_KINDS, type NotifKind } from '../state/types';

const NOTIF_LABEL: Record<NotifKind, string> = {
  sip_due: 'SIP due in 2 days',
  sip_done: 'Instalment done',
  sip_skipped_paused: 'SIP skipped or paused',
  insight_ready: 'Weekly insight ready',
  goal_progress: 'Goal progress (25, 50, 75, 100%)',
  milestone: 'Milestones',
  kyc_pending: 'Verification pending',
};

function Row({ title, detail, action }: { title: ReactNode; detail?: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex min-h-[64px] flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        {detail && <p className="text-sm text-ink-muted">{detail}</p>}
      </div>
      {action}
    </li>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="flex min-h-tap min-w-tap items-center justify-center"
    >
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${on ? 'bg-brand' : 'bg-ink/20'}`}>
        <span className={`h-5 w-5 rounded-full bg-surface shadow transition ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

const rowLink = 'inline-flex min-h-tap items-center gap-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline';

export function You() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [logout, setLogout] = useState(false);
  const { user } = state;
  const checkinTo = user.signedUp ? '/checkin/1' : buildPath('/signup', { next: '/checkin/1' });
  const kycStep = !state.kycProgress?.panOk ? 1 : !state.kycProgress.aadhaarOk ? 2 : !state.kycProgress.selfieOk ? 3 : 4;

  const doLogout = () => {
    navigate('/');
    dispatch({ type: 'reset', today: realToday() });
    setLogout(false);
    toast.show('Logged out. This browser no longer holds your demo data.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="sr-only">You</h1>
      <Card tint="lavender" pad="lg">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-ink">{user.name ?? 'Guest'}</p>
            <p className="text-sm text-ink-muted">
              {user.mobile ? `+91 ${maskMobile(user.mobile)}` : 'Browsing without an account'}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {state.plan ? <ButtonLink to="/plan">View my plan</ButtonLink> : <ButtonLink to={checkinTo}>Take the check-in</ButtonLink>}
          {!user.signedUp && (
            <ButtonLink to={buildPath('/signup', { next: '/you' })} variant="secondary">
              Create an account
            </ButtonLink>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Account</h2>
        <ul className="mt-1 divide-y divide-border">
          <Row
            title={<>Verification (<Term id="kyc">KYC</Term>)</>}
            detail={
              user.kyc === 'done'
                ? 'Verified'
                : user.kyc === 'in_progress'
                  ? 'In progress. Your steps so far are saved.'
                  : 'Not started. It happens once, at your first payment.'
            }
            action={
              user.kyc === 'done' ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text">
                  <Icon name="check" size={18} /> Done
                </span>
              ) : user.kyc === 'in_progress' ? (
                <Link to={buildPath(`/kyc/${kycStep}`, { next: '/you' })} className={rowLink}>
                  Continue verification <Icon name="chevronRight" size={16} />
                </Link>
              ) : undefined
            }
          />
          <Row
            title="Bank account"
            detail={user.bankLinked ? 'Sample Bank ••••4821 (simulated)' : 'Not linked yet. Linked during verification.'}
          />
          <Row
            title={<Term id="upi-autopay">UPI autopay</Term>}
            detail={user.autopay ? 'On. Your SIPs are paid automatically.' : 'Off. You set it up with your first SIP.'}
          />
          <Row
            title="Redo check-in"
            detail="Updates your starter plan. Your SIPs stay as they are."
            action={
              <Link to={checkinTo} className={rowLink}>
                Redo <Icon name="chevronRight" size={16} />
              </Link>
            }
          />
        </ul>
      </Card>

      <Card aria-labelledby="view-title">
        <h2 id="view-title" className="text-lg font-semibold text-ink">
          App view
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Starter keeps things simple. Pro shows denser lists, sample market data and a watchlist table. Switch back any time.
        </p>
        <div className="mt-4">
          <ViewToggle />
        </div>
      </Card>

      <Card aria-labelledby="stocks-title">
        <h2 id="stocks-title" className="text-lg font-semibold text-ink">
          Stocks
        </h2>
        <ul className="mt-1 divide-y divide-border">
          <Row
            title="Stock budget and readiness"
            detail={`Limit: ${state.prefs.stockBudgetPct}% of your portfolio. Readiness check: ${state.prefs.readinessPassed ? 'passed' : 'not taken yet'}.`}
            action={
              <Link to="/you/trading" className={rowLink}>
                Open <Icon name="chevronRight" size={16} />
              </Link>
            }
          />
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Notifications</h2>
        <p className="mt-1 text-sm text-ink-muted">
          In-app only. Only things that happened to your money, never offers.{' '}
          <Link to="/notifications" className="font-semibold text-brand-text underline-offset-4 hover:underline">
            Open inbox
          </Link>
        </p>
        <ul className="mt-1 divide-y divide-border">
          {NOTIF_KINDS.map((k) => (
            <Row
              key={k}
              title={NOTIF_LABEL[k]}
              action={
                <Switch
                  on={state.prefs.notif[k]}
                  label={NOTIF_LABEL[k]}
                  onChange={(on) => dispatch({ type: 'setNotifPref', kind: k, on })}
                />
              }
            />
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Help</h2>
        <ul className="mt-2 divide-y divide-border">
          {HELP_FAQS.map((f) => (
            <li key={f.q}>
              <details className="group">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-ink">
                  {f.q}
                  <Icon name="chevronDown" size={20} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-base text-ink-muted">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">About this prototype</h2>
        <p className="mt-2 text-base text-ink-muted">
          Groww Starter is an illustrative prototype of a beginner mode for first-time investors. There is no real money, KYC or
          account. All prices and returns are sample data. Nothing here is investment advice.
        </p>
        <Link to="/review" className={`${rowLink} mt-3`}>
          Reviewer tools <Icon name="chevronRight" size={16} />
        </Link>
      </Card>

      <Button variant="secondary" block onClick={() => setLogout(true)}>
        Log out
      </Button>

      <BottomSheet open={logout} onClose={() => setLogout(false)} title="Log out?">
        <p className="text-base text-ink">
          This prototype keeps everything in this browser. Logging out clears it all and starts over.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button onClick={doLogout} block>
            Log out and reset
          </Button>
          <Button variant="secondary" onClick={() => setLogout(false)} block>
            Stay logged in
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
