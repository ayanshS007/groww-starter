// Inline SVG icon set (README 6.1: no icon fonts, no remote images).
// Decorative by default; pass `label` when the icon carries meaning on its own.
import type { SVGProps } from 'react';

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z',
  portfolio: 'M4 7h16v12H4zM9 7V5h6v2M4 12h16',
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  book: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM17 7h2v13h-2M5 17a3 3 0 0 1 3-3h9',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6 6 18',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 9l7 7 7-7',
  check: 'M5 12.5 10 17l9-10',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  caution: 'M12 4 2.5 20h19zM12 10v4.5M12 17v.5',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 5l12 7-12 7z',
  skip: 'M5 5l9 7-9 7zM18 5v14',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 13h2',
  shield: 'M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z',
  sparkle: 'M12 4v4M12 16v4M4 12h4M16 12h4',
  star: 'M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16l-5 3 1.2-5.6L4 9.6 9.6 9z',
  bookmark: 'M7 4h10v16l-5-4-5 4z',
  // Stage 6a: check-in tiles, clock and mood.
  cap: 'M2.5 9 12 5l9.5 4L12 13zM6.5 11v4.5c3 2.5 8 2.5 11 0V11M21.5 9v5',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  sprout: 'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  coins: 'M9 7a5 2 0 1 0 0.01 0zM4 7v4c0 1.1 2.2 2 5 2s5-.9 5-2V7M10 15c0 1.1 2.2 2 5 2s5-.9 5-2v-4c0-1.1-2.2-2-5-2',
  exit: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  // Rising bars; the bars not reached show as dots on the baseline.
  level1: 'M4.5 19v-4M10 19h0M15 19h0M20 19h0',
  level2: 'M4.5 19v-4M10 19v-7M15 19h0M20 19h0',
  level3: 'M4.5 19v-4M10 19v-7M15 19v-10M20 19h0',
  level4: 'M4.5 19v-4M10 19v-7M15 19v-10M20 19V5',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  leaf: 'M5 19C5 10 11 5 20 4c-1 9-6 15-15 15zM5 19l7-7',
} as const;

export type IconName = keyof typeof PATHS;

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number; label?: string };

export function Icon({ name, size = 24, label, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[];
