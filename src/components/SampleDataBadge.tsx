// Small grey "Sample data" label near the top of screens that show made-up
// funds, prices or returns (Stage 9, from user feedback). Calm on purpose:
// muted text on a neutral fill, no icon, no colour.
export function SampleDataBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-ink-muted ${className}`}>Sample data</span>
  );
}
