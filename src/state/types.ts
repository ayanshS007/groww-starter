// State shape from PLAN.md section 4 (overrides README 6.4, see PLAN C10).

// ---------- primitives ----------
export type ISODate = string; // 'YYYY-MM-DD' (simulated calendar)
export type FundId =
  | 'liquid1'
  | 'liquid2'
  | 'shortdebt1'
  | 'arb1'
  | 'balanced1'
  | 'index50'
  | 'indexnext50'
  | 'flexi1'
  | 'midcap1'
  | 'gold1';
export type StockId = string; // e.g. 'stk_tealeaf' (fictional, "(sample)")
export type AssetId = FundId | StockId;

export type IncomeType = 'stipend' | 'parttime' | 'salary' | 'none';
export type IncomeBand = 'lt10k' | '10to25k' | '25to50k' | 'gt50k';
export type CushionAnswer = 'yes' | 'some' | 'no';
export type Purpose = 'wealth' | 'goal' | 'cushion' | 'exploring';
export type Horizon = 'lt1' | '1to3' | '3to5' | '5plus';
export type DipReaction = 'sell' | 'wait' | 'stay';
export type RiskComfort = 'low' | 'moderate' | 'high';
export type Scenario = 'normal' | 'dip_small' | 'dip_sharp' | 'up' | 'flat';
export type PickReason = 'plan' | 'researched' | 'social' | 'not_sure';

// ---------- check-in & plan ----------
export type CheckinAnswers = {
  incomeType: IncomeType;
  incomeBand: IncomeBand;
  cushion: CushionAnswer;
  purpose: Purpose;
  horizon: Horizon;
  dipReaction: DipReaction;
  monthly: number; // ₹100–₹1,00,000
  monthlyChoice: 100 | 500 | 1000 | 2500 | 'custom';
};

export type PlanRule = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
export type AnswerKey = keyof Omit<CheckinAnswers, 'monthlyChoice'>;

export type PlanBucket = {
  role: 'cushion' | 'grow';
  fundId: FundId;
  amount: number;
  reason: string; // cites ≥ 2 answers
  citedAnswers: AnswerKey[]; // length ≥ 2
};

export type PlanFactor = { text: string; answer: AnswerKey };

export const PLAN_LABEL = 'Starter shortlist based on your answers. Not investment advice.' as const;

export type StarterPlan = {
  monthly: number;
  rule: PlanRule;
  riskComfort: RiskComfort;
  suggestedCushionPct: number;
  cushionPct: number;
  buckets: PlanBucket[]; // 1 or 2
  alternativeFundId?: FundId;
  factors: PlanFactor[]; // length ≥ 3
  conflictNote?: string;
  overCeilingNote?: string;
  mergeNote?: string;
  splitNote?: string;
  comfortCeiling: number;
  label: typeof PLAN_LABEL;
  createdAt: ISODate;
};

// ---------- money ----------
export type Holding = {
  id: string;
  kind: 'fund' | 'stock';
  assetId: AssetId;
  units: number; // whole numbers for stocks
  invested: number; // net ₹ put in (reduced pro rata on redeem)
  createdAt: ISODate;
  createdWeek: number;
};

export type StopReason = 'market_fell' | 'money_tight' | 'need_money' | 'better_fund' | 'other' | 'none';

export type Sip = {
  id: string;
  fundId: FundId;
  amount: number;
  dayOfMonth: number; // 1–28
  status: 'active' | 'paused' | 'stopped';
  pausedUntil?: ISODate;
  skipNext: boolean;
  stepUpPct?: 10;
  nextStepUpDate?: ISODate;
  goalId?: string;
  instalments: number; // counts the first payment
  batchId?: string;
  stopReason?: StopReason;
  stoppedAt?: ISODate;
  createdAt: ISODate;
  createdWeek: number;
};

export type Order = {
  id: string;
  batchId?: string;
  kind: 'fund' | 'stock';
  assetId: AssetId;
  amount: number;
  units?: number;
  type: 'sip_first' | 'one_time' | 'buy' | 'redeem';
  orderType?: 'market' | 'limit';
  limitPrice?: number;
  pickReason?: PickReason;
  status: 'processing' | 'done';
  week: number;
  createdAt: ISODate;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  byDate: ISODate;
  sipIds: string[];
  isCushion: boolean;
  createdAt: ISODate;
};

export type ActivityKind =
  | 'sip_instalment'
  | 'sip_skipped'
  | 'sip_paused'
  | 'sip_resumed'
  | 'sip_stopped'
  | 'sip_edited'
  | 'one_time'
  | 'buy'
  | 'redeem'
  | 'goal_created';

