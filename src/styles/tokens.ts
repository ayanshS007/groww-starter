// Single source of truth for colour tokens. Tailwind turns these into CSS
// variables on :root (light) and under prefers-color-scheme: dark.
// src/lib/contrast.test.ts checks every text/background pair below.

export type ColorTokens = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  ink: string;
  inkMuted: string;
  brand: string; // fills and primary buttons only
  onBrand: string; // text on brand fills (ink, not white: PLAN 43)
  brandText: string; // links and green text, ≥ 4.5:1 on bg/surface
  caution: string; // caution text, ≥ 4.5:1
  cautionFill: string; // amber fills behind caution text
  cautionIcon: string; // light amber for icons and fills only
  info: string;
  infoFill: string;
  mint: string;
  lavender: string;
  peach: string;
  sky: string;
  marketUp: string; // Pro view market prices only
  marketDown: string; // Pro view market prices only, never the user's own money
  focus: string;
  // Chart fills (Dashboard donut and value chart). Identity only, always with a
  // text legend. Validated with the dataviz palette checker (all pairs, CVD).
  chartCushion: string;
  chartGrow: string;
  chartGold: string;
  chartStocks: string; // neutral grey: the fourth slot can't be a fourth hue
  chartInvested: string; // invested step line
  // Home's drifting background blobs. Decoration only, drawn at BLOB_ALPHA.
  blobGreen: string;
  blobMint: string;
  blobLavender: string;
  // Stage 6a. The user's own loss: a soft rose, always with ▼ and a sign. Never
  // alarm red (marketDown is for Pro market prices only).
  ownDown: string;
  gold: string; // payday accent: borders, icon chips and the glow only
  goldFill: string; // payday card fill behind ink text
  ringStart: string; // goal ring at 0%, warms to brand at 100% (decoration)
}

/**
 * Peak opacity of each Home blob, per colour scheme. The contrast test blends
 * every single blob and every overlapping pair at these values over the page
 * background and re-checks the text pairs that sit directly on it.
 */
export const BLOB_ALPHA = {
  light: { green: 0.13, mint: 0.17, lavender: 0.16 },
  dark: { green: 0.14, mint: 0.16, lavender: 0.18 },
} as const;

export function blobAlphaVars(a: (typeof BLOB_ALPHA)[keyof typeof BLOB_ALPHA]): Record<string, string> {
  return { '--blob-a-green': String(a.green), '--blob-a-mint': String(a.mint), '--blob-a-lavender': String(a.lavender) };
}

export const light: ColorTokens = {
  bg: '#F7F9F8',
  surface: '#FFFFFF',
  surface2: '#F1F4F3',
  border: '#E3E8E6',
  ink: '#1F2937',
  inkMuted: '#4B5563',
  brand: '#00D09C',
  onBrand: '#1F2937',
  brandText: '#00704F',
  caution: '#8C5300',
  cautionFill: '#FDF1DA',
  cautionIcon: '#F5A524',
  info: '#3B4FE0',
  infoFill: '#ECEFFF',
  mint: '#E8F7F1',
  lavender: '#EFEBFB',
  peach: '#FDEEE4',
  sky: '#E6F2FB',
  marketUp: '#15803D',
  marketDown: '#B42318',
  focus: '#3B4FE0',
  chartCushion: '#2A78D6',
  chartGrow: '#1BAF7A',
  chartGold: '#EDA100',
  chartStocks: '#8A94A6',
  chartInvested: '#6B7280',
  blobGreen: '#5EEBC2',
  blobMint: '#A9F5DC',
  blobLavender: '#CFC3FF',
  ownDown: '#A8345A',
  gold: '#E9B23C',
  goldFill: '#FFF4D6',
  ringStart: '#A6EBD3',
};

