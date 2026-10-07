import { describe, expect, it } from 'vitest';
import { buildPersona } from '../data/personas';
import { fresh, TODAY } from '../test/fixtures';
import { jumpLinks } from './jumpLinks';
import { parseHash, resolveRoute, ROUTE_PATTERNS } from './routes';

describe('reviewer jump links', () => {
  it('has one link per route pattern', () => {
    expect(jumpLinks(fresh()).map((l) => l.pattern)).toEqual(ROUTE_PATTERNS);
  });
  it('fills record ids from state; every link without a note opens its screen', () => {
    for (const state of [buildPersona('riya', TODAY), fresh()]) {
      for (const l of jumpLinks(state)) {
        expect(resolveRoute(parseHash('#' + l.to), state).kind).toBe(l.note ? 'redirect' : 'screen');
      }
    }
    const notes = jumpLinks(buildPersona('riya', TODAY)).filter((l) => l.note).map((l) => l.pattern);
    expect(notes).toEqual(['/signup', '/kyc/:step']);
  });
  it('marks links that will redirect on a fresh state', () => {
    const links = jumpLinks(fresh());
    expect(links.find((l) => l.pattern === '/portfolio/sip/:id')?.note).toMatch(/redirects/);
    expect(links.find((l) => l.pattern === '/plan')?.note).toMatch(/redirects/);
    expect(links.find((l) => l.pattern === '/fund/:id')).toEqual({ pattern: '/fund/:id', to: '/fund/index50' });
  });
});
