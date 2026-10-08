import { describe, expect, it } from 'vitest';
import { FUNDS, getFund } from '../data/funds';
import { buildPersona } from '../data/personas';
import { filterFunds, fundFit, hasAnyFilter, NO_FILTERS, parseFrom, sheetFilterCount } from './explore';
import { fresh, startSip, TODAY, withCheckin } from '../test/fixtures';

const f = (patch: Partial<typeof NO_FILTERS>) => filterFunds(FUNDS, { ...NO_FILTERS, ...patch }, []).map((x) => x.id);

describe('filterFunds', () => {
  it('no filters keeps all 10 funds in data order (never sorted by returns)', () => {
    expect(f({})).toEqual(FUNDS.map((x) => x.id));
  });
  it('search matches name and type; every word must match', () => {
    expect(f({ query: 'gold' })).toEqual(['gold1']);
    expect(f({ query: 'liquid fund' })).toEqual(['liquid1', 'liquid2']);
    expect(f({ query: 'zzzz' })).toEqual([]);
  });
  it('collections, category, risk bands and min SIP combine', () => {
    expect(f({ collection: 'need_this_year' })).toEqual(['liquid1', 'liquid2']);
    expect(f({ category: 'Index' })).toEqual(['index50', 'indexnext50', 'index50b']);
    expect(f({ risks: ['low'] })).toEqual(['liquid1', 'liquid2', 'shortdebt1', 'arb1', 'shortdebt2']);
    expect(f({ risks: ['high'], maxMinSip: 100 })).toEqual(['index50', 'indexnext50', 'flexi1', 'midcap1', 'index50b', 'flexi2']);
    expect(f({ maxMinSip: 100 })).not.toContain('arb1');
  });
  it('Saved collection uses the watchlist', () => {
    expect(filterFunds(FUNDS, { ...NO_FILTERS, collection: 'saved' }, ['gold1']).map((x) => x.id)).toEqual(['gold1']);
    expect(filterFunds(FUNDS, { ...NO_FILTERS, collection: 'saved' }, [])).toEqual([]);
  });
  it('counts sheet filters', () => {
    expect(sheetFilterCount({ ...NO_FILTERS, risks: ['low'], maxMinSip: 500 })).toBe(2);
    expect(hasAnyFilter(NO_FILTERS)).toBe(false);
    expect(hasAnyFilter({ ...NO_FILTERS, query: ' x ' })).toBe(true);
  });
});

describe('fundFit (PLAN items 6, 30)', () => {
  const kabir = buildPersona('kabir', TODAY); // 1–3 yrs, would sell
  const planned = withCheckin(fresh()); // 5+ yrs, wait

  it('a fund in a plan category has no mismatch banner, says it is one of the category, and cites ≥ 2 answers', () => {
    const fit = fundFit(getFund('index50')!, planned);
    expect(fit.bucket?.role).toBe('grow');
    expect(fit.banners.some((b) => b.tone === 'caution')).toBe(false);
    expect(fit.banners.map((b) => b.text)).toEqual([
      'This is one of the Nifty 50 index funds in your starter plan. The plan names the category. Which fund you pick is up to you.',
    ]);
    // "Why am I seeing this?" is about the category, and the other fund in it reads the same way.
    expect(fit.why).toContain('Its category, Nifty 50 index funds, is the grow part of your starter plan');
    expect(fundFit(getFund('index50b')!, planned).bucket?.category).toBe('index50');
    expect(fit.bucket!.citedAnswers.length).toBeGreaterThanOrEqual(2);
  });
  it('a longer-horizon fund names both horizons and a risk mismatch', () => {
    const fit = fundFit(getFund('index50')!, kabir, 'search');
    const text = fit.banners.map((b) => b.text).join(' ');
    expect(text).toContain('Your time frame is 1–3 yrs; this fund suits 5+ yrs');
    expect(text).toContain('probably sell');
    expect(fit.banners.some((b) => b.text.includes('isn’t part of your starter plan'))).toBe(true);
    expect(fit.why).toContain('found this fund by searching');
    expect(fit.why).toMatch(/time frame/);
    expect(fit.why).toMatch(/probably sell/);
  });
  it('a shorter-horizon fund is not a caution, but the text says it may grow slowly', () => {
    const fit = fundFit(getFund('arb1')!, planned);
    expect(fit.banners.some((b) => b.tone === 'caution')).toBe(false);
    expect(fit.why).toContain('may grow slowly');
  });
  it('Mid Cap (7+ yrs) for a 5+ yrs user is not called "the same as your time frame"', () => {
    const fit = fundFit(getFund('midcap1')!, planned);
    expect(fit.why).toContain('this fund suits 7+ yrs');
    expect(fit.why).not.toContain('the same as your time frame');
    expect(fit.why).toContain('at the longer end');
    expect(fit.why).toContain('7 years or more');
    expect(fit.banners.some((b) => b.tone === 'caution' && b.text.includes('time frame'))).toBe(false);
  });
  it('a fund with the same label as the time frame still reads "the same as your time frame"', () => {
    expect(fundFit(getFund('flexi1')!, planned).why).toContain('the same as your time frame');
  });
  it('browse mode offers the check-in instead of citing answers', () => {
    const fit = fundFit(getFund('gold1')!, fresh());
    expect(fit.banners[0].cta?.label).toBe('Take the check-in');
    expect(fit.why).toContain('haven’t done the check-in');
  });
  it('a SIP in a fund that is not in the plan is called out', () => {
    const s = startSip(planned, 'gold1', 500);
    expect(fundFit(getFund('gold1')!, s).banners.map((b) => b.text).join(' ')).toContain('already have a SIP');
  });
  it('parseFrom only accepts known sources', () => {
    expect(parseFrom('search')).toBe('search');
    expect(parseFrom('x')).toBe('link');
    expect(parseFrom(undefined)).toBe('link');
  });
});
