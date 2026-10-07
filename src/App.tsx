// Root: hash routing with guards, the responsive shell and every built screen (Stages 3a–3d).
import { useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { SCREEN_TITLE } from './components/nav';
import { TermScope } from './components/Term';
import { ToastProvider, useToast } from './components/Toast';
import { useKeyboardAvoidance } from './components/useKeyboardAvoidance';
import { FLOW_SCREENS, type Resolved } from './lib/routes';
import { useLocation, useRoute } from './router';
import { Checkin } from './screens/Checkin';
import { Dashboard } from './screens/Dashboard';
import { Explore } from './screens/Explore';
import { FundDetail } from './screens/Fund';
import { Funds } from './screens/Funds';
import { Glossary } from './screens/Glossary';
import { HoldingDetail } from './screens/Holding';
import { Home } from './screens/Home';
import { Invest, InvestPlan } from './screens/Invest';
import { Kyc } from './screens/Kyc';
import { Landing } from './screens/Landing';
import { Learn } from './screens/Learn';
import { Notifications } from './screens/Notifications';
import { Plan } from './screens/Plan';
import { Portfolio } from './screens/Portfolio';
import { Review } from './screens/Review';
import { Signup } from './screens/Signup';
import { SipDetail } from './screens/Sip';
import { StopCoach } from './screens/StopCoach';
import { Success } from './screens/Success';
import { You } from './screens/You';
import { useStore } from './state/store';
import type { FundId } from './state/types';

type ScreenRoute = Extract<Resolved, { kind: 'screen' }>;

export function renderScreen(r: ScreenRoute) {
  switch (r.screen) {
    case 'landing':
      return <Landing />;
    case 'signup':
      return <Signup query={r.query} />;
    case 'checkin':
      return <Checkin step={Number(r.params.step)} />;
    case 'plan':
      return <Plan />;
    case 'home':
      return <Home />;
    case 'kyc':
      return <Kyc step={r.params.step} query={r.query} />;
    case 'explore':
      return <Explore query={r.query} />;
    case 'funds':
      return <Funds query={r.query} />;
    case 'fund':
      return <FundDetail id={r.params.id} query={r.query} />;
    case 'investPlan':
      return <InvestPlan />;
    case 'invest':
      return <Invest fundId={r.params.fundId as FundId} query={r.query} />;
    case 'success':
      return <Success orderId={r.params.orderId} />;
    case 'portfolio':
      return <Portfolio />;
    case 'holding':
      return <HoldingDetail id={r.params.id} query={r.query} />;
    case 'sip':
      return <SipDetail id={r.params.id} />;
    case 'stopCoach':
      return <StopCoach id={r.params.id} />;
    case 'learn':
      return <Learn />;
    case 'glossary':
      return <Glossary query={r.query} />;
    case 'you':
      return <You />;
    case 'review':
      return <Review />;
    case 'dashboard':
      return <Dashboard />;
    case 'notifications':
      return <Notifications />;
  }
}

function Routed() {
  const { state } = useStore();
  const toast = useToast();
  const resolved = useRoute(state, toast.show);
  const loc = useLocation();
  const first = useRef(true);
  useKeyboardAvoidance();
  const screen = resolved.kind === 'screen' ? resolved.screen : undefined;

  // New screen: update the tab title, scroll to top and move focus to the
  // content (not on first load, so the page doesn't jump for screen readers).
  useEffect(() => {
    if (!screen) return;
    document.title = `${SCREEN_TITLE[screen]} · Groww Starter`;
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [loc.path, screen]);

  if (resolved.kind === 'redirect') return null;
  return (
    <AppShell screen={resolved.screen} flow={FLOW_SCREENS.includes(resolved.screen)}>
      <TermScope key={loc.path}>{renderScreen(resolved)}</TermScope>
    </AppShell>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Routed />
    </ToastProvider>
  );
}
