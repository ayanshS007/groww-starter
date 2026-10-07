// Root: hash routing with guards, the responsive shell and every Stage 3a and 3b screen.
// SIP detail and Stop coach (Stage 3c) still render a "next build" placeholder so no link dead-ends.
import { useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { SCREEN_TITLE } from './components/nav';
import { TermScope } from './components/Term';
import { ToastProvider, useToast } from './components/Toast';
import { FLOW_SCREENS, type Resolved } from './lib/routes';
import { useLocation, useRoute } from './router';
import { Checkin } from './screens/Checkin';
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
import { NotYetBuilt } from './screens/NotYetBuilt';
import { Plan } from './screens/Plan';
import { Portfolio } from './screens/Portfolio';
import { Review } from './screens/Review';
import { Signup } from './screens/Signup';
import { Success } from './screens/Success';
import { You } from './screens/You';
import { useStore } from './state/store';
import type { FundId } from './state/types';

type ScreenRoute = Extract<Resolved, { kind: 'screen' }>;

export function renderScreen(r: ScreenRoute) {
  const flow = FLOW_SCREENS.includes(r.screen);
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
      return <Explore />;
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
      return <HoldingDetail id={r.params.id} />;
    case 'learn':
      return <Learn />;
    case 'glossary':
      return <Glossary query={r.query} />;
    case 'you':
      return <You />;
    case 'review':
      return <Review />;
    default:
      return <NotYetBuilt title={SCREEN_TITLE[r.screen]} flow={flow} />;
  }
}

function Routed() {
  const { state } = useStore();
  const toast = useToast();
  const resolved = useRoute(state, toast.show);
  const loc = useLocation();
  const first = useRef(true);
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
