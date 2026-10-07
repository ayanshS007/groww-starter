// Text wordmark only (CLAUDE.md: no logos).
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-ink">Groww</span>
      <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-brand-text">Starter</span>
    </span>
  );
}
