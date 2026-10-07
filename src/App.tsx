// Root: hash routing with guards, the responsive shell and every Stage 3a screen.
// Screens for later stages render a "next build" placeholder so no link dead-ends.
import { useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { SCREEN_TITLE } from './components/nav';
import { TermScope } from './components/Term';
import { ToastProvider, useToast } from './components/Toast';
import { FLOW_SCREENS, type Resolved } from './lib/routes';
import { useLocation, useRoute } from './router';
import { Checkin } from './screens/Checkin';
import { Glossary } from './screens/Glossary';
import { Home } from './screens/Home';
import { Kyc } from './screens/Kyc';
import { Landing } from './screens/Landing';
import { Learn } from './screens/Learn';
import { NotYetBuilt } from './screens/NotYetBuilt';
import { Plan } from './screens/Plan';
import { Review } from './screens/Review';
import { Signup } from './screens/Signup';
import { You } from './screens/You';
import { useStore } from './state/store';

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