export const dark: ColorTokens = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#273449',
  border: '#334155',
  ink: '#E5E7EB',
  inkMuted: '#B8C1D0',
  brand: '#00D09C',
  onBrand: '#0B1220',
  brandText: '#3DE0B5',
  caution: '#F5C04A',
  cautionFill: '#3A2E12',
  cautionIcon: '#F5C04A',
  info: '#8EA0FF',
  infoFill: '#1F2A4D',
  mint: '#13362F',
  lavender: '#2A2545',
  peach: '#3A2A22',
  sky: '#17304A',
  marketUp: '#4ADE80',
  marketDown: '#F87171',
  focus: '#8EA0FF',
  chartCushion: '#3987E5',
  chartGrow: '#199E70',
  chartGold: '#C98500',
  chartStocks: '#64748B',
  chartInvested: '#A3AEC2',
  blobGreen: '#00D09C',
  blobMint: '#2FBF9A',
  blobLavender: '#7A6AE0',
  ownDown: '#F6B3C8',
  gold: '#D9A63A',
  goldFill: '#3A3016',
  ringStart: '#2C7A64',
};

/** Text-on-background pairs that must reach WCAG AA (4.5:1). */
export const TEXT_PAIRS: [keyof ColorTokens, keyof ColorTokens][] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'surface2'],
  ['inkMuted', 'bg'],
  ['inkMuted', 'surface'],
  ['inkMuted', 'surface2'],
  ['onBrand', 'brand'],
  ['brandText', 'bg'],
  ['brandText', 'surface'],
  ['brandText', 'mint'],
  ['caution', 'bg'],
  ['caution', 'surface'],
  ['caution', 'cautionFill'],
  ['info', 'surface'],
  ['info', 'infoFill'],
  ['ink', 'mint'],
  ['ink', 'lavender'],
  ['ink', 'peach'],
  ['ink', 'sky'],
  ['ink', 'cautionFill'],
  ['marketUp', 'surface'],
  ['marketDown', 'surface'],
  // Stage 6a: the user's own change sits on cards, KPI tints and the page.
  ['ownDown', 'bg'],
  ['ownDown', 'surface'],
  ['ownDown', 'surface2'],
  ['ownDown', 'mint'],
  ['ownDown', 'peach'],
  ['ownDown', 'lavender'],
  ['ownDown', 'sky'],
  ['brandText', 'peach'],
  ['brandText', 'surface2'],
  ['ink', 'goldFill'],
  ['onBrand', 'gold'],
  ['inkMuted', 'goldFill'],
  ['brandText', 'goldFill'],
];

/** Text pairs that sit straight on the page background, where Home's blobs can sit behind them. */
export const BLOB_TEXT_FG: (keyof ColorTokens)[] = ['ink', 'inkMuted', 'brandText', 'caution', 'ownDown'];

// ---------- Stage 6a: market mood, time of day, payday ----------
export const MOODS = ['up', 'flat', 'small_dip', 'big_dip'] as const;
export type Mood = (typeof MOODS)[number];
export const TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'night'] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];
type Scheme = 'light' | 'dark';

/**
 * What each mood changes, app-wide, through CSS variables on <html data-mood>:
 * the page background (`--c-bg`), a soft glow at the top of every screen, the
 * three Home blob colours (slots green / mint / lavender) and how fast they drift.
 */
export type MoodTokens = { bg: string; glow: string; glowAlpha: number; blobs: [string, string, string]; blobPace: number };

