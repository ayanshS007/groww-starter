// Letter avatar for the user (no images).
export function Avatar({ name, size = 'md' }: { name?: string; size?: 'md' | 'lg' }) {
  // The large avatar sits on a lavender card, so it uses the surface colour.
  const letter = name?.trim()[0]?.toUpperCase() ?? '';
  const dims = size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-9 w-9 text-base';
  return (
    <span aria-hidden className={`flex ${dims} shrink-0 items-center justify-center rounded-full ${size === 'lg' ? 'bg-surface' : 'bg-lavender'} font-bold text-ink`}>
      {letter || (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />
        </svg>
      )}
    </span>
  );
}
