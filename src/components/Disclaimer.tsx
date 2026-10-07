export const DISCLAIMER = 'Illustrative prototype. All prices and returns are sample data. Investments are subject to market risks.';

export function Disclaimer({ className = '' }: { className?: string }) {
  return <p className={`text-xs text-ink-muted ${className}`}>{DISCLAIMER}</p>;
}
