# PLAN.md — Groww Starter build plan (Stage 1)

Status: **awaiting approval**. No code exists yet.

**Precedence.** `README.md` is the spec. On the points listed in [Changes to README](#2-changes-to-readme), the product owner has decided that this file wins. Everywhere else, `README.md` wins.

Contents
1. Resolved assumptions
2. Changes to README
3. Route map and guards
4. State shape
5. Logic modules (`src/lib`)
6. Component list
7. Screens
8. Build order

---

## 1. Resolved assumptions

These are the Stage 0 answers, accepted by the product owner on 2026-10-07. Where the owner changed one, the owner's version is the one recorded here.

### 1.1 Check-in and planner
1. **"Not earning yet"** counts as irregular (non-salary) income: A3 applies, and the default SIP date is the 10th. The income band is still asked.
2. **Rounding.** The cushion part is rounded to the nearest ₹50 and grow gets the remainder, so the parts always add up to the monthly amount. The under-₹100 merge rule runs after rounding.
3. **Both parts under ₹100** (for example ₹100 at 50/50): merge into the cushion, because the cushion wins ties. The plan shows a merge note.
4. **"Start this plan" sets up both SIPs in one pass**: one review screen listing both buckets, one risk checkbox, one autopay mandate for the total, and one success screen. Opening Invest from a single fund still gives the single-SIP flow. *(Owner decision.)*
5. **Reasons and factors.** `factors` holds at least 3 items, each citing one answer. Each bucket's `reason` cites at least 2 answers.
6. **"Why am I seeing this?" for a fund outside the plan.** It says how the user got there (search, collection or link) and compares the fund with their answers, for example "Your horizon is 1–3 yrs; this fund suits 5+ yrs". In browse mode (no check-in) it offers the check-in instead of citing answers.
7. **Riya uses ₹4,000 a month**: ₹2,000 grow (Nifty 50 Index) and ₹2,000 cushion. Only the index SIP exists, so her Next-step card reads "Set up your cushion SIP". *(Owner agreed.)*
8. **Income-band midpoints**, used for the cushion target of 3 × midpoint: < ₹10k → ₹5,000; ₹10–25k → ₹17,500; ₹25–50k → ₹37,500; ₹50k+ → ₹50,000.
9. **Adjust split** *(owner decision, fixes UX risk 2).* The Starter plan screen has a cushion slider from 0–100% in steps of 10%, starting at the rule's suggestion. Rounding and merge rules re-run on every change. Moving it shows one plain trade-off line, and it never blocks:
   - Below the suggestion: "Less cushion means a surprise bill could force you to sell."
   - Above the suggestion: "More cushion is steadier, but grows more slowly."
   - At the suggestion: no line.
   - When the grow category is Liquid (horizon < 1 yr), both parts land in `liquid1` and become one bucket. The line then reads: "You need this within a year, so all of it stays in a liquid fund."
10. **Unreachable matrix cells.** A1 and A2 make the "< 1 yr" row unreachable as a grow bucket. The grow-category function is tested on all 12 cells directly. The "< 1 yr + High" conflict note is still attached to the plan when grow is 0%.

### 1.2 Market, insight and time
11. **Simulated calendar.** `market.startDate` is week 0, and the simulated today is `startDate + 7 × week`. An instalment posts when its `dayOfMonth` falls inside a newly advanced week. A paused SIP resumes on its own once the simulated date passes `pausedUntil`, logging `sip_resumed`. Every lib function takes `now` and dates as parameters.
12. **Value maths.** There is one holding per asset. `NAV(asset, week) = baseNav × Π(1 + scenarioMove × vol)` over `history[0..week-1]`. Units = amount ÷ NAV at the week of purchase. Activity items record `week` and `units`, so `valueSeries` can be rebuilt for every week.
13. **First investment.** On the first investment the scenario becomes `dip_small` and one week is applied straight away, so the first insight has something real to describe.
14. **Insight inputs.** The insight uses two numbers:
    - **This week's change** (₹ and %): the portfolio's move in the latest week. The headline always states it.
    - **Overall change** (₹ and %): value against total invested. *(Owner decision.)*
15. **Insight branches**, first match wins:
    1. Overall ≤ −10% and horizon ≥ 3 yrs → **big dip**: the bigger fall is acknowledged, past falls have recovered but that isn't guaranteed, selling now locks in the fall, and "Review my plan" is optional.
    2. This week ≥ 0 (up or flat) → calm, "one week is not a trend", no action.
    3. This week < 0 and horizon ≥ 3 yrs → "A short-term move. Your horizon is {h}, so this alone doesn't mean you need to act."
    4. This week < 0 and horizon < 3 yrs → explains the fund is the steadier type for this reason. If a held grow fund's horizon is longer than the user's, it names the mismatch and offers "Review my plan".

    "Horizon" means the check-in horizon; in browse mode it falls back to the longest held fund's horizon. A liquid-only portfolio under `dip_sharp` never produces alarming words. Styling is never red.
16. **Riya's seeded history** has 12 weeks with **two `dip_sharp` weeks**: one mid-history, and the latest week (the current scenario). The seed is tuned so her overall change is about **−12%** (a test asserts −13% to −11%), which makes the big-dip branch demoable. *(Owner decision.)*
17. **Step-up +10% yearly** is stored and shown ("Next step-up {date}: ₹X → ₹Y"). It isn't simulated, because the demo spans weeks, not years.
18. **"SIP due in 2 days" and "Today / Earlier"** are measured against the simulated date. "Today" means created in the current simulated week.

### 1.3 Flows
19. **KYC is triggered only at payment** *(owner agreed)*.
    - Amount, date and review work without KYC. Tapping "Continue to payment" sends the user to sign-up (if needed) and then `/kyc/1?next=<invest route>`. The draft is kept and resumes at the payment step.
    - Home's Next-step card says **"Start your first SIP (quick verification included)"**. KYC is never listed as a separate step.
    - A direct URL to `/invest/:fundId` without KYC opens the flow normally.
20. **Refresh mid-invest** resumes from `investDraft` at the same step.
21. **Withdraw** is a bottom sheet on Holding detail, not a route. It allows a partial amount or "Withdraw all". Units drop immediately, and the copy says the money "reaches your bank in 1–3 working days" and includes the exit-load note.
22. **Stock holdings** show "Buy more / Sell". Sell reuses the withdraw sheet and creates a `redeem` order.
23. **Stop coach** *(stays one screen)*:
    - The reason tiles sit at the top. The bottom action row is visible from the first render: a primary button plus **Stop anyway**, at equal size.
    - Before a reason is picked, the primary button is "Keep my SIP", which returns to SIP detail unchanged.
    - Picking a reason expands its response in place and replaces the row with that reason's options, in README order. "Stop anyway" stays last and the same size.
    - "Found a better fund" adds a fund picker, defaulting to the plan's alternative fund.
    - On a paused SIP, "Pause" becomes "Keep it paused".
    - Stopping needs no reason (`stopReason: 'none'`) and no extra confirm dialog. The toast says the units stay invested, then it returns to SIP detail.
24. **UPI chooser** uses generic text tiles: "UPI app 1", "UPI app 2", "UPI app 3", "Enter UPI ID". There are no real app names or logos. The autopay mandate is set once (`user.autopay`), and later SIPs say "Uses your existing autopay".
25. **Undo toast** after Skip lasts about 6 seconds with no visible timer or countdown.
26. **Sign-up validation**: the mobile number is any 10 digits; the OTP is any 6 digits. PAN must match `AAAAA9999A`, and Aadhaar is the last 4 digits.
27. **Amount presets**: the plan's bucket amount (when the fund is in the plan), ₹100, ₹500 and ₹1,000. The ceiling note compares all monthly SIPs, including this one, with the comfort ceiling. It's a soft note and never blocks.
28. **Confidence Layer screens**: Starter plan, Fund detail, Invest review, Withdraw sheet, Stop coach, Payday Split and Stock buy review. Fund detail shows all three blocks in full; the other screens show a shortened version.
29. **Watchlist.** In Starter view, saved items show as a "Saved" chip in the Explore fund list. Pro view shows the Watchlist table. Fund and stock ids share one list.
30. **Redo check-in** regenerates the plan and leaves existing SIPs untouched. Mismatch banners show where they differ.
31. **Pick reason in the plan flow.** The one-pass plan flow records `pickReason: 'plan'` automatically and doesn't show the chips. Single-fund and stock flows show them (P1).
32. **Success copy has variants**: first SIP ("Your first SIP is set."), plan of two SIPs ("Your plan is set. 2 SIPs, ₹X a month."), one-time ("₹X invested."), and stock ("Order placed (simulated).").

### 1.4 P1 details
33. **Payday top-up** = min(10% of pay, gap to the cushion target), rounded to ₹50. "Cushion" means liquid-category holdings only. "Yours to spend" never goes below ₹0 and gets a note when it does. "Simulate pay credit" defaults to ₹28,000 for Riya and to the band midpoint for everyone else, and is editable.
34. **Goal value** is the value of the holdings in the linked SIPs' funds. A fund can back only one goal. "Equity" for the short-goal warning means risk 4–5 funds (index and equity).
35. **Stock budget** is checked including the proposed buy, so the first stock buy always shows the gentle sheet (100% of stocks). Market and limit orders fill instantly at the sample price (or the limit price).
36. **Milestones** count instalments across all SIPs, and the first investment counts as instalment 1. The card shows on Home until "Got it" is tapped, then goes into `seenMilestones`.
37. **Dashboard.**
    - Every down week gets a dot. "You stayed invested" shows in that week's tooltip and on the latest dip.
    - "See all" expands the activity list in place.
    - The actual split is liquid vs everything else.
    - There is one bell, in the top bar.
38. **Pro Explore** stock cards are sorted alphabetically and filtered by the Large / Mid / Small chips. They are never ranked by change, with no gainers framing. Holdings and Orders sub-tabs reuse portfolio and `orders` data. Funds get mock 1/3/5-yr illustrative return fields.
39. **"Markets this week" line** in Starter Explore: one sentence per scenario, for example `dip_small` → "Markets this week: a small dip. Normal for a week."
40. **Extra glossary entries**: "Stocks vs funds" (used by the stocks banner, since P2 cards don't exist), average NAV, mandate, step-up and cushion.

### 1.5 Design and shell
41. **Sidebar colour.** The sidebar is a light surface with a green active pill, as on Groww web. Ref 01's dark navy is used only by dark-mode tokens.
42. **"Illustrative" labels.** Labels and disclaimers go on market-derived numbers (NAV, value, returns, prices). The disclaimer footer also goes on Home and Dashboard. Amounts the user typed aren't labelled.
43. **Contrast** *(owner decision)*:
    - Primary buttons use ink text (`#1F2937`-like) on brand green (`#00D09C`-like), about 7:1.
    - Links and green text use a darker green token that reaches at least 4.5:1 on the background.
    - Caution text uses a darker amber token that reaches at least 4.5:1; the light amber is only for fills and icons.
    - Dark mode gets matching pairs.
44. **Terms** *(owner decision, fixes UX risk 3)*: a jargon word is underlined as a `Term` only at its first appearance on each screen. Later appearances are plain text.
45. **Dashboard tab and bell are hidden until Stage 3d** *(owner decision)*. Until then the mobile tab bar has **4 tabs** (Home · Explore · Portfolio · You) and the desktop sidebar has 5 items (Home · Explore · Portfolio · Learn · You).

### 1.6 Section 4 contradictions (Stage 0), resolved
- **#1 (A2 vs the < 1 yr matrix row)**: see 1.1 item 10.
- **#2 (big-dip rule unreachable)**: big-dip uses the overall change; Riya gets two sharp weeks (items 14–16).
- **#3 (green contrast)**: item 43.
- **#4 (KYC timing)**: item 19.
- **#5 (Pro toggle vs readiness)**: the Starter/Pro toggle is free. Passing readiness unlocks only the extra order-type explanations in stocks; F&O stays "Not available in this prototype".
- **#6 (Pro hides the Confidence blocks)**: the done item "three Confidence blocks without tabs" applies to Starter view. Pro puts them behind "Why this?".
- **#7 (P1 items in the P0 shell)**: item 45.
- **#8 (Kabir's income)**: use the persona table (< ₹10k).
- **#9 (`data/learn.ts`)**: it holds only P0/P1 content (Stocks vs funds text, 5 Help FAQs, the 5 readiness questions). No P2 cards.
- **#10 (minor)**: Success variants (item 32). DEPLOY.md covers GitHub Pages, the Claude artifact and Vercel.

---

## 2. Changes to README

PLAN.md overrides `README.md` at each point below. Everything not listed follows README.

| # | README section | README says | PLAN.md says instead |
|---|---|---|---|
| C1 | 8.5 Dip insight | The big-dip rule uses `\|move\| ≥ 10%` | It uses the **overall change vs invested** ≤ −10%. The headline states both this week's change and the overall change. Branch order as in item 15. |
| C2 | 7.4, 8.4 Riya persona | Index SIP ₹2,000, 3 instalments, one `dip_sharp` week | Same SIP and instalments, but **two** `dip_sharp` weeks (overall about −12%). Check-in monthly is **₹4,000**. |
| C3 | 4.1 App shell | 5 mobile tabs including Dashboard; bell in the top bar | Dashboard tab and bell are **hidden until Stage 3d**. Mobile has 4 tabs until then. |
| C4 | 4.3 Routes; 9 item 9 | One fund per invest flow; Success offers "Set up your cushion SIP" next | New route **`/invest/plan`** sets up both plan SIPs in one pass (one review, one checkbox, one mandate, one success). `/invest/:fundId` stays single-fund. |
| C5 | 4.3 Routes ("Needs: KYC done") | KYC before entering `/invest` | KYC is triggered **at the payment step** only; the flow before payment needs no KYC. |
| C6 | 9 item 5 Home | Next-step sequence: check-in → KYC → first SIP → … | check-in → **"Start your first SIP (quick verification included)"** → second bucket (if missing) → "You're set". |
| C7 | 9 item 4 Starter plan | No split control | **Adjust split** slider (cushion 0–100%, steps of 10), one trade-off line, never blocks. |
| C8 | 11 Copy | "Every jargon word is a `Term`" | Underlined as a `Term` **only at its first appearance on each screen**. |
| C9 | 10 Palette | Green accent for primary actions (implied white text) | Ink text on green buttons; **darker green** token for links and text; **darker amber** for caution text. |
| C10 | 6.4 State shape | Shape as listed | Adds `market.startDate`, `investDraft`, `checkinDraft`, `kycProgress`, `user.payday`, `version`; plan, order, SIP and activity fields as in section 4; activity kind `sip_edited`. |
| C11 | 8.7 Pick reason | Chips on Invest review | Not shown in the `/invest/plan` flow; `pickReason: 'plan'` is recorded automatically. |
| C12 | 8.6 Stop coach | Options per reason only | Before a reason is picked, the row is "Keep my SIP" + "Stop anyway". On a paused SIP, "Pause" is shown as "Keep it paused". |
| C13 | 8.9 Readiness | Readiness "unlocks the Pro view of stocks" | The Starter/Pro toggle is free. Readiness unlocks only the extra order-type explanations. |
| C14 | 8.3 Payday Split | Top-up = 10% of pay while cushion < target | Top-up = **min(10% of pay, gap to target)**, rounded to ₹50. |
| C15 | 1.2 Kabir | "₹12k stipend" | Demo state uses **< ₹10k**, per the 7.4 table. |
| C16 | 6.3 `data/learn.ts` | Learn cards file | Holds only P0/P1 content; no P2 cards. |
| C17 | 9 item 9 Success copy | "Your first SIP is set." | Copy varies by order type (item 32). |
| C18 | 16 Stage 5 `DEPLOY.md` | Claude artifact, optional Vercel/Netlify | Also covers **GitHub Pages**, matching `PROMPTS.md`. |
| C19 | 10 Motion | 150–200 ms ease-out | **150–300 ms** ease-out (Stage 6a owner request), still off under `prefers-reduced-motion`. |
| C20 | 8.5, 10, 11 "no red for normal dips"; S13/S14 "neutral/amber" | The user's own dips are neutral or amber | The user's own losses use a **soft rose** with ▼ and a sign (≥ 4.5:1), gains green with ▲. Never alarm red, red buttons, red backgrounds or warning icons (owner rule, Stage 6a). |
| C21 | 9 item 1 Landing | Headline, sub, CTAs | Same copy and CTAs, plus drifting blobs and a 3-card value bento ("A plan in 2 minutes", "Skip any month, free", "Always see why"). No stats. |
| C22 | 9 item 5 Home order | Greeting → Next-step card → snapshot with insight → … | In **Steady mode** (big dip) the full insight card comes first and the "Got paid? Split it" card is hidden. Same on Dashboard: the insight banner moves to the top. |

---

## 3. Route map and guards

Hash routing via a small custom router (`#/path?query`). Return paths travel as `?next=<encoded route>`.

| Route | Screen | P | Stage | Needs | If missing → redirect + toast |
|---|---|---|---|---|---|
| `/` | Landing | P0 | 3a | — | — |
| `/signup` | Sign up (mobile → OTP → name) | P0 | 3a | — | already signed up → `next` or `/home` |
| `/checkin/:step` (1–6) | Check-in | P0 | 3a | signed up | `/signup` "Let's set up your account first"; bad step → `/checkin/1` |
| `/plan` | Starter plan | P0 | 3a | check-in complete | `/checkin/1` "Answer a few questions first" (or `/signup`) |
| `/home` | Home | P0 | 3a | — (browse mode if no plan) | — |
| `/kyc/:step` (1–4) | KYC | P0 | 3a | signed up | `/signup?next=…`; already done → `next` or `/you` |
| `/explore` | Explore hub (Starter) / Explore Pro sub-tabs | P0 / P1 | 3b / 3d | — | — |
| `/explore/funds` | Fund list | P0 | 3b | — | — |
| `/fund/:id` | Fund detail | P0 | 3b | valid fund id | `/explore/funds` "We couldn't find that fund" |
| `/invest/plan` | Invest, both plan SIPs in one pass | P0 | 3b | plan | `/plan` or `/checkin/1` |
| `/invest/:fundId` | Invest, single fund (SIP / one-time) | P0 | 3b | valid fund id (KYC at payment) | `/explore/funds` |
| `/invest/success/:orderId` | Success | P0 | 3b | order exists | `/portfolio` |
| `/portfolio` | Portfolio | P0 | 3b | — (empty state) | — |
| `/portfolio/holding/:id` | Holding detail (+ Withdraw sheet) | P0 | 3b | holding | `/portfolio` |
| `/portfolio/sip/:id` | SIP detail | P0 | 3c | SIP | `/portfolio` |
| `/portfolio/sip/:id/stop` | Stop coach | P0 | 3c | SIP not stopped | `/portfolio/sip/:id` (or `/portfolio`) |
| `/learn` | Learn hub | P0 | 3a | — | — |
| `/learn/glossary` | Glossary | P0 | 3a | — | — |
| `/learn/tip-check` | Tip Check | P1 | 3d | — | — |
| `/you` | You | P0 | 3a | — | — |
| `/review` | Reviewer tools | P0 | 3a | — | — |
| `/payday` | Payday Split | P1 | 3d | plan | `/plan` or `/checkin/1` |
| `/portfolio/goals` | Goals list (+ create sheet) | P1 | 3d | — | — |
| `/portfolio/goal/:id` | Goal detail | P1 | 3d | goal | `/portfolio/goals` |
| `/explore/stocks` | Stocks list (beginner mode) | P1 | 3d | — | — |
| `/stock/:id` | Stock detail | P1 | 3d | valid stock id | `/explore/stocks` |
| `/stock/:id/buy` | Stock buy (KYC at payment) | P1 | 3d | valid stock id | `/explore/stocks` |
| `/dashboard` | Dashboard | P1 | 3d | — (empty state) | — |
| `/you/trading` | Stock budget + readiness | P1 | 3d | — | — |
| `/notifications` | Inbox | P1 | 3d | — | — |
| `/learn/card/:id` | 60-second card | P2 | not built | — | → `/learn` (unknown route) |
| anything else | — | — | — | — | `/home` |

P1 routes don't exist before Stage 3d, so before then they fall under "unknown route → `/home`". After a successful order, Success replaces the invest entry in history (`location.replace`), so Back goes to Portfolio and never back into payment.

---

## 4. State shape

Persisted to `localStorage` under one key, `groww-starter:v1`. Every read and write is wrapped in try/catch. If storage throws, the app runs in memory and shows one quiet notice ("Progress won't be saved in this browser"). Toasts, open sheets and the reviewer panel's open state are UI-only and never persisted.

```ts
// ---------- primitives ----------
type ISODate = string;              // 'YYYY-MM-DD' (simulated calendar)
type FundId = 'liquid1' | 'liquid2' | 'shortdebt1' | 'arb1' | 'balanced1'
            | 'index50' | 'indexnext50' | 'flexi1' | 'midcap1' | 'gold1';
type StockId = string;              // e.g. 'stk_tealeaf' (fictional, "(sample)")
type AssetId = FundId | StockId;

type IncomeType = 'stipend' | 'parttime' | 'salary' | 'none';
type IncomeBand = 'lt10k' | '10to25k' | '25to50k' | 'gt50k';
type CushionAnswer = 'yes' | 'some' | 'no';
type Purpose = 'wealth' | 'goal' | 'cushion' | 'exploring';
type Horizon = 'lt1' | '1to3' | '3to5' | '5plus';
type DipReaction = 'sell' | 'wait' | 'stay';
type RiskComfort = 'low' | 'moderate' | 'high';
type Scenario = 'normal' | 'dip_small' | 'dip_sharp' | 'up' | 'flat';
type PickReason = 'plan' | 'researched' | 'social' | 'not_sure';

// ---------- check-in & plan ----------
type CheckinAnswers = {
  incomeType: IncomeType;
  incomeBand: IncomeBand;
  cushion: CushionAnswer;
  purpose: Purpose;
  horizon: Horizon;
  dipReaction: DipReaction;
  monthly: number;                  // ₹100–₹1,00,000
  monthlyChoice: 100 | 500 | 1000 | 2500 | 'custom';
};

type PlanRule = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
type AnswerKey = keyof Omit<CheckinAnswers, 'monthlyChoice'>;

type PlanBucket = {
  role: 'cushion' | 'grow';
  fundId: FundId;
  amount: number;                   // multiple of ₹50 for the rounded part
  reason: string;                   // cites ≥ 2 answers
  citedAnswers: AnswerKey[];        // length ≥ 2
};

type PlanFactor = { text: string; answer: AnswerKey };

type StarterPlan = {
  monthly: number;
  rule: PlanRule;
  riskComfort: RiskComfort;
  suggestedCushionPct: number;      // from rule A1–A6
  cushionPct: number;               // after Adjust split (0–100, step 10)
  buckets: PlanBucket[];            // 1 or 2
  alternativeFundId?: FundId;
  factors: PlanFactor[];            // length ≥ 3
  conflictNote?: string;
  overCeilingNote?: string;
  mergeNote?: string;
  splitNote?: string;               // trade-off line when cushionPct ≠ suggested
  comfortCeiling: number;
  label: 'Starter shortlist based on your answers. Not investment advice.';
  createdAt: ISODate;
};

// ---------- money ----------
type Holding = {
  id: string;
  kind: 'fund' | 'stock';
  assetId: AssetId;
  units: number;                    // shares are whole numbers for stocks
  invested: number;                 // net ₹ put in (reduced pro rata on redeem)
  createdAt: ISODate;
  createdWeek: number;
};

type Sip = {
  id: string;
  fundId: FundId;
  amount: number;
  dayOfMonth: number;               // 1–28
  status: 'active' | 'paused' | 'stopped';
  pausedUntil?: ISODate;
  skipNext: boolean;
  stepUpPct?: 10;
  nextStepUpDate?: ISODate;
  goalId?: string;
  instalments: number;              // counts the first payment
  batchId?: string;                 // set when created by /invest/plan
  stopReason?: 'market_fell' | 'money_tight' | 'need_money' | 'better_fund' | 'other' | 'none';
  stoppedAt?: ISODate;
  createdAt: ISODate;
  createdWeek: number;
};

type Order = {
  id: string;
  batchId?: string;                 // both SIPs of a plan share one batch → one Success screen
  kind: 'fund' | 'stock';
  assetId: AssetId;
  amount: number;
  units?: number;
  type: 'sip_first' | 'one_time' | 'buy' | 'redeem';
  orderType?: 'market' | 'limit';   // stocks only
  limitPrice?: number;
  pickReason?: PickReason;
  status: 'processing' | 'done';
  week: number;
  createdAt: ISODate;
};

type Goal = {
  id: string;
  name: string;
  target: number;
  byDate: ISODate;
  sipIds: string[];
  isCushion: boolean;
  createdAt: ISODate;
};

type ActivityKind =
  | 'sip_instalment' | 'sip_skipped' | 'sip_paused' | 'sip_resumed' | 'sip_stopped'
  | 'sip_edited' | 'one_time' | 'buy' | 'redeem' | 'goal_created';

type ActivityItem = {
  id: string;
  at: ISODate;
  week: number;
  kind: ActivityKind;
  assetId?: AssetId;
  sipId?: string;
  amount?: number;
  units?: number;                   // lets valueSeries rebuild units per week
  note?: string;
};

// ---------- flows in progress ----------
type InvestDraft = {
  mode: 'single' | 'plan';
  fundId?: FundId;                  // single mode
  type: 'sip' | 'one_time';
  amount?: number;                  // single mode
  planAmounts?: { fundId: FundId; amount: number; role: 'cushion' | 'grow' }[]; // plan mode
  dayOfMonth?: number;
  step: 'type' | 'amount' | 'date' | 'review' | 'pay' | 'mandate' | 'processing';
  riskAck: boolean;
  pickReason?: PickReason;
  tipCheckOffered?: boolean;
  upiApp?: 'app1' | 'app2' | 'app3' | 'upi_id';
  startedAt: ISODate;
};

type KycProgress = {
  step: 1 | 2 | 3 | 4;
  panOk: boolean;
  aadhaarOk: boolean;
  selfieOk: boolean;
};

// ---------- root ----------
type NotifKind =
  | 'sip_due' | 'sip_done' | 'sip_skipped_paused' | 'insight_ready'
  | 'goal_progress' | 'milestone' | 'kyc_pending';

type State = {
  version: 1;
  user: {
    signedUp: boolean;
    name?: string;
    mobile?: string;                // stored as entered, shown masked
    kyc: 'none' | 'in_progress' | 'done';
    bankLinked: boolean;
    autopay: boolean;
    payday?: number;                // salary users, 1–28, default 1
    persona?: 'riya' | 'kabir' | 'meera' | 'arjun';
  };
  checkinDraft?: Partial<CheckinAnswers>; // back keeps answers
  checkin?: CheckinAnswers;               // set when step 6 completes
  plan?: StarterPlan;
  holdings: Holding[];
  sips: Sip[];
  orders: Order[];
  goals: Goal[];
  watchlist: AssetId[];
  prefs: {
    view: 'starter' | 'pro';
    stockBudgetPct: number;         // default 10
    readinessPassed: boolean;
    notif: Record<NotifKind, boolean>;
  };
  market: {
    scenario: Scenario;             // applied on next "Advance one week"
    week: number;                   // weeks elapsed since startDate
    history: Scenario[];            // history[i] = scenario of week i+1
    startDate: ISODate;             // simulated week 0
  };
  activity: ActivityItem[];
  investDraft?: InvestDraft;
  kycProgress?: KycProgress;
  readNotifications: string[];      // deterministic notification ids
  seenMilestones: string[];
};
```

**Initial state**: not signed up, KYC `'none'`, empty lists, `view: 'starter'`, `stockBudgetPct: 10`, all notification types on, `market = { scenario: 'normal', week: 0, history: [], startDate: <real today on first load> }`.

**Reducer actions** (one `useReducer`): `signUp`, `saveCheckinAnswer`, `completeCheckin`, `setPlanSplit`, `kycAdvance`, `kycComplete`, `startInvestDraft`, `updateInvestDraft`, `placeInvestOrder` (single or plan batch), `withdraw`, `skipNext`, `undoSkip`, `pauseSip`, `resumeSip`, `editSip`, `toggleStepUp`, `stopSip`, `toggleWatchlist`, `setScenario`, `advanceWeek`, `simulatePay`, `createGoal`, `updateGoal`, `linkSipToGoal`, `buyStock`, `setStockBudget`, `passReadiness`, `setView`, `setNotifPref`, `markNotificationsRead`, `seeMilestone`, `loadPersona`, `reset`.

---

## 5. Logic modules (`src/lib`, no React, each with `*.test.ts`)

| Module | Key exports | Tests (README 13.2, plus these PLAN additions) |
|---|---|---|
| `format.ts` | `formatINR` (Indian grouping, ₹1,00,000), `formatPct`, `formatSigned`, `maskMobile`, `dateLabel` | grouping, negatives, rounding |
| `market.ts` | `scenarioMove`, `navAt(asset, week, history)`, `holdingValue`, `portfolioValue`, `weekChange`, `overallChange`, `valueSeries(state)`, `simDate(startDate, week)`, `advanceWeek(state)` | value per scenario × volatility; `valueSeries` length and values; Riya seed overall between −13% and −11% |
| `activity.ts` | `dueInstalments(sips, fromDate, toDate)`, `postWeek(state)` (instalments, skip consumed, pause respected, auto-resume) | skips/pauses respected when a week advances; auto-resume |
| `planner.ts` | `riskComfort`, `comfortCeiling`, `splitRule`, `growCategory(horizon, comfort)`, `buildPlan(answers, cushionPctOverride?)`, `validateMonthly` | all 12 cells; A1–A6; both conflict notes (incl. grow 0%); goal changes wording not fund; reasons cite ≥ 2 answers; factors ≥ 3; rounding and merge; ceiling note; ₹99 and ₹1,00,001; **Adjust split** steps, notes, liquid collapse |
| `insight.ts` | `buildInsight({ weekChange, overallChange, horizon, holdings })` → `{ headline, body, actionNeeded, tone }` | every branch in item 15; overall-based big dip; headline has both numbers; liquid-only under `dip_sharp` has no alarming words |
| `sipCoach.ts` | `coachFor(reason \| null, sip, context)` → `{ response, options[] }` | each reason's options in order; "Stop anyway" always present and last; null reason → Keep my SIP + Stop anyway; paused → "Keep it paused" |
| `paydaySplit.ts` | `splitPay({ pay, activeSipTotal, cushionValue, cushionTarget })` | cushion below/at target; cap at gap; rounding; SIPs larger than pay |
| `planHealth.ts` | `planHealth(state)` → 4 checks | every status threshold; never the word "fail" |
| `goals.ts` | `monthlyNeeded`, `goalProgress`, `goalWarnings` | monthly needed, rounding up to ₹50, short goal in equity, past date |
| `milestones.ts` | `earnedMilestones(state)`, `nextUnseen` | triggers once; skip/pause never reset; first-dip trigger |
| `notifications.ts` | `deriveNotifications(state)` with deterministic ids | each kind; prefs filter; read state |
| `tipCheck.ts` | `scoreTipCheck(answers)` → tier, drivers, next step | each tier; guaranteed return alone → red flag |
| `readiness.ts` | `scoreReadiness(answers)` | pass at 4/5, fail at 3/5 |
| `stockBudget.ts` | `checkStockBuy({ stockValue, portfolioValue, buyAmount, pct })` | exceed detection incl. the first buy |

`src/data`: `funds.ts` (10 funds plus all README 7.1 fields plus illustrative 1/3/5-yr returns), `stocks.ts` (12 sample companies, at least 2 above ₹2,000), `glossary.ts` (≥ 22 terms), `learn.ts` (Stocks vs funds, 5 Help FAQs, 5 readiness questions), `personas.ts` (4 personas with full state and seeded history).

---

## 6. Component list

Shared components (`src/components`). P = the earliest level that needs it.

| Component | Purpose | P | Stage |
|---|---|---|---|
| `AppShell` | Picks mobile / tablet / desktop layout; hides nav inside flows; safe-area padding | P0 | 3a |
| `TabBar` | Mobile bottom tabs (4 until 3d, then 5) | P0 | 3a |
| `Sidebar` | Desktop nav (5 items until 3d, then 6) + "Your plan" card | P0 | 3a |
| `TopBar` | Page title / "Groww" wordmark, Learn book icon (mobile), search (Explore), bell (3d), avatar, Starter/Pro toggle (desktop, 3d) | P0 | 3a |
| `FlowHeader` | Back + close + "Step n of m" inside flows | P0 | 3a |
| `Button` | Primary / secondary / quiet; ≥ 44 px; one primary per screen | P0 | 3a |
| `Card` | 16–24 px radius surface, optional tint (mint, lavender, peach, sky) | P0 | 3a |
| `Chip` | Pill filter / choice chip | P0 | 3a |
| `OptionTile` | Large radio tile for check-in and stop reasons | P0 | 3a |
| `ProgressBar` | Linear progress (check-in, goals, cushion) | P0 | 3a |
| `BottomSheet` | Secondary choices; dialog on desktop; focus trap | P0 | 3a |
| `Toast` / `ToastRegion` | `aria-live` toasts, optional Undo, no visible timer | P0 | 3a |
| `Term` | Underlined jargon (first appearance per screen) → definition sheet + glossary link | P0 | 3a |
| `TermScope` | Per-screen context that tracks which terms are already underlined | P0 | 3a |
| `ConfidenceBlock` | What is this? / Why am I seeing this? / What happens next? | P0 | 3a |
| `WhyDrawer` | "Why this" + factors list for plan buckets | P0 | 3a |
| `SplitSlider` | Adjust split control (0–100%, step 10) with trade-off line | P0 | 3a |
| `RiskMeter` | Text label + 5 segments, never colour alone | P0 | 3a |
| `AmountInput` | ₹ input with presets, validation, `aria-live` error, ceiling note | P0 | 3a |
| `StepperInput` | +/− numeric stepper (SIP date, quantity) | P0 | 3b |
| `NextStepCard` | Home's single next action | P0 | 3a |
| `InsightCard` | Weekly insight, `aria-live="polite"`, neutral/amber, icon + text | P0 | 3b |
| `PlanSummaryCard` | Plan card on Home and the sidebar "Your plan" card | P0 | 3a |
| `EmptyState` | Illustration (inline SVG) + one line + CTA | P0 | 3a |
| `Disclaimer` | Standard illustrative footer | P0 | 3a |
| `SkeletonRow` | Loading placeholders | P0 | 3b |
| `LetterAvatar` | Letter avatar for funds and sample companies | P0 | 3b |
| `Sparkline` | Inline SVG mini line | P0 | 3b |
| `RangeBand` | Illustrative 1-yr range band | P0 | 3b |
| `FundRow` | Fund list row (risk label, illustrative 1-yr) | P0 | 3b |
| `FilterSheet` | Risk + min SIP filters | P0 | 3b |
| `UpiChooser` | Generic UPI text tiles | P0 | 3b |
| `ReviewList` | Invest review rows (one or two buckets) + key risk + checkbox | P0 | 3b |
| `StatusPill` | Status text + icon (SIP status, plan health) | P0 | 3c |
| `ReasonPicker` | Stop-coach reason tiles + in-place response | P0 | 3c |
| `ReviewerPanel` | Desktop collapsible right-edge reviewer panel | P0 | 3a |
| `KpiTile` | Pastel tile: icon circle, number, delta, sparkline | P1 | 3d |
| `AreaChart` | Value vs invested, step line, tooltip, down-week dots | P1 | 3d |
| `Donut` | Allocation donut with centre total + legend | P1 | 3d |
| `ProgressRow` | Goal progress row (ref 01 budget rows) | P1 | 3d |
| `DataTable` | Activity table / Pro watchlist; list on mobile | P1 | 3d |
| `IndexStrip` | Pro-only sample index strip labelled "Sample data" | P1 | 3d |
| `RangeBar52w` | 52-week L–H bar | P1 | 3d |
| `StockCard` | Pro stock card (letter avatar, name, price, change) | P1 | 3d |
| `UnderlineTabs` | Pro sub-tabs with underline indicator | P1 | 3d |
| `MilestoneCard` | Calm card, "Got it" | P1 | 3d |
| `PickReasonChips` | "What made you pick this?" + Tip Check offer | P1 | 3d |
| `Icon` | Inline SVG icon set | P0 | 2 |

Infrastructure (not visual): `router.tsx` (hash router, `Link`, guards with `?next`), `store.tsx` (Context + reducer + safe storage), `types.ts`.

---

## 7. Screens

Every screen has one primary CTA, a back path and no dead buttons, and works at 390, 768 and 1280 px. "Must NOT appear" always also includes the hard rules from CLAUDE.md: no advice words, no red for the user's own dips, no confetti/streaks/points/countdowns/projections, and no real names or logos.

### S1 Landing — `/` · P0 · 3a
- **User goal:** decide whether this app is for me and how to start.
- **Key info:** "Start investing with ₹100. Understand every step." / "A plan built on your answers, not on tips." Desktop: two-column hero with a static mock of Starter Home.
- **Primary CTA:** Get started → `/signup`.
- **Secondary:** Just exploring → `/home` (browse mode); small link "Reviewer? Load a demo" → `/review`.
- **Decision enabled:** start a plan now or look around first.
- **Must NOT appear:** tickers, offers, returns, IPO/F&O banners, "best", testimonials or user counts.

### S2 Sign up — `/signup` · P0 · 3a
- **User goal:** create an account quickly.
- **Key info:** 10-digit mobile → OTP ("Demo: any 6 digits") → name; "No KYC needed to look around."
- **Primary CTA:** Send OTP → Verify → Continue (one per sub-step).
- **Secondary:** Back, Close (→ Landing), Change number.
- **Decision enabled:** commit to an account without paperwork.
- **Must NOT appear:** PAN/Aadhaar requests, marketing consent pre-ticked, real SMS.

### S3 Check-in — `/checkin/:step` · P0 · 3a
- **User goal:** answer six questions so the plan fits me.
- **Key info:** "Step n of 6", one question, option tiles, "Why we ask" line. Step 1 has two tile rows (type + band). Step 6 has amounts plus Custom with an `aria-live` error (₹100–₹1,00,000) and a soft ceiling note.
- **Primary CTA:** Continue (disabled until answered; no auto-advance).
- **Secondary:** Back (keeps answers), Close (→ Home, draft kept).
- **Decision enabled:** what the plan should be based on.
- **Must NOT appear:** fund names, returns, timers, a score or "risk profile" label shown to the user as a grade.

### S4 Starter plan — `/plan` · P0 · 3a
- **User goal:** understand what I'll invest in, how much, and why.
- **Key info:** monthly amount; Cushion vs Grow bar with ₹ labels; **Adjust split** slider + trade-off line; one card per bucket (fund, one-liner, `RiskMeter`, horizon, "Why this" + factors citing answers); conflict/ceiling/merge notes; shortened Confidence Layer; plan label.
- **Primary CTA:** Start this plan → `/invest/plan` (both SIPs in one pass).
- **Secondary:** Edit answers (→ `/checkin/1`), See other options (sheet: alternative fund + same-category funds).
- **Decision enabled:** accept the plan, adjust the split, or change answers.
- **Must NOT appear:** "recommended for you", "best", projections or future value, past returns as a selling point, any blocking of the slider.

### S5 Home — `/home` · P0 · 3a (snapshot filled in 3b; P1 cards in 3d)
- **User goal:** know the one thing to do next.
- **Key info:** greeting + status line; **Next-step card** (check-in → "Start your first SIP (quick verification included)" → "Set up your cushion SIP" if a bucket is missing → "You're set. Next SIP on {date}"); portfolio snapshot with insight headline; Starter plan card; upcoming SIP with Skip shortcut; P1: "Got paid? Split it", milestone card; disclaimer.
- **Primary CTA:** the Next-step card's button.
- **Secondary:** Skip shortcut (undo toast), View plan, Open portfolio, P1 Split / Got it.
- **Decision enabled:** what to do now: start, finish setup, or nothing.
- **Must NOT appear:** news, indices, gainers/losers, IPO/F&O banners, "most bought", more than one primary button.

### S6 KYC — `/kyc/:step` · P0 · 3a
- **User goal:** get verified with minimal effort, then continue where I was.
- **Key info:** "Step n of 4": PAN (format check) → Aadhaar last 4 + OTP → selfie tile (tap simulates) → bank via UPI (₹1 check simulated) → "You're verified". "Simulated, no real data stored."
- **Primary CTA:** Continue per step → final "Continue to payment" (or "Back to where you were").
- **Secondary:** Back, Close (keeps progress, `kyc: 'in_progress'`).
- **Decision enabled:** finish verification now to complete the payment.
- **Must NOT appear:** full Aadhaar number, camera access, real bank names, upsells.

### S7 Explore hub — `/explore` (Starter) · P0 · 3b
- **User goal:** find where to browse.
- **Key info:** hub tiles Mutual funds / Stocks (Stocks tile from 3d); "Markets this week" one-liner (Starter); collections preview.
- **Primary CTA:** Browse mutual funds → `/explore/funds`.
- **Secondary:** Stocks tile (P1), collection chips, search (desktop top bar).
- **Decision enabled:** which kind of product to look at.
- **Must NOT appear:** index strip (Starter), most bought, top movers, gainers/losers.

### S8 Fund list — `/explore/funds` · P0 · 3b
- **User goal:** narrow down to a fund I understand.
- **Key info:** search; collections (Start with ₹100 · Money I may need this year · Steadier ride, 1–3 years · Long game, 5+ years · Simple and low-cost · Saved); category chips; filter sheet (risk, min SIP); rows with risk label + illustrative 1-yr return; "In your plan" tag; empty search state with chips. Pro: denser rows (expense ratio, 1/3/5-yr illustrative).
- **Primary CTA:** open a fund row → `/fund/:id`.
- **Secondary:** filters, chips, clear search.
- **Decision enabled:** which fund to read about.
- **Must NOT appear:** sort by returns as the default, "top performing", star ratings, real fund-house names.

### S9 Fund detail — `/fund/:id` · P0 · 3b
- **User goal:** understand this fund well enough to decide.
- **Key info:** header (name, category, `RiskMeter`, horizon, minimums); sparkline + illustrative range band; **three visible Confidence blocks** (Starter); mismatch banner if not in plan or horizon mismatch; good for / not ideal for; costs as `Term`s (expense ratio, exit load); watchlist toggle; disclaimer. Desktop: sticky action card on the right.
- **Primary CTA:** Start SIP → `/invest/:fundId`.
- **Secondary:** One-time, Save to watchlist, Back.
- **Decision enabled:** invest in this fund, or not.
- **Must NOT appear:** tabs hiding the Confidence blocks (Starter), projections, "buy now", other users' activity.

### S10 Invest, single fund — `/invest/:fundId` · P0 · 3b (pick reason P1 in 3d)
- **User goal:** set up a SIP or one-time investment I understand.
- **Key info:** SIP / One-time toggle → amount (presets, ceiling note, `aria-live` errors: ₹99 shows an inline error) → SIP date (8.2: payday + 3 or the 10th; "Skip any month, free") → review (fund, amount, date, key risk, required checkbox; P1 pick-reason chips + Tip Check offer) → KYC if needed → UPI chooser → autopay mandate (SIP, first time only) → ~1 s processing.
- **Primary CTA:** Continue per step → Confirm on review (disabled until risk box ticked) → Pay → Approve autopay.
- **Secondary:** Back per step, Close (draft kept), Change amount/date from review.
- **Decision enabled:** commit this amount on this date.
- **Must NOT appear:** countdowns, "limited time", pre-ticked risk box, return projections, real UPI app names or logos.

### S11 Invest, plan — `/invest/plan` · P0 · 3b
- **User goal:** start my whole plan in one go.
- **Key info:** one shared SIP date → one review listing both buckets (fund, role, ₹, key risk each) and the monthly total → one risk checkbox → KYC if needed → UPI → one autopay mandate for the total → processing.
- **Primary CTA:** Continue → Confirm (disabled until ticked) → Pay → Approve autopay.
- **Secondary:** Back, Close, "Change split" (→ `/plan`).
- **Decision enabled:** commit to the plan as shown.
- **Must NOT appear:** pick-reason chips (recorded as `plan`), separate mandates per SIP, upsells.

### S12 Success — `/invest/success/:orderId` · P0 · 3b
- **User goal:** know it worked and what happens next.
- **Key info:** variant headline (item 32); 3 "what happens next" steps; batch shows both SIPs; for single-fund orders, "Set up your cushion SIP" if a plan bucket is still missing; disclaimer.
- **Primary CTA:** Go to portfolio.
- **Secondary:** Set up your cushion SIP (single-fund case only).
- **Decision enabled:** none required; confirms the state.
- **Must NOT appear:** confetti, share buttons, "invest more now", streaks.

### S13 Portfolio — `/portfolio` · P0 · 3b (SIP rows actionable in 3c; goals P1)
- **User goal:** see what I own and whether anything needs me.
- **Key info:** value, invested, gain/loss ₹ and % (neutral/amber when down, icon + text); asset bar; **insight card** (`aria-live="polite"`) right under the numbers; Holdings; SIPs with status; Goals (P1); empty state; disclaimer; small Reviewer tools link.
- **Primary CTA:** Manage my SIP (opens the first active SIP); in the empty state, the Home next-step action.
- **Secondary:** open a holding, open a SIP, Review my plan (when the insight says so), Goals (P1).
- **Decision enabled:** whether to act on a SIP or do nothing.
- **Must NOT appear:** red numbers for own dips, "sell now", indices, projections.

### S14 Holding detail (+ Withdraw sheet) — `/portfolio/holding/:id` · P0 · 3b
- **User goal:** understand one holding; add or withdraw.
- **Key info:** value, units, average NAV, invested, sparkline; withdraw sheet: amount or all, exit-load note in plain words, "reaches your bank in 1–3 working days", shortened Confidence Layer. Stock holdings: Buy more / Sell.
- **Primary CTA:** Invest more (fund) / Buy more (stock).
- **Secondary:** Withdraw (sheet → primary "Withdraw ₹X"), Sell for stocks, Back.
- **Decision enabled:** add, take money out, or leave it.
- **Must NOT appear:** red loss styling, "sell before it falls", projections.

### S15 SIP detail — `/portfolio/sip/:id` · P0 · 3c
- **User goal:** change my SIP to fit my month without quitting.
- **Key info:** fund, amount, date, status pill, instalments, linked goal, next instalment date, step-up status.
- **Primary CTA:** Skip next instalment (undo toast) when active; Resume now when paused; "Start a new SIP in this fund" when stopped.
- **Secondary:** Pause 1/2/3 months (sheet), Edit amount/date (sheet), Step-up +10% yearly (toggle), Stop SIP → coach.
- **Decision enabled:** keep, skip, pause, change or stop.
- **Must NOT appear:** penalties for skipping, streak loss, "you'll lose ₹X by stopping" projections.

### S16 Stop coach — `/portfolio/sip/:id/stop` · P0 · 3c
- **User goal:** stop my SIP, or find out whether a lighter option fits.
- **Key info:** reason tiles (Market fell · Money is tight · I need the money · Found a better fund · Something else); in-place response per README 8.6 (current move in plain numbers; "Skipping is free and keeps your plan alive."; stopping doesn't return money; side-by-side comparison).
- **Primary CTA:** "Keep my SIP" before a reason; then the reason's first option (Keep going · Skip next · Go to Withdraw · Keep · Pause).
- **Secondary:** the reason's remaining options, then **Stop anyway** (always visible, same size, last).
- **Decision enabled:** choose what I actually meant to do.
- **Must NOT appear:** a second screen, confirm-shaming, a hidden or smaller Stop anyway, guilt copy, timers.
- After stopping: toast "SIP stopped. Your ₹X stays invested." → SIP detail with the new status.

### S17 Learn hub — `/learn` · P0 · 3a
- **User goal:** look up something I don't understand.
- **Key info:** Glossary entry tile; Tip Check tile (P1); "Stocks vs funds" entry.
- **Primary CTA:** Open glossary.
- **Secondary:** Tip Check (P1), Stocks vs funds.
- **Decision enabled:** where to learn.
- **Must NOT appear:** points, badges, progress streaks, P2 cards, view counts.

### S18 Glossary — `/learn/glossary` · P0 · 3a
- **User goal:** find a term's meaning fast.
- **Key info:** search field, A–Z list; each term: one-line meaning + everyday analogy; deep link `?term=nav` opens and scrolls.
- **Primary CTA:** Search terms (field).
- **Secondary:** expand a term, Back to where I was.
- **Decision enabled:** understand a word before deciding elsewhere.
- **Must NOT appear:** quizzes with points, ads, external links.

### S19 You — `/you` · P0 · 3a (P1 rows in 3d)
- **User goal:** manage my account and settings.
- **Key info:** name, masked mobile, KYC status, bank & autopay, Redo check-in, notification toggles, Help (5 FAQs), About this prototype, Reviewer tools, Log out (= reset with confirm). P1: Starter/Pro view, Stock budget & readiness.
- **Primary CTA:** View my plan (or Take the check-in if there is no plan).
- **Secondary:** every row above. The KYC row shows status only; if KYC is `in_progress` it offers "Continue verification", because KYC is never pushed outside payment.
- **Decision enabled:** change setup, preferences or start over.
- **Must NOT appear:** theme toggle, language switcher, referral/invite offers.

### S20 Reviewer tools — `/review` (+ desktop right-edge panel) · P0 · 3a
- **User goal (reviewer):** put the app into any state quickly.
- **Key info:** "For reviewers. Not part of the user experience."; scenario chips + current week and simulated date; Advance one week; Simulate pay credit (P1); load persona (Riya, Kabir, Meera, Arjun); jump links to every route; Reset.
- **Primary CTA:** Advance one week.
- **Secondary:** scenario chips, persona loads (confirm: replaces state), jump links, Reset (confirm).
- **Decision enabled:** which state to review.
- **Must NOT appear:** inside user-facing copy elsewhere (only a small link from Landing, Portfolio, You).

### S21 Payday Split — `/payday` · P1 · 3d
- **User goal:** decide what to do with money that just arrived.
- **Key info:** amount received (editable); three lines: Already going to SIPs · Cushion top-up · Yours to spend; cushion progress; "A suggestion, not a rule. Change any number."; shortened Confidence Layer.
- **Primary CTA:** Top up cushion with ₹X → one-time into `liquid1` (via `/invest/liquid1`, amount prefilled).
- **Secondary:** edit numbers, Not now.
- **Decision enabled:** how much of this pay to put aside.
- **Must NOT appear:** "invest everything", spending shaming, projections.

### S22 Goals list — `/portfolio/goals` · P1 · 3d
- **User goal:** see and create savings goals.
- **Key info:** goal rows (name, progress, "₹X/month needed — without counting returns"); create sheet with suggestions (Emergency cushion, Laptop, Trip, Course fees), target, date.
- **Primary CTA:** Create a goal.
- **Secondary:** open a goal.
- **Decision enabled:** what to save for and by when.
- **Must NOT appear:** return-based projections, comparison with others.

### S23 Goal detail — `/portfolio/goal/:id` · P1 · 3d
- **User goal:** know if I'm on track and fix it if not.
- **Key info:** progress, monthly needed (without counting returns), shortfall line, linked SIPs, warnings (short goal in equity → "Switch to a steadier fund"; past date → update).
- **Primary CTA:** Link a SIP (none linked) / Increase SIP to ₹X (shortfall) / Done (on track).
- **Secondary:** Extend date, Keep as is, Switch to a steadier fund, Edit, Delete.
- **Decision enabled:** adjust the SIP, the date, or accept.
- **Must NOT appear:** "you'll reach ₹X by" projections, red for behind-schedule.

### S24 Stocks list — `/explore/stocks` · P1 · 3d
- **User goal:** browse stocks safely as a beginner.
- **Key info:** banner "New to stocks? 'Stocks vs funds' in 60 seconds" (→ glossary; Starter only); sample companies with letter avatars, sector, size label, sparkline; "Sample data".
- **Primary CTA:** open a stock row.
- **Secondary:** size chips, search, watchlist.
- **Decision enabled:** which company to read about.
- **Must NOT appear:** gainers/losers, most bought, F&O, intraday, volume shockers.

### S25 Stock detail — `/stock/:id` · P1 · 3d
- **User goal:** understand the company before buying.
- **Key info:** what they do, size label, sparkline, price (sample), "₹1,000 buys {n} share(s)" (0 allowed: "Indian exchanges don't sell parts of a share"), main risk, stock budget status; disclaimer.
- **Primary CTA:** Buy → `/stock/:id/buy`.
- **Secondary:** Save to watchlist, "Why is intraday/F&O hidden?" sheet.
- **Decision enabled:** buy or not.
- **Must NOT appear:** target prices, analyst ratings, tips, F&O/intraday buttons.

### S26 Stock buy — `/stock/:id/buy` · P1 · 3d
- **User goal:** buy a few shares with eyes open.
- **Key info:** quantity stepper, Market / Limit (each explained), delivery only, total; stock-budget sheet if exceeded ("Buy anyway" / "Adjust"); review with key risk + checkbox; pick-reason chips + Tip Check offer; KYC at payment; "Order placed (simulated)".
- **Primary CTA:** Place order.
- **Secondary:** Adjust, Buy anyway (on sheet), Run Tip Check, Back.
- **Decision enabled:** how many shares, at what price type.
- **Must NOT appear:** leverage, margin, intraday, F&O, "only today".

### S27 Tip Check — `/learn/tip-check` (also inline from buy flows) · P1 · 3d
- **User goal:** sanity-check a tip I heard.
- **Key info:** source chips; 6 yes/no questions; result tier (Red flag / Be careful / Fine to research further), the answers that drove it, one next step.
- **Primary CTA:** See result.
- **Secondary:** Skip (inline), Back to my order, Start over.
- **Decision enabled:** whether to keep acting on the tip.
- **Must NOT appear:** a verdict on whether the market call is right, scores or points.

### S28 Stock budget + readiness — `/you/trading` · P1 · 3d
- **User goal:** set my own limit and see if I'm ready for more order types.
- **Key info:** budget % control (default 10%), current stock share of portfolio; readiness: 5 questions, pass at 4/5, unlocks order-type explanations; F&O "Not available in this prototype".
- **Primary CTA:** Save budget (or Take readiness check if the budget is unchanged).
- **Secondary:** Retake, Back.
- **Decision enabled:** how much of my money can go to stocks.
- **Must NOT appear:** F&O enablement, margin, a leaderboard of scores.

### S29 Notifications — `/notifications` · P1 · 3d
- **User goal:** see what happened to my money.
- **Key info:** Today / Earlier groups; unread dots; state events only (SIP due/done/skipped/paused, insight ready, goal 25/50/75/100%, milestone, KYC pending); each tap routes to its source.
- **Primary CTA:** Mark all read.
- **Secondary:** tap an item, notification settings (→ You).
- **Decision enabled:** which event to look into.
- **Must NOT appear:** marketing, "market is up, buy now", push permission prompts.

### S30 Dashboard — `/dashboard` · P1 · 3d
- **User goal:** see all my money and plan health at a glance.
- **Key info:** header "Your money at a glance" + period chips; KPI tiles (Current value ₹ and % since start · Invested so far · This week (amber icon when down) · Next SIP with inline Skip); "Value vs invested" area chart with down-week dots and "You stayed invested"; "Where your money is" donut + legend + "Plan split: x / y · Actual: a / b"; Plan health (4 checks, each links to its fix); Goals rows; This month's SIPs; Recent activity (8 rows, See all expands); insight banner; disclaimer. Mobile order as README 9.21. Empty state: greyed skeleton + "Your dashboard fills in after your first investment".
- **Primary CTA:** Review my plan (insight banner); empty state: the Home next-step action.
- **Secondary:** plan-health fix links, Skip link, period chips, See all.
- **Decision enabled:** whether anything in my plan needs attention.
- **Must NOT appear:** market indices, gainers/losers, other users, projections, leaderboards, red for own dips.

### S31 Explore in Pro view — `/explore` (view = pro) · P1 · 3d
- **User goal (curious user):** a denser, Groww-web-style view.
- **Key info:** underline sub-tabs Explore · Holdings · Orders · Watchlist; `IndexStrip` of sample indices labelled "Sample data"; stock cards (letter avatar, name, price, change, green/red with +/− for market prices only) with Large/Mid/Small chips; watchlist table (trend sparkline, price, 1D change, 52-week L–H bar); fund rows dense.
- **Primary CTA:** open an item (card or row).
- **Secondary:** sub-tabs, size chips, Add/Edit watchlist, search.
- **Decision enabled:** which asset to look at.
- **Must NOT appear:** "Top gainers" or "Most bought" framing, real names or logos, red for the user's own holdings value.

Not built: `/learn/card/:id` (P2) and every Won't item in README 5.

---

## 8. Build order

Each stage ends with `npm test` + `npm run build`, a commit, a PR "Stage <n>: <name>", and a stop.

**Stage 2 — Foundation**
1. Vite + React 18 + TS strict + Tailwind; `base: './'`; `vite-plugin-singlefile`; viewport meta, safe-area, `height: 100%`.
2. Design tokens (light + dark via `prefers-color-scheme`, including the darker green/amber text tokens); system font stack.
3. `state/types.ts` (section 4).
4. `data/*`: funds, stocks, glossary, learn, personas (Riya seed tuned to about −12%).
5. `lib/*` with tests, in dependency order: `format` → `market` → `activity` → `planner` → `insight` → `sipCoach` → `paydaySplit` → `goals` → `planHealth` → `milestones` → `notifications` → `tipCheck` → `readiness` → `stockBudget`.
6. `state/store.tsx` (reducer, safe storage, in-memory fallback) + reducer tests for storage failure.
7. Hash router with guards; placeholder App rendering "Groww Starter".
8. `.github/workflows/deploy.yml` (build → Pages on push to `main`).

**Stage 3a — Entry:** shell (TabBar 4 tabs, Sidebar 5 items + Your plan card, TopBar, FlowHeader, ReviewerPanel) → Button/Card/Chip/OptionTile/Toast/BottomSheet/Term/TermScope → Landing → Sign up → Check-in → Starter plan (+ SplitSlider, WhyDrawer, ConfidenceBlock) → Home (Next-step card) → KYC → Learn hub → Glossary → You → Reviewer tools.

**Stage 3b — Money in:** Explore hub → Fund list → Fund detail → Invest single → Invest plan → Success → Portfolio (+ InsightCard) → Holding detail + Withdraw sheet. Verify Landing → first SIP → Portfolio at 390 and 1280 px.

**Stage 3c — Stay (P0 complete):** SIP detail (skip + undo, pause, edit, step-up) → Stop coach → insight wired to every scenario via Reviewer tools → README 17 check for P0.

**Stage 3d — Should (P1), in this order:** Dashboard (+ show Dashboard tab and bell) → Explore Pro view → Payday Split → Goals → Stocks beginner mode + readiness + stock budget → pick reason + Tip Check → Starter/Pro toggle → milestone cards → notifications inbox.

**Stage 4 — QA:** `evals/EVALS.md`, `evals/PERSONAS.md` (blank results), walkthroughs at 390/768/1280 px, an agent-simulated report. Fix only the items picked.

**Stage 5 — Polish and ship:** hierarchy, CTA clarity, states, a11y, terminology; `DEPLOY.md`; README 17 ticked only where verified.

---

## Stage 6 — Visual upgrade and market mood (6a)

Owner request on 2026-10-07. Goal: make the first impression feel made for 20–26 year olds, and let the whole app's look react calmly to the market and the user's own money. No new routes, no new P-level features, nothing from the Won't list. README changes are C19–C22 above.

### 6a.1 First impression
- **Landing:** bold hero (48 px mobile, 60 px from 768 px, black weight) with ₹100 highlighted; the Home blobs drift behind it; a 3-card bento below (mint "A plan in 2 minutes", peach "Skip any month, free", lavender "Always see why"), each with a small inline-SVG drawing. On desktop the Starter-home mock stays on the right (README 9.1). No stats, counts or testimonials.
- **Check-in:** chunky option tiles with an inline SVG icon per answer (bars that grow for amounts and time frames), selected state = green border + 4 px green ring + filled check badge + filled icon chip. Each step slides in from the right (from the left going back), 240 ms; the progress bar animates from the previous step, 300 ms. Shared `OptionTiles` keep their old layout elsewhere and only gain the ring.
- **Starter plan reveal:** the Cushion vs Grow bar fills from the left (300 ms, grow 150 ms after cushion), then the bucket cards rise in one after the other (280 ms, 200 ms and 310 ms delays).
- **Motion rules:** 150–300 ms ease-out, `animation: none` under `prefers-reduced-motion` (no delayed reveal either).

### 6a.2 Market mood (`src/lib/mood.ts`)
One function, `marketMood(state)`, returns `up | flat | small_dip | big_dip`:
- **Own money** (holdings that have lived through a simulated week): big dip if overall ≤ −10% (the insight's big-dip line) or this week ≤ −5%; small dip if this week ≤ −0.5%; up if this week ≥ +1%; else flat.
- **No money of your own yet:** from the latest simulated week's scenario (or the chosen one before any week): up → up, normal/flat → flat, dip_small → small dip, dip_sharp → big dip.
- A Reviewer-tools preview overrides it.

`AmbienceRoot` writes the mood, time of day, payday and weekend to `<html data-mood data-tod data-payday data-weekend>`. `tokens.ts` (`MOOD_TOKENS`, `TOD_TOKENS`, `GOLD_BLOB`) holds every value, and Tailwind emits them as CSS variables for light and dark:

| Mood | Page tint (`--c-bg`) | Glow at the top of every screen | Home blobs | User's own change |
|---|---|---|---|---|
| Up | soft green | green | greener (green, mint, light mint) | green ▲ |
| Flat | neutral mint (base) | faint mint | green, mint, lavender | ink, no arrow |
| Small dip | soft peach | peach | peach, rose, lavender | soft rose ▼ |
| Big dip | soft rose | rose | rose, lavender, peach; drift 2.5× slower | soft rose ▼ |

The own-change colour follows the number itself (▲ green when up, ▼ rose when down), not the mood, so a preview never mislabels a number.

**Steady mode** (big dip): the insight card moves to the top of Home (with "Steady mode: just what matters this week.") and Dashboard; blobs slow; nothing promotional shows. The app has no ads or offers by design (README 3.3), so the one element that asks for more money than the plan, Home's "Got paid? Split it" card, and its payday glow are hidden. Navigation (Explore, Stocks) and plan set-up stay.

Never: alarm red, red buttons, red backgrounds or warning icons for the user's own losses. The insight's "Worth a look" icon changes from a warning triangle to an eye.

### 6a.3 Scenario-reactive extras
- **Simulated clock** = the simulated date at the viewer's real hour (weeks are all the simulation advances). Time of day: morning 5–11, afternoon 12–16, evening 17–20, night otherwise. Greeting: Good morning / Good afternoon / Good evening / Quiet night. Home's sky gradient follows it.
- **Payday glow:** in the simulated week pay is credited (a salary payday in the last 7 simulated days, or "Simulate pay credit" this week), Home's third blob turns gold and the "Got paid? Split it" card gets a gold fill, ring and a "Payday week" chip (text, not colour alone). Only when that card shows.
- **Goal ring:** Goals list, Dashboard goals and Goal detail show a ring with the % written inside; the arc warms from mint to Groww green and gets a still glow at 100%.
- **Markets closed:** on a simulated Saturday or Sunday, Home shows "Markets are resting. So can you." and Starter Explore's market line starts with it.

### 6a.4 Reviewer tools
A "Mood" card: Auto (shows the current simulated mood) · Up week · Flat · Small dip · Big dip, plus Time of day (Auto · Morning · Afternoon · Evening · Night) and Day (Auto · Weekday · Weekend). Stored in `state.preview` (optional), cleared by Reset and persona loads. "Simulate pay credit" also records `state.payCreditWeek`.

### 6a.5 Tests and verification
- `mood.test.ts` (every scenario and threshold, Riya = big dip, liquid-only not a big dip, previews, clock, weekends, payday window, glow rules), `goals.test.ts` (ring warmth and glow), new App tests (Landing bento, check-in tiles, plan reveal, Steady mode order, rose ▼ / green ▲, payday, weekend, goal ring, Mood control).
- `contrast.test.ts`: every text pair on each mood tint, and ink, muted, green, caution and rose text over the worst overlap of mood glow + time-of-day sky + any two blobs (gold in the payday week), in light and dark.
- Screenshots only of changed screens at 390 and 1280 px, plus Home in dark.
