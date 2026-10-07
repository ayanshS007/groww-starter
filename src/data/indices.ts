// Sample market indices for the Pro view index strip only (README 9 item 22).
// Fictional names and levels; they move with the simulated weekly scenario.
export type SampleIndex = { id: string; name: string; base: number; vol: number };

export const SAMPLE_INDICES: SampleIndex[] = [
  { id: 'idx_large50', name: 'Large 50 (sample)', base: 24000, vol: 1.0 },
  { id: 'idx_next50', name: 'Next 50 (sample)', base: 66000, vol: 1.25 },
  { id: 'idx_mid150', name: 'Mid 150 (sample)', base: 19500, vol: 1.45 },
  { id: 'idx_banks', name: 'Banks (sample)', base: 51000, vol: 1.1 },
  { id: 'idx_gold', name: 'Gold (sample)', base: 7200, vol: 0.4 },
];
