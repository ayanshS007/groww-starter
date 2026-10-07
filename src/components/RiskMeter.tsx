// Risk as text plus 5 segments; never colour alone (README 9 item 8, 11).
export const RISK_LABEL: Record<number, string> = {
  1: 'Low risk',
  2: 'Low to moderate risk',
  3: 'Moderate risk',
  4: 'Moderately high risk',
  5: 'High risk',
};

export function RiskMeter({ risk, className = '' }: { risk: 1 | 2 | 3 | 4 | 5; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span aria-hidden className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-2 w-5 rounded-full ${n <= risk ? 'bg-ink' : 'bg-ink/15'}`} />
        ))}
      </span>
      <span className="text-sm font-medium text-ink">
        {RISK_LABEL[risk]} <span className="text-ink-muted">({risk} of 5)</span>
      </span>
    </div>
  );
}
