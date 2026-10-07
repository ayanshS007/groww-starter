import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../data/glossary';
import { claimTerm, releaseTerm, searchGlossary } from './terms';

describe('Term first appearance (PLAN C8)', () => {
  it('only the first appearance of a term is underlined', () => {
    const owners = new Map<string, string>();
    expect(claimTerm(owners, 'sip', 'a')).toBe(true);
    expect(claimTerm(owners, 'sip', 'b')).toBe(false);
    expect(claimTerm(owners, 'nav', 'b')).toBe(true);
  });
  it('the owner keeps its underline on re-render', () => {
    const owners = new Map<string, string>();
    claimTerm(owners, 'sip', 'a');
    claimTerm(owners, 'sip', 'b');
    expect(claimTerm(owners, 'sip', 'a')).toBe(true);
  });
  it('a released term can be claimed again; others cannot release it', () => {
    const owners = new Map<string, string>();
    claimTerm(owners, 'sip', 'a');
    releaseTerm(owners, 'sip', 'b');
    expect(claimTerm(owners, 'sip', 'b')).toBe(false);
    releaseTerm(owners, 'sip', 'a');
    expect(claimTerm(owners, 'sip', 'b')).toBe(true);
  });
});

describe('glossary search', () => {
  it('lists every term A–Z when the query is empty', () => {
    const all = searchGlossary(GLOSSARY, '  ');
    expect(all).toHaveLength(GLOSSARY.length);
    const names = all.map((t) => t.term);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });
  it('matches term or meaning, ignoring case', () => {
    expect(searchGlossary(GLOSSARY, 'nav').map((t) => t.id)).toContain('nav');
    expect(searchGlossary(GLOSSARY, 'PRICE OF ONE UNIT').map((t) => t.id)).toEqual(['nav']);
  });
  it('returns an empty list for no match (empty search state)', () => {
    expect(searchGlossary(GLOSSARY, 'zzzz')).toEqual([]);
  });
});
