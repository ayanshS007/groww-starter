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
  brandText: '#007A5A',
  caution: '#9A5B00',
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
};

export const dark: ColorTokens = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#273449',
  border: '#334155',
  ink: '#E5E7EB',
  inkMuted: '#A3AEC2',
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
};

/** Text-on-background pairs that must reach WCAG AA (4.5:1). */
export const TEXT_PAIRS: [keyof ColorTokens, keyof ColorTokens][] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'surface2'],
  ['inkMuted', 'bg'],
  ['inkMuted', 'surface'],
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
];

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
