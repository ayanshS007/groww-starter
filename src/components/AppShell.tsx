// Responsive shell (README 4.1): bottom tabs < 1024 px (centred at 600 px on
// tablet), sidebar + top bar from 1024 px. Nav is hidden inside flows.
import type { ReactNode } from 'react';
import { STORAGE_NOTICE, useStore } from '../state/store';
import type { ScreenId } from '../lib/routes';
import { activeNav, SCREEN_TITLE } from './nav';
import { ReviewerPanel } from './ReviewerPanel';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { TopBar } from './TopBar';

type Props = { screen: ScreenId; flow: boolean; children: ReactNode };

function StorageNotice() {
  const { storageOk } = useStore();
  if (storageOk) return null;
  return <p className="mb-4 rounded-card-sm bg-caution-fill px-4 py-2 text-sm text-caution">{STORAGE_NOTICE}</p>;
}

export function AppShell({ screen, flow, children }: Props) {
  const { state } = useStore();

  if (flow || screen === 'landing') {
    return (
      <>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
          Skip to content
        </a>
        <div className="flex min-h-full flex-col">
          {(
            <div className="mx-auto max-w-tablet px-safe pt-2">
              <StorageNotice />
            </div>
          )}
          {children}
        </div>
        <ReviewerPanel />
      </>
    );
  }

  const active = activeNav(screen);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="min-h-full lg:flex">
        <Sidebar active={active} state={state} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={SCREEN_TITLE[screen]} name={state.user.name} search={screen === 'explore'} />
          <main
            id="main"
            tabIndex={-1}
            className="flex-1 pb-[calc(96px+env(safe-area-inset-bottom))] outline-none lg:pb-12"
          >
            <div className="mx-auto w-full max-w-tablet px-safe pt-4 lg:max-w-content lg:px-8 lg:pt-6">
              <StorageNotice />
              {children}
            </div>
          </main>
        </div>
      </div>
      <TabBar active={active} />
      <ReviewerPanel />
    </>
  );
}
