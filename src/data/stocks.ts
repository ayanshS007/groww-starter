// Fictional sample companies (README 7.2). Every name ends with "(sample)";
// prices are illustrative and do not track any real company.
import type { Stock } from '../state/types';
import { sampleSparkline } from './funds';

type Seed = Omit<Stock, 'sparkline' | 'week52'> & { seed: number };

const SEEDS: Seed[] = [
  {
    id: 'stk_tealeaf',
    name: 'Tealeaf Kitchens (sample)',
    ticker: 'TEALEAF',
    sector: 'Packaged food',
    price: 1240,
    whatTheyDo: 'Makes tea, biscuits and ready-to-cook mixes sold in local shops.',
    sizeLabel: 'Large',
    volFactor: 0.8,
    mainRisk: 'Rising costs of tea leaves and wheat can squeeze profits.',
    dayChangePct: 0.6,
    seed: 101,
  },
  {
    id: 'stk_voltara',
    name: 'Voltara Grid (sample)',
    ticker: 'VOLTARA',
    sector: 'Power',
    price: 2450,
    whatTheyDo: 'Runs power lines that carry electricity between states.',
    sizeLabel: 'Large',
    volFactor: 0.9,
    mainRisk: 'Rules on what it can charge are set by regulators and can change.',
    dayChangePct: -0.4,
    seed: 102,
  },
  {
    id: 'stk_orbitly',
    name: 'Orbitly Software (sample)',
    ticker: 'ORBITLY',
    sector: 'IT services',
    price: 3180,
    whatTheyDo: 'Builds and maintains software for banks and airlines abroad.',
    sizeLabel: 'Large',
    volFactor: 1.1,
    mainRisk: 'A slowdown abroad can cut new orders.',
    dayChangePct: 1.2,
    seed: 103,
  },
  {
    id: 'stk_pinecrest',
    name: 'Pinecrest Bank (sample)',
    ticker: 'PINECREST',
    sector: 'Banking',
    price: 860,
    whatTheyDo: 'Takes deposits and gives home, car and small-business loans.',
    sizeLabel: 'Large',
    volFactor: 1.0,
    mainRisk: 'If many borrowers stop repaying, profits fall.',
    dayChangePct: -0.8,
    seed: 104,
  },
  {
    id: 'stk_riverstone',
    name: 'Riverstone Cement (sample)',
    ticker: 'RIVERSTONE',
    sector: 'Cement',
    price: 2080,
    whatTheyDo: 'Makes cement for houses, roads and bridges.',
    sizeLabel: 'Large',
    volFactor: 1.0,
    mainRisk: 'Sales drop when building slows down.',
    dayChangePct: 0.3,
    seed: 105,
  },
  {
    id: 'stk_monsoon',
    name: 'Monsoon Motors (sample)',
    ticker: 'MONSOON',
    sector: 'Two-wheelers',
    price: 640,
    whatTheyDo: 'Makes scooters and electric bikes for city commutes.',
    sizeLabel: 'Mid',
    volFactor: 1.3,
    mainRisk: 'New electric rivals can take market share quickly.',
    dayChangePct: 2.1,
    seed: 106,
  },
  {
    id: 'stk_saffronleaf',
    name: 'Saffronleaf Pharma (sample)',
    ticker: 'SAFFRONLEAF',
    sector: 'Pharma',
    price: 1120,
    whatTheyDo: 'Makes common medicines sold in India and abroad.',
    sizeLabel: 'Mid',
    volFactor: 1.2,
    mainRisk: 'A failed factory inspection can stop exports for months.',
    dayChangePct: -1.1,
    seed: 107,
  },
  {
    id: 'stk_copperline',
    name: 'Copperline Cables (sample)',
    ticker: 'COPPERLINE',
    sector: 'Electricals',
    price: 455,
    whatTheyDo: 'Makes wires and cables for homes and factories.',
    sizeLabel: 'Mid',
    volFactor: 1.3,
    mainRisk: 'Copper price jumps raise costs before prices can catch up.',
    dayChangePct: 0.9,
    seed: 108,
  },
  {
    id: 'stk_quillpay',
    name: 'Quillpay Fintech (sample)',
    ticker: 'QUILLPAY',
    sector: 'Payments',
    price: 310,
    whatTheyDo: 'Runs a payments app for small shops.',
    sizeLabel: 'Mid',
    volFactor: 1.6,
    mainRisk: 'It is not yet profitable and depends on raising more money.',
    dayChangePct: -2.4,
    seed: 109,
  },
  {
    id: 'stk_hilltop',
    name: 'Hilltop Stays (sample)',
    ticker: 'HILLTOP',
    sector: 'Hotels',
    price: 185,
    whatTheyDo: 'Runs small hotels in hill towns.',
    sizeLabel: 'Small',
    volFactor: 1.7,
    mainRisk: 'A bad tourist season can wipe out a year of profit.',
    dayChangePct: 1.6,
    seed: 110,
  },
  {
    id: 'stk_greenfield',
    name: 'Greenfield Agro (sample)',
    ticker: 'GREENFIELD',
    sector: 'Agriculture',
    price: 92,
    whatTheyDo: 'Sells seeds and fertiliser to farmers.',
    sizeLabel: 'Small',
    volFactor: 1.8,
    mainRisk: 'A weak monsoon cuts farmers’ spending.',
    dayChangePct: -0.7,
    seed: 111,
  },
  {
    id: 'stk_zephyr',
    name: 'Zephyr Logistics (sample)',
    ticker: 'ZEPHYR',
    sector: 'Logistics',
    price: 268,
    whatTheyDo: 'Runs delivery trucks and warehouses for online shops.',
    sizeLabel: 'Small',
    volFactor: 1.6,
    mainRisk: 'Fuel costs and price wars can erase thin margins.',
    dayChangePct: 0.2,
    seed: 112,
  },
];

export const STOCKS: Stock[] = SEEDS.map(({ seed, ...s }) => {
  const sparkline = sampleSparkline(seed, s.volFactor, 0.003, s.price * 0.9);
  const lo = Math.min(...sparkline, s.price);
  const hi = Math.max(...sparkline, s.price);
  return {
    ...s,
    sparkline,
    week52: { low: Math.round(lo * 0.92), high: Math.round(hi * 1.06) },
  };
});

const BY_ID = new Map(STOCKS.map((s) => [s.id, s]));

export function getStock(id: string): Stock | undefined {
  return BY_ID.get(id);
}

export function isStockId(id: string): boolean {
  return BY_ID.has(id);
}
