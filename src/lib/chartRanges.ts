// Pro chart ranges on fund and stock detail (Stage 6b). The sample series has 24
// points; each range shows its last part. Illustrative windows, not real dates.
export const CHART_RANGES = ['1W', '1M', '1Y', 'All'] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

const WINDOW: Record<ChartRange, number> = { '1W': 5, '1M': 10, '1Y': 18, All: 24 };

export function sliceRange(points: number[], range: ChartRange): number[] {
  return points.slice(-Math.min(points.length, WINDOW[range]));
}
