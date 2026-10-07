import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { StoreProvider } from './state/store';

describe('App placeholder', () => {
  it('renders "Groww Starter"', () => {
    const html = renderToString(
      <StoreProvider storage={null} today="2026-10-07">
        <App />
      </StoreProvider>,
    );
    expect(html).toContain('Groww Starter');
  });
  it('shows the storage notice when storage is unavailable, instead of crashing', () => {
    const html = renderToString(
      <StoreProvider storage={null} today="2026-10-07">
        <App />
      </StoreProvider>,
    );
    expect(html).toContain('Progress won’t be saved in this browser.');
  });
});
