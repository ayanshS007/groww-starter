// WCAG 2.x relative luminance and contrast ratio for #RRGGBB colours.

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Colour `fg` painted at `alpha` over opaque `bg`, as #RRGGBB. */
export function blend(fg: string, bg: string, alpha: number): string {
  const f = parseInt(fg.slice(1), 16);
  const b = parseInt(bg.slice(1), 16);
  const mix = (shift: number) => Math.round(((f >> shift) & 255) * alpha + ((b >> shift) & 255) * (1 - alpha));
  return '#' + [16, 8, 0].map((sh) => mix(sh).toString(16).padStart(2, '0')).join('').toUpperCase();
}
