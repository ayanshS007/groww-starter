import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { dark, light, TEXT_PAIRS } from '../styles/tokens';

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
  it('white on brand green fails AA, which is why buttons use ink text', () => {
    expect(contrastRatio('#FFFFFF', light.brand)).toBeLessThan(4.5);
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
])('%s tokens', (_name, tokens) => {
  it.each(TEXT_PAIRS)('%s on %s reaches 4.5:1', (fg, bg) => {
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on brand buttons is about 7:1 or better', () => {
    expect(contrastRatio(tokens.onBrand, tokens.brand)).toBeGreaterThanOrEqual(7);
  });
});