export type ActivityItem = {
  id: string;
  at: ISODate;
  week: number;
  kind: ActivityKind;
  assetId?: AssetId;
  sipId?: string;
  amount?: number;
  units?: number; // positive; 'redeem' removes them
  note?: string;
};

// ---------- flows in progress ----------
export type InvestStep = 'type' | 'amount' | 'date' | 'review' | 'pay' | 'mandate' | 'processing';
export type UpiApp = 'app1' | 'app2' | 'app3' | 'upi_id';

export type InvestDraft = {
  mode: 'single' | 'plan';
  fundId?: FundId;
  type: 'sip' | 'one_time';
  amount?: number;
  planAmounts?: { fundId: FundId; amount: number; role: 'cushion' | 'grow' }[];
  dayOfMonth?: number;
  step: InvestStep;
  riskAck: boolean;
  pickReason?: PickReason;
  tipCheckOffered?: boolean;
  upiApp?: UpiApp;
  startedAt: ISODate;
};

export type KycProgress = {
  step: 1 | 2 | 3 | 4;
  panOk: boolean;
  aadhaarOk: boolean;
  selfieOk: boolean;
};

// ---------- root ----------
export type NotifKind =
  | 'sip_due'
  | 'sip_done'
  | 'sip_skipped_paused'
  | 'insight_ready'
  | 'goal_progress'
  | 'milestone'
  | 'kyc_pending';

export const NOTIF_KINDS: NotifKind[] = [
  'sip_due',
  'sip_done',
  'sip_skipped_paused',
  'insight_ready',
  'goal_progress',
  'milestone',
  'kyc_pending',
];

export type PersonaId = 'riya' | 'kabir' | 'meera' | 'arjun';

export type MarketState = {
  scenario: Scenario; // applied on next "Advance one week"
  week: number; // weeks elapsed since startDate
  history: Scenario[]; // history[i] = scenario of week i+1
  startDate: ISODate; // simulated week 0
};

export type State = {
  version: 1;
  user: {
    signedUp: boolean;
    name?: string;
    mobile?: string;
    kyc: 'none' | 'in_progress' | 'done';
    bankLinked: boolean;
    autopay: boolean;
    payday?: number;
    persona?: PersonaId;
  };
  checkinDraft?: Partial<CheckinAnswers>;
  checkin?: CheckinAnswers;
  plan?: StarterPlan;
  holdings: Holding[];
  sips: Sip[];
  orders: Order[];
  goals: Goal[];
  watchlist: AssetId[];
  prefs: {
    view: 'starter' | 'pro';
    stockBudgetPct: number;
    readinessPassed: boolean;
    notif: Record<NotifKind, boolean>;
  };
  market: MarketState;
  activity: ActivityItem[];
  investDraft?: InvestDraft;
  kycProgress?: KycProgress;
  readNotifications: string[];
  seenMilestones: string[];
};

// ---------- reference data ----------
export type FundCategory = 'Liquid' | 'Debt' | 'Hybrid' | 'Index' | 'Equity' | 'Gold';

export type Fund = {
  id: FundId;
  name: string;
  category: FundCategory;
  oneLiner: string;
  risk: 1 | 2 | 3 | 4 | 5;
  /** Horizon bucket used for comparisons with the user's horizon. */
  horizon: Horizon;
  /** Label as shown in README 7.1, e.g. '7+ yrs'. */
  horizonLabel: string;
  minSip: number;
  minOneTime: number;
  vol: number;
  whatItIs: string;
  mainRisk: string;
  goodFor: string;
  notIdealFor: string;
  /** Illustrative 1-year range in %, e.g. { low: -15, high: 30 }. */
  illustrativeRange1y: { low: number; high: number };
  /** Mock annual expense ratio in %. */
  expenseRatio: number;
  exitLoad: string;
  whatHappensNext: [string, string, string];
  baseNav: number;
  sparkline: number[]; // 24 points
  /** Mock illustrative returns in % (Pro view). */
  illustrativeReturns: { y1: number; y3: number; y5: number };
};

export type StockSize = 'Large' | 'Mid' | 'Small';

export type Stock = {
  id: StockId;
  name: string; // always ends with "(sample)"
  ticker: string;
  sector: string;
  price: number; // sample price at simulated week 0
  whatTheyDo: string;
  sizeLabel: StockSize;
  volFactor: number;
  sparkline: number[]; // 24 points
  mainRisk: string;
  week52: { low: number; high: number };
  dayChangePct: number; // sample, Pro view only
};

export type GlossaryTerm = {
  id: string;
  term: string;
  meaning: string;
  analogy: string;
};
