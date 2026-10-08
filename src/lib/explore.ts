// Explore and Fund detail logic (README 9 items 7–8, PLAN items 6, 29, 30).
import { COLLECTIONS, PLAN_CATEGORIES, type CollectionId } from '../data/funds';
import type { DipReaction, Fund, FundCategory, FundId, PlanBucket, State, Stock } from '../state/types';
import { horizonRank } from './market';
import { HORIZON_LABEL, ROLE_WORD } from './planner';
import { bucketForFund, bucketFundId, hasLiveSip } from './planStatus';

export const FUND_CATEGORIES: FundCategory[] = ['Liquid', 'Debt', 'Hybrid', 'Index', 'Equity', 'Gold'];

export type RiskBandId = 'low' | 'moderate' | 'high';

export const RISK_BANDS: { id: RiskBandId; label: string; test: (risk: number) => boolean }[] = [
  { id: 'low', label: 'Low (1–2 of 5)', test: (r) => r <= 2 },
  { id: 'moderate', label: 'Moderate (3 of 5)', test: (r) => r === 3 },
  { id: 'high', label: 'High (4–5 of 5)', test: (r) => r >= 4 },
];

/** "Starts at" filter: funds whose minimum SIP is at most this. */
export const MIN_SIP_OPTIONS = [100, 500] as const;

export type FundFilters = {
  query: string;
  collection: CollectionId | 'saved' | null;
  category: FundCategory | null;
  risks: RiskBandId[];
  maxMinSip: number | null;
};

export const NO_FILTERS: FundFilters = { query: '', collection: null, category: null, risks: [], maxMinSip: null };

function haystack(f: Fund): string {
  return `${f.name} ${f.category} ${f.oneLiner} ${f.goodFor} ${f.horizonLabel}`.toLowerCase();
}

/** Sample companies whose name, ticker or sector contains the search, A–Z. */
export function searchStocks(stocks: Stock[], query: string): Stock[] {
  const term = query.trim().toLowerCase();
  return stocks.filter((s) => !term || `${s.name} ${s.ticker} ${s.sector}`.toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name));
}

/** Keeps the data order (never sorted by returns). Every search word must match. */
export function filterFunds(funds: Fund[], f: FundFilters, watchlist: string[]): Fund[] {
  const words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  const collectionIds =
    f.collection === null
      ? null
      : f.collection === 'saved'
        ? new Set<string>(watchlist)
        : new Set<string>(COLLECTIONS.find((c) => c.id === f.collection)?.fundIds ?? []);
  return funds.filter((fund) => {
    if (collectionIds && !collectionIds.has(fund.id)) return false;
    if (f.category && fund.category !== f.category) return false;
    if (f.risks.length > 0 && !RISK_BANDS.some((b) => f.risks.includes(b.id) && b.test(fund.risk))) return false;
    if (f.maxMinSip !== null && fund.minSip > f.maxMinSip) return false;
    if (words.length > 0) {
      const h = haystack(fund);
      if (!words.every((w) => h.includes(w))) return false;
    }
    return true;
  });
}

/** Filters set inside the filter sheet (risk and minimum SIP). */
export function sheetFilterCount(f: FundFilters): number {
  return (f.risks.length > 0 ? 1 : 0) + (f.maxMinSip !== null ? 1 : 0);
}

export function hasAnyFilter(f: FundFilters): boolean {
  return f.query.trim() !== '' || f.collection !== null || f.category !== null || sheetFilterCount(f) > 0;
}

// ---------- fit with the user's answers ----------
export type FitBanner = { tone: 'info' | 'caution'; text: string; cta?: { label: string; to: string } };

export type FundFit = {
  bucket?: PlanBucket;
  banners: FitBanner[];
  /** "Why am I seeing this?" body. Cites at least two answers when there is a check-in. */
  why: string;
};

const RISK_WORD: Record<number, string> = { 1: 'low', 2: 'low to moderate', 3: 'moderate', 4: 'moderately high', 5: 'high' };

const DIP_PHRASE: Record<DipReaction, string> = {
  sell: 'sell to stop the loss if it fell 10% in a month',
  wait: 'wait and watch if it fell 10% in a month',
  stay: 'invest more while it’s low if it fell 10% in a month',
};

