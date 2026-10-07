// Letter avatar for funds and sample companies (no logos, no images).
const TINTS = ['bg-mint', 'bg-lavender', 'bg-peach', 'bg-sky'] as const;

/** "Short Duration Debt Fund" → "SD"; "Tealeaf Kitchens (sample)" → "TK". */
export function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, '').match(/[A-Za-z0-9]+/g) ?? [];
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function LetterAvatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const tint = TINTS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TINTS.length];
  const dims = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-11 w-11 text-sm';
  return (
    <span aria-hidden className={`flex ${dims} shrink-0 items-center justify-center rounded-full ${tint} font-bold text-ink`}>
      {initials(name)}
    </span>
  );
}
