// Rounded surface (16–24 px radius) with optional pastel tint (README 10).
import type { HTMLAttributes } from 'react';

export type Tint = 'plain' | 'mint' | 'lavender' | 'peach' | 'sky' | 'caution' | 'info';

const TINTS: Record<Tint, string> = {
  plain: 'bg-surface border border-border',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  peach: 'bg-peach',
  sky: 'bg-sky',
  caution: 'bg-caution-fill',
  info: 'bg-info-fill',
};

type Props = HTMLAttributes<HTMLElement> & { tint?: Tint; as?: 'section' | 'div' | 'article' | 'aside'; pad?: 'sm' | 'md' | 'lg' };

const PAD = { sm: 'p-4', md: 'p-5', lg: 'p-6 lg:p-7' } as const;

export function Card({ tint = 'plain', as: Tag = 'section', pad = 'md', className = '', ...rest }: Props) {
  return <Tag className={`rounded-card ${TINTS[tint]} ${PAD[pad]} ${className}`} {...rest} />;
}