export const MOOD_TOKENS: Record<Scheme, Record<Mood, MoodTokens>> = {
  light: {
    up: { bg: '#F2FAF6', glow: '#5EEBC2', glowAlpha: 0.18, blobs: ['#5EEBC2', '#7FF0C9', '#A9F5DC'], blobPace: 1 },
    flat: { bg: light.bg, glow: '#A9F5DC', glowAlpha: 0.14, blobs: [light.blobGreen, light.blobMint, light.blobLavender], blobPace: 1 },
    small_dip: { bg: '#FBF6F3', glow: '#FFC7AE', glowAlpha: 0.2, blobs: ['#FFC9B0', '#F9C0CF', '#CFC3FF'], blobPace: 1 },
    big_dip: { bg: '#FBF3F5', glow: '#F6B3C6', glowAlpha: 0.2, blobs: ['#F6B3C6', '#D9CCFF', '#FFD1BD'], blobPace: 2.5 },
  },
  dark: {
    up: { bg: '#0D1A27', glow: '#00D09C', glowAlpha: 0.12, blobs: ['#00B386', '#25A383', '#2A8F7A'], blobPace: 1 },
    flat: { bg: dark.bg, glow: '#2FBF9A', glowAlpha: 0.06, blobs: [dark.blobGreen, dark.blobMint, dark.blobLavender], blobPace: 1 },
    small_dip: { bg: '#16162B', glow: '#E39A7F', glowAlpha: 0.1, blobs: ['#C9785F', '#B5607E', '#7A6AE0'], blobPace: 1 },
    big_dip: { bg: '#191529', glow: '#D77A9B', glowAlpha: 0.11, blobs: ['#B5607E', '#7A6AE0', '#9A5A6E'], blobPace: 2.5 },
  },
};

/** Home's sky: a gradient at the top of Home that follows the simulated time of day. */
export const TOD_TOKENS: Record<Scheme, Record<TimeOfDay, { sky: string; alpha: number }>> = {
  light: {
    morning: { sky: '#FFD8A8', alpha: 0.26 },
    afternoon: { sky: '#BFE3FF', alpha: 0.26 },
    evening: { sky: '#E7C6F5', alpha: 0.24 },
    night: { sky: '#C3CAFF', alpha: 0.22 },
  },
  dark: {
    morning: { sky: '#5C3B1E', alpha: 0.18 },
    afternoon: { sky: '#1A3F63', alpha: 0.2 },
    evening: { sky: '#40285C', alpha: 0.22 },
    night: { sky: '#1A2366', alpha: 0.3 },
  },
};

/** Payday glow: in the week pay is credited, Home's third blob turns gold. */
export const GOLD_BLOB: Record<Scheme, { colour: string; alpha: number }> = {
  light: { colour: '#FFD36B', alpha: 0.2 },
  dark: { colour: '#C9961F', alpha: 0.14 },
};

function moodVars(m: MoodTokens): Record<string, string> {
  return {
    '--c-bg': hexToRgbChannels(m.bg),
    '--c-mood-glow': hexToRgbChannels(m.glow),
    '--mood-glow-a': String(m.glowAlpha),
    '--c-blob-green': hexToRgbChannels(m.blobs[0]),
    '--c-blob-mint': hexToRgbChannels(m.blobs[1]),
    '--c-blob-lavender': hexToRgbChannels(m.blobs[2]),
    '--blob-pace': String(m.blobPace),
  };
}

/** Rules for one colour scheme: defaults on :root, then one block per mood and per time of day. */
export function ambienceCss(scheme: Scheme): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {
    ':root': {
      ...moodVars(MOOD_TOKENS[scheme].flat),
      '--c-tod-sky': hexToRgbChannels(TOD_TOKENS[scheme].afternoon.sky),
      '--tod-a': '0',
      '--c-blob-gold': hexToRgbChannels(GOLD_BLOB[scheme].colour),
      '--blob-a-gold': String(GOLD_BLOB[scheme].alpha),
    },
  };
  for (const mood of MOODS) out[`:root[data-mood="${mood}"]`] = moodVars(MOOD_TOKENS[scheme][mood]);
  for (const tod of TIMES_OF_DAY) {
    const t = TOD_TOKENS[scheme][tod];
    out[`:root[data-tod="${tod}"]`] = { '--c-tod-sky': hexToRgbChannels(t.sky), '--tod-a': String(t.alpha) };
  }
  return out;
}

const toVarName = (k: string) => '--c-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

export function hexToRgbChannels(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function cssVars(tokens: ColorTokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) out[toVarName(k)] = hexToRgbChannels(v);
  return out;
}

export function tailwindColors(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(light)) {
    const name = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    out[name] = `rgb(var(${toVarName(k)}) / <alpha-value>)`;
  }
  return out;
}
