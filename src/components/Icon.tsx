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