export type From = 'search' | 'collection' | 'plan' | 'portfolio' | 'link';

export function parseFrom(v: string | undefined): From {
  return v === 'search' || v === 'collection' || v === 'plan' || v === 'portfolio' ? v : 'link';
}

const HOW: Record<From, string> = {
  search: 'You found this fund by searching',
  collection: 'You opened this fund from a collection',
  plan: 'You opened this fund from your plan',
  portfolio: 'You opened this fund from your portfolio',
  link: 'You opened this fund from a link',
};

export function fundFit(fund: Fund, state: State, from: From = 'link'): FundFit {
  const bucket = bucketForFund(state.plan, fund.id);
  const answers = state.checkin;
  const banners: FitBanner[] = [];

  if (!answers) {
    banners.push({
      tone: 'info',
      text: 'You’re browsing without a plan. The 2-minute check-in shows how this fund compares with your answers.',
      cta: { label: 'Take the check-in', to: state.user.signedUp ? '/checkin/1' : '/signup?next=%2Fcheckin%2F1' },
    });
    return {
      bucket,
      banners,
      why: `${HOW[from]}. You haven’t done the check-in yet, so we can’t compare it with your answers. Take it and this will cite them.`,
    };
  }

  const longer = horizonRank(fund.horizon) > horizonRank(answers.horizon);
  const shorter = horizonRank(fund.horizon) < horizonRank(answers.horizon);
  const comfortTooLow =
    (answers.dipReaction === 'sell' && fund.risk >= 4) || (answers.dipReaction === 'wait' && fund.risk === 5);

  if (longer) {
    banners.push({
      tone: 'caution',
      text: `Your time frame is ${HORIZON_LABEL[answers.horizon]}; this fund suits ${fund.horizonLabel}. It can stay down for a while, so money you need sooner may not be ready.`,
    });
  }
  if (comfortTooLow) {
    banners.push({
      tone: 'caution',
      text: `You said you’d ${DIP_PHRASE[answers.dipReaction]}. This fund is ${RISK_WORD[fund.risk]} risk, so its falls can be bigger than that.`,
    });
  }
  if (bucket) {
    banners.push({
      tone: 'info',
      text: `This is one of the ${PLAN_CATEGORIES[bucket.category].plural} in your starter plan. The plan names the category. Which fund you pick is up to you.`,
      cta: { label: 'See my plan', to: '/plan' },
    });
  }
  if (!bucket) {
    banners.push({
      tone: 'info',
      text: 'This fund isn’t part of your starter plan. Looking is fine. Your plan only changes if your answers do.',
      cta: { label: 'See my plan', to: '/plan' },
    });
  }
  if (!bucket && hasLiveSip(state.sips, fund.id)) {
    banners.push({
      tone: 'info',
      text: 'You already have a SIP in this fund, and it’s not in your current plan. Nothing changes unless you change it.',
      cta: { label: 'Open my portfolio', to: '/portfolio' },
    });
  }

  let why: string;
  if (bucket) {
    why = `Its category, ${PLAN_CATEGORIES[bucket.category].plural}, is the ${ROLE_WORD[bucket.role]} part of your starter plan. ${bucket.reason}`;
  } else {
    const fit = longer
      ? 'longer than you said you need'
      : shorter
        ? 'shorter than your time frame, so it may grow slowly for you'
        : fund.horizonLabel === HORIZON_LABEL[answers.horizon]
          ? 'the same as your time frame'
          : `in the same group as your time frame, but at the longer end. It fits best if you won’t need this money for ${fund.horizonLabel.replace('+ yrs', ' years')} or more`;
    why = `${HOW[from]}. Your time frame is ${HORIZON_LABEL[answers.horizon]}; this fund suits ${fund.horizonLabel}, which is ${fit}. You said you’d ${DIP_PHRASE[answers.dipReaction]}; this fund is ${RISK_WORD[fund.risk]} risk.`;
  }
  return { bucket, banners, why };
}

/** Funds the user picked (or already run a SIP in) for a plan part, for "In your plan" tags. */
export function planFundIds(state: Pick<State, 'plan' | 'sips'>): Set<FundId> {
  return new Set((state.plan?.buckets ?? []).flatMap((b) => {
    const id = bucketFundId(state.sips, b);
    return id ? [id] : [];
  }));
}
