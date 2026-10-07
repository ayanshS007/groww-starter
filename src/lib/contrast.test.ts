import { describe, expect, it } from 'vitest';
import { blend, contrastRatio } from './contrast';
import { BLOB_ALPHA, BLOB_TEXT_FG, dark, light, TEXT_PAIRS } from '../styles/tokens';

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

describe.each([
  ['light', light, BLOB_ALPHA.light],
  ['dark', dark, BLOB_ALPHA.dark],
])('%s: text over Home\u2019s background blobs', (_name, tokens, alpha) => {
  const blobs = [
    { name: 'green', colour: tokens.blobGreen, a: alpha.green },
    { name: 'mint', colour: tokens.blobMint, a: alpha.mint },
    { name: 'lavender', colour: tokens.blobLavender, a: alpha.lavender },
  ];
  // Every single blob, and every pair overlapping at full strength (the layout
  // keeps the third blob in another corner, so all three never overlap).
  const cases = [
    ...blobs.map((b) => ({ label: b.name, layers: [b] })),
    ...blobs.flatMap((b, i) => blobs.slice(i + 1).map((c) => ({ label: `${b.name} + ${c.name}`, layers: [b, c] }))),
  ].map((c) => ({ label: c.label, bg: c.layers.reduce((bg, l) => blend(l.colour, bg, l.a), tokens.bg) }));

  it('every blob stays a faint wash (never more than 1.35:1 against the page)', () => {
    for (const c of cases.slice(0, 3)) expect(contrastRatio(c.bg, tokens.bg)).toBeLessThan(1.35);
  });
  it.each(BLOB_TEXT_FG)('%s on the page background keeps 4.5:1 under any blob or overlapping pair', (fg) => {
    for (const c of cases) expect(contrastRatio(tokens[fg], c.bg), `${fg} over ${c.label}`).toBeGreaterThanOrEqual(4.5);
  });
});
