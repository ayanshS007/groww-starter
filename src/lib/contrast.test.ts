import { describe, expect, it } from 'vitest';
import { blend, contrastRatio } from './contrast';
import { BLOB_ALPHA, BLOB_TEXT_FG, dark, GOLD_BLOB, light, MOOD_TOKENS, MOODS, TEXT_PAIRS, TIMES_OF_DAY, TOD_TOKENS } from '../styles/tokens';

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

// Stage 6a: every market mood tints the page (and Home adds a time-of-day sky,
// a payday gold blob and mood-coloured blobs). Text that sits straight on the
// page must keep 4.5:1 in each mood, in light and dark, in the worst overlap.
describe.each([
  ['light', light, BLOB_ALPHA.light, 'light'],
  ['dark', dark, BLOB_ALPHA.dark, 'dark'],
] as const)('%s: market mood tints', (_name, tokens, alpha, scheme) => {
  describe.each(MOODS)('%s', (mood) => {
    const m = MOOD_TOKENS[scheme][mood];
    const moodTokens = { ...tokens, bg: m.bg };

    it.each(TEXT_PAIRS.filter(([, bg]) => bg === 'bg'))('%s on the %s tint reaches 4.5:1', (fg) => {
      expect(contrastRatio(moodTokens[fg], m.bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('the tint stays a soft wash next to the base page (under 1.1:1)', () => {
      expect(contrastRatio(m.bg, tokens.bg)).toBeLessThan(1.1);
    });

    // Layers, bottom to top: mood tint → mood glow → time-of-day sky → blobs.
    // In the payday week the third blob turns gold (GOLD_BLOB), so both are tried.
    const backgrounds: { label: string; bg: string }[] = [];
    for (const payday of [false, true]) {
      const blobs = [
        { colour: m.blobs[0], a: alpha.green },
        { colour: m.blobs[1], a: alpha.mint },
        payday ? { colour: GOLD_BLOB[scheme].colour, a: GOLD_BLOB[scheme].alpha } : { colour: m.blobs[2], a: alpha.lavender },
      ];
      const blobSets = [[], ...blobs.map((b) => [b]), ...blobs.flatMap((b, i) => blobs.slice(i + 1).map((c) => [b, c]))];
      for (const tod of [null, ...TIMES_OF_DAY]) {
        for (const [bi, set] of blobSets.entries()) {
          let bg = blend(m.glow, m.bg, m.glowAlpha);
          if (tod) bg = blend(TOD_TOKENS[scheme][tod].sky, bg, TOD_TOKENS[scheme][tod].alpha);
          for (const b of set) bg = blend(b.colour, bg, b.a);
          backgrounds.push({ label: `${tod ?? 'no sky'}, blob set ${bi}${payday ? ', payday gold' : ''}`, bg });
        }
      }
    }
    it.each(BLOB_TEXT_FG)('%s keeps 4.5:1 over every glow, sky and blob overlap', (fg) => {
      for (const b of backgrounds) expect(contrastRatio(tokens[fg], b.bg), `${fg} over ${b.label}`).toBeGreaterThanOrEqual(4.5);
    });
  });
});
