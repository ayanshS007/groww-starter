# Groww Starter — Groww for Gen Z (Build Spec v4)

> You are an AI coding agent building a clickable front-end prototype of the Groww app, redesigned for first-time investors aged 20–26.
> This file is the single source of truth. Working agreements for the coding agent are in `CLAUDE.md`; visual references are in `design-refs/`. Read all three before writing code. If your own idea conflicts with this file, this file wins.
> If something is ambiguous, pick the simplest option, log the assumption in `CHANGELOG.md`, and continue. Stop only where a stage gate (section 16) says so.

---

## 0. Working rules

1. **Stage gates.** Work in the stages of section 16. Stop at the end of each stage and summarise in 5 lines or fewer. Stage 1 needs my approval.
2. **Build by priority.** Every feature carries a MoSCoW grade (section 3). P0 = Must, P1 = Should, P2 = Could. Finish and verify all P0 before any P1. Never start P2 unless I ask. Never build a Won't.
3. **No runtime network.** No APIs, analytics, remote images or CDN fonts. System font stack. All market data is simulated locally.
4. **Never fabricate financial claims.** Every price, NAV and return is mock data and labelled illustrative.
5. **No advice language.** The app shows a *starter shortlist based on your answers*. Never "best", "recommended for you", "top performing", "guaranteed".
6. **No vanity mechanics.** No confetti, leaderboards, points, streak pressure or countdowns. Engagement only ever rewards consistency and understanding, never frequency of buying or selling (section 3.3).
7. **Log decisions** in `CHANGELOG.md` (date, what, why). **Small diffs** when fixing.
8. **Do not write my submission documents.** No one-page note, no invented eval results, participants or quotes.

---

## 1. The case, framed (NPD steps 1–4)

### 1.1 Agreed intent
> Redesign Groww's experience so that **first-time investors aged 20–26 make an appropriate first investment and stay invested through their first 90 days**, delivered as a clickable front-end prototype with no real money.

Assumptions: Groww's business goal is retention and lifetime value of this cohort, not just account opening (account opening is already solved). Products in scope are those Groww already offers (mutual funds, stocks). No new regulated product is invented.

### 1.2 Primary persona (design for one)
**Riya, 22, Pune.** Seven months into her first job, takes home ₹28,000, sends ₹5,000 home, has no emergency savings. Opened Groww after a colleague's reel, started a ₹2,000 index fund SIP, and nearly stopped it the week her portfolio showed −6% and rent was due.

Set aside explicitly (served by the same features, not designed for first): Kabir, 21, student on a ₹12k stipend with irregular freelance income; Meera, 23, part-timer saving for a laptop. They appear as demo personas only.

### 1.3 Pain points (breadth first)
| # | Type | Pain point |
|---|---|---|
| P1 | Functional | Too many choices; no idea where to start |
| P2 | Functional | Jargon; can't explain what they own or why |
| P3 | Financial | Income arrives unevenly; month-end crunch makes the SIP feel like a burden |
| P4 | Financial | No emergency cushion, so any surprise expense forces a withdrawal |
| P5 | Emotional | Fear on the first dip; stopping feels like the safe move |
| P6 | Emotional | FOMO from reels, friends and Telegram tips |
| P7 | Functional | The app feels built for traders (F&O, intraday, charts up front) |
| P8 | Emotional | After setup, investing is invisible and easy to forget |
| P9 | Financial | Small amounts feel pointless |

### 1.4 Top issues and validation
Scored 1–3 on Frequency (how often), Severity (effect on money or wellbeing), Reachability (can Groww's product realistically move it).

| # | Pain point | Freq | Sev | Reach | Total |
|---|---|---|---|---|---|
| P1 | Where to start | 3 | 2 | 3 | **8** |
| P2 | Jargon | 3 | 2 | 3 | **8** |
| P3 | Uneven income / crunch | 2 | 3 | 3 | **8** |
| P5 | Fear on first dip | 2 | 3 | 3 | **8** |
| P4 | No cushion | 2 | 3 | 2 | 7 |
| P7 | Trader-first app | 3 | 1 | 3 | 7 |
| P6 | FOMO / tips | 2 | 2 | 2 | 6 |
| P8 | Invisible after setup | 2 | 1 | 2 | 5 |
| P9 | Small amounts feel pointless | 2 | 1 | 2 | 5 |

Reading the matrix: the four 8s fall into two clusters. **(A) Quitting in the first 90 days** (P3, P5, with P4 as the root cause) and **(B) starting without understanding** (P1, P2). Cluster A is ranked first because it destroys value that was already won.

Validation (hypotheses to confirm with real users before building):
- AMFI data shows SIP closures exceeding new registrations in Mar–Apr 2026; reports attribute early stops to dips and cash crunches among first-time earners, often without emergency savings.
- SEBI Investor Survey 2025 names complexity, lack of knowledge, trust deficit and fear of loss as the main barriers.
- Under-30s are now the majority of new investor registrations and typically start with ~₹1,000 SIPs, so small, recurring and fragile is the norm.

---

## 2. The solution: Groww Starter

**One line:** a beginner mode inside Groww that turns a first, small, uneven income into a lasting investing habit, by explaining every decision and offering a flexible alternative to quitting.

**Core assumption the MVP tests:** if a first-time investor understands why they hold what they hold, has a cushion, and is offered skip/pause at the moment they want to stop, they stay invested through their first dip and first cash crunch.

**MVP vs prototype (important):**
- The **MVP** Groww would ship first to test that assumption is only: Starter plan + Confidence Layer + Flex SIP + Dip insight + Stop coach.
- The **prototype** wraps that MVP in a complete Groww app (sign-up, KYC, Explore, stocks, portfolio) so reviewers experience it in context. The extra screens are table stakes, not part of the experiment.

**The Confidence Layer** (on every money decision screen): **What is this? · Why am I seeing this? · What happens next?**

---

## 3. Feature decisions (graded)

Every proposed feature was scored with **RICE** and a **Vanity check**, then sorted with **MoSCoW**. Full scoring with assumptions is in Appendix A.

### 3.1 Decision table
| ID | Feature | RICE | Vanity fails (of 4) | Grade | Build as |
|---|---|---|---|---|---|
| F7 | Dip insight (weekly, calm, number-based) | 9.6 | 0 | **Must** | P0 |
| F1 | Money check-in → Starter plan (cushion + grow) | 8.0 | 0 | **Must** | P0 |
| F5 | Flex SIP (₹100, skip, pause, change, step-up) | 7.4 | 0 | **Must** | P0 |
| F2 | Confidence Layer on decision screens | 6.3 | 0 | **Must** | P0 |
| F6 | Stop coach (one screen, "Stop anyway" always visible) | 5.4 | 0 ⚠ | **Must** | P0 |
| F3 | Tap-to-explain glossary | 3.2 | 0 | **Must** | P0 |
| F21 | Calm, event-based in-app notifications | 4.5 | 0 ⚠ | Should | P1 |
| F11b | "What made you pick this?" + Tip Check inside buy flow | 2.5 | 1 | Should | P1 |
| F13 | Stock budget cap (user-set % of portfolio) | 2.0 | 1 | Should | P1 |
| F9 | Goal pots (incl. Emergency cushion goal) | 1.8 | 1 | Should | P1 |
| F19 | Starter / Pro view toggle | 1.8 | 0 | Should | P1 |
| F22 | Dashboard (one-glance view of your own money and plan) | 0.75 | 1 ⚠ | Should | P1 |
| F4 | Payday Split (simulated pay credit) | 1.7 | 0 | Should | P1 |
| F20 | Stocks in beginner mode + readiness check | 1.5 | 1 | Should | P1 |
| F15 | Milestone cards (no streaks) | 1.4 | 1 ⚠ | Should | P1 |
| F14 | Learn: 60-second cards | 0.75 | 2 | Could | P2 |
| F8 | UPI round-ups | 0.67 | 3 | **Won't** | — |
| F12 | Practice mode (paper money for stocks) | 0.67 | 4 | **Won't** | — |
| F17 | "Future You" compounding projection | 1.2 | 3 | **Won't** | — |
| F16 | Groww Wrapped (yearly shareable recap) | 0.5 | 3 | **Won't** | — |
| F18 | Gift a SIP | 0.10 | 3 | **Won't** | — |
| F10 | Squad pots (save with friends) | 0.08 | 4 | **Won't** | — |

⚠ = passes only with the guardrail in section 3.3. Table stakes (sign-up, KYC, Explore, invest, portfolio, withdraw) are not graded; they are required for a complete app.

### 3.2 How to read the grades
- **RICE = Reach × Impact × Confidence ÷ Effort.** Reach = share of new 20–26 users who touch it in their first 90 days (1–10). Impact = effect on the north star (3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal). Confidence = how sure we are (%). Effort = rough Groww build effort in person-months. All are hypotheses.
- **Vanity check (4 tests, each pass/fail):**
  1. **Outcome:** does it move the north star or a guardrail metric, not just opens, time or shares?
  2. **Pain:** does it address a top-cluster pain point (A or B)?
  3. **Safe at max:** if Groww optimised this feature hard, would users still be better off?
  4. **Missed:** would Riya notice its absence at a real decision moment?
- 0 fails = core. 1 fail = supporting. 2 = vanity risk (Could at best). 3–4 = vanity (Won't this round, regardless of RICE).
- F17 has a higher RICE than some Shoulds but fails three vanity tests (a projection reads like a return promise), so the vanity check overrides it.

### 3.3 Guardrails that keep ⚠ features honest
- **Stop coach:** exactly one screen; "Stop anyway" visible and equal size; success is measured by "users who chose what they meant to", never "stops prevented". Re-stop within 7 days is tracked as a harm signal.
- **Dashboard:** shows only the user's own holdings, SIPs, goals and plan health. No indices, gainers/losers, other users' activity or projections.
- **Notifications:** only state events (SIP due, done, skipped, dip context, goal milestones, KYC pending). No marketing, no "market is up, buy now". Opt-out rate is a guardrail.
- **Milestones:** count instalments made; skips and pauses never reset anything. No streak counter. Calm card, no confetti.

---

## 4. Information architecture

### 4.1 App shell (responsive web)
- **Mobile (< 768 px):** bottom tab bar with 5 tabs: Home · Explore · Dashboard · Portfolio · You. Learn is reached from a book icon in the top bar, from You, and from every underlined term.
- **Desktop (≥ 1024 px):** left sidebar (pattern from `design-refs/01`) with 6 items: Home · Dashboard · Explore · Portfolio · Learn · You, plus a small "Your plan" card pinned at the sidebar bottom (monthly amount, next SIP, link to plan). Top bar with page title, search (Explore), bell, avatar. Content max 1200 px on a 12-column grid; detail screens are two-column (content left, sticky action card right).
- **Tablet (768–1023 px):** mobile layout centred at max 600 px.
- Tab bar / sidebar hidden inside flows (sign-up, check-in, KYC, invest, stop coach); each flow has a visible back and close.

| Tab | Purpose | Route |
|---|---|---|
| Home | "What should I do next?" decision hub | `#/home` |
| Explore | Funds, stocks | `#/explore` |
| Dashboard | One-glance view of my money and plan | `#/dashboard` |
| Portfolio | Holdings, SIPs, goals | `#/portfolio` |
| Learn (sidebar on desktop, top-bar icon on mobile) | Glossary, Tip Check, cards | `#/learn` |
| You | Account, KYC, bank, preferences, reviewer tools | `#/you` |

Top bar: "Groww" text wordmark, bell with unread count, search on Explore.

### 4.2 Flow map
```
Landing ─ Get started ─▶ Sign up (mobile + OTP, simulated) ─▶ Check-in (6 steps) ─▶ Starter plan ─▶ Home
        ─ Just exploring ─▶ Home in browse mode
        ─ Reviewer: load a demo ─▶ Reviewer tools

Home ─▶ Next-step card ─▶ (KYC if pending) ─▶ Fund detail ─▶ Invest ─▶ Success ─▶ Portfolio
     ─▶ "Got paid? Split it" (P1) ─▶ Payday Split ─▶ one-time cushion top-up

Explore ─▶ Funds (collections, chips, search, filters) ─▶ Fund detail ─▶ Invest
        ─▶ Stocks, beginner mode (P1) ─▶ Stock detail ─▶ Buy ─▶ "What made you pick this?" ─▶ (Tip Check) ─▶ Order placed

Portfolio ─▶ Holding detail ─▶ Invest more / Withdraw
          ─▶ SIP detail ─▶ Skip / Pause / Edit / Step-up / Stop ─▶ Stop coach
          ─▶ Goals (P1) ─▶ Goal detail ─▶ link SIP
          ─▶ Weekly insight card (reacts to market scenario)

Dashboard ─▶ KPI tiles · value chart · allocation · plan health (each links to its fix) · goals · SIPs · activity

Learn ─▶ Glossary · Tip Check · 60-second cards (P2)
You   ─▶ KYC · Bank & autopay · Redo check-in · Starter/Pro view (P1) · Stock budget (P1) · Notifications · Reviewer tools
Bell  ─▶ Inbox (P1)
```

### 4.3 Route map (hash routing)
| Route | Screen | P | Needs |
|---|---|---|---|
| `/` | Landing | P0 | — |
| `/signup` | Mobile + OTP + name | P0 | — |
| `/checkin/:step` | Check-in, steps 1–6 | P0 | signed up |
| `/plan` | Starter plan | P0 | check-in |
| `/home` | Home | P0 | — (browse mode if no plan) |
| `/kyc/:step` | KYC, 4 steps (simulated) | P0 | signed up |
| `/explore`, `/explore/funds` | Explore, fund list | P0 | — |
| `/fund/:id` | Fund detail | P0 | — |
| `/invest/:fundId` | Invest flow | P0 | KYC done, else KYC with return path |
| `/invest/success/:orderId` | Success | P0 | order |
| `/portfolio` | Portfolio | P0 | — (empty state) |
| `/portfolio/holding/:id` | Holding detail | P0 | holding |
| `/portfolio/sip/:id` | SIP detail | P0 | SIP |
| `/portfolio/sip/:id/stop` | Stop coach | P0 | SIP |
| `/learn`, `/learn/glossary` | Learn hub, glossary | P0 | — |
| `/learn/tip-check` | Tip Check | P1 | — |
| `/you` | You | P0 | — |
| `/review` | Reviewer tools | P0 | — |
| `/payday` | Payday Split | P1 | plan |
| `/portfolio/goals`, `/portfolio/goal/:id` | Goals | P1 | — / goal |
| `/explore/stocks`, `/stock/:id`, `/stock/:id/buy` | Stocks | P1 | — / — / KYC |
| `/dashboard` | Dashboard | P1 | — (empty state if no holdings) |
| `/you/trading` | Stock budget + readiness | P1 | — |
| `/notifications` | Inbox | P1 | — |
| `/learn/card/:id` | 60-second card | P2 | — |

**Missing-state rule:** any route whose required state is missing redirects to the earliest valid screen with a one-line toast ("Let's set up your account first"). Unknown routes go to Home.

---

## 5. Scope

- **P0 (Must + table stakes):** Landing, sign-up, check-in, Starter plan, Home, KYC, Explore funds, Fund detail with Confidence Layer, Invest flow, Success, Portfolio, Holding detail, Withdraw, SIP detail with Flex SIP actions, Stop coach, Dip insight, Glossary + `Term`, Learn hub (glossary entry), You, Reviewer tools, responsive shell.
- **P1 (Should):** Dashboard, Explore Pro view, Payday Split, Goals, Stocks beginner mode, readiness check, stock budget cap, buy-flow "What made you pick this?" + Tip Check, Starter/Pro toggle, milestone cards, notifications inbox.
- **P2 (Could, only if asked):** 60-second Learn cards.
- **Won't (do not build or stub):** UPI round-ups, Practice mode, Future You projections, Groww Wrapped, Gift a SIP, Squad pots, real payments/KYC/auth, backend, real market data, F&O/intraday execution, margin, US stocks, IPOs, tax tools, loans, social feeds, leaderboards, chatbot/AI assistant, push notifications, language switcher, user-facing theme toggle.

---

## 6. Tech and delivery

### 6.1 Stack
Vite + React 18 + TypeScript + Tailwind CSS. Hash-based routing (React Router `HashRouter` or a small custom hash router). State via Context + `useReducer`, persisted to `localStorage` under one key, every read/write in try/catch, app must work when storage fails. Vitest for all pure logic. No UI kit, no chart library: sparklines, bars and range bands are hand-written inline SVG. Icons are inline SVG.

### 6.2 Delivery targets
- **Build environment:** Claude Code on the web, working in a GitHub repo, one branch + pull request per stage.
- **Live preview:** a GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys `dist/` to GitHub Pages on every push to `main`, so I can open each merged stage at a public URL.
- **Submission link:** the same single-file build is published as a Claude artifact link (or the GitHub Pages URL is used). So `npm run build` must also produce a **single self-contained `dist/index.html`** (use `vite-plugin-singlefile`): all JS/CSS inlined, no external requests, under 16 MB. Include `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, safe-area padding via `env(safe-area-inset-*)`, and `height: 100%` instead of `100vh` for full-screen layouts.
- **Fallback:** the same `dist/` deploys to Vercel or Netlify.
- **Theme:** light design is primary. Define colour tokens on `:root`, and provide a matching dark token set under `@media (prefers-color-scheme: dark)` (no toggle) so the page renders correctly in a dark viewer. Give `body` an explicit background.

### 6.3 Folder structure
```
src/
  data/ funds.ts stocks.ts glossary.ts learn.ts personas.ts
  lib/  planner.ts paydaySplit.ts market.ts insight.ts sipCoach.ts tipCheck.ts
        goals.ts readiness.ts stockBudget.ts milestones.ts notifications.ts planHealth.ts
        activity.ts format.ts
        *.test.ts (one per module)
  state/ store.tsx types.ts
  components/ AppShell TabBar Sidebar TopBar Button Card Chip OptionTile ProgressBar
              BottomSheet Toast RiskMeter RangeBand Sparkline Term ConfidenceBlock
              WhyDrawer AmountInput StepperInput UpiChooser EmptyState Disclaimer SkeletonRow
              KpiTile Donut AreaChart ProgressRow StatusPill DataTable IndexStrip RangeBar52w LetterAvatar
  screens/ (one folder per tab, one file per screen)
evals/ EVALS.md PERSONAS.md
design-refs/ (screenshots + DESIGN_REFS.md, read-only)
.github/workflows/deploy.yml
CHANGELOG.md DEPLOY.md PLAN.md
```

### 6.4 State shape
```ts
type State = {
  user: { signedUp: boolean; name?: string; mobile?: string; kyc: 'none'|'in_progress'|'done'; bankLinked: boolean; autopay: boolean };
  checkin?: CheckinAnswers;
  plan?: StarterPlan;
  holdings: Holding[];      // { id, kind: 'fund'|'stock', assetId, units, invested, createdAt }
  sips: Sip[];              // { id, fundId, amount, dayOfMonth, status: 'active'|'paused'|'stopped', pausedUntil?, skipNext, stepUpPct?, goalId?, instalments, createdAt }
  orders: Order[];          // { id, kind, assetId, amount, type: 'sip_first'|'one_time'|'buy'|'redeem', pickReason?, status, createdAt }
  goals: Goal[];            // { id, name, target, byDate, sipIds, isCushion }
  watchlist: string[];
  prefs: { view: 'starter'|'pro'; stockBudgetPct: number; readinessPassed: boolean; notif: Record<string, boolean> };
  market: { scenario: Scenario; week: number; history: Scenario[] };   // one entry per simulated week, used by Dashboard chart
  activity: ActivityItem[]; // { id, at, kind: 'sip_instalment'|'sip_skipped'|'sip_paused'|'sip_resumed'|'sip_stopped'|'one_time'|'buy'|'redeem'|'goal_created', assetId?, amount?, note? }
  readNotifications: string[];
  seenMilestones: string[];
};
```

---

## 7. Mock data (illustrative, generic names, no real scheme or fund-house names)

### 7.1 Funds
| id | Name | Category | One-liner | Risk 1–5 | Horizon | Min SIP | Min one-time | Vol. |
|---|---|---|---|---|---|---|---|---|
| `liquid1` | Liquid Fund – A | Liquid | A parking spot for money you may need soon | 1 | < 1 yr | ₹100 | ₹100 | 0.02 |
| `liquid2` | Liquid Fund – B | Liquid | Same idea, different fund house | 1 | < 1 yr | ₹100 | ₹500 | 0.02 |
| `shortdebt1` | Short Duration Debt Fund | Debt | Lends for short periods; steadier than shares | 2 | 1–3 yrs | ₹100 | ₹500 | 0.15 |
| `arb1` | Arbitrage Fund | Hybrid | Low-risk fund using price gaps between markets | 2 | 1–3 yrs | ₹500 | ₹1,000 | 0.05 |
| `balanced1` | Balanced Advantage Fund | Hybrid | Shares and bonds mix that shifts with markets | 3 | 3–5 yrs | ₹100 | ₹500 | 0.60 |
| `index50` | Nifty 50 Index Fund | Index | A slice of India's 50 largest companies | 4 | 5+ yrs | ₹100 | ₹500 | 1.00 |
| `indexnext50` | Nifty Next 50 Index Fund | Index | The next 50 big companies; more swings | 4 | 5+ yrs | ₹100 | ₹500 | 1.25 |
| `flexi1` | Flexi Cap Fund | Equity | A manager picks shares across company sizes | 5 | 5+ yrs | ₹100 | ₹500 | 1.20 |
| `midcap1` | Mid Cap Fund | Equity | Mid-sized companies; bigger hopes, bigger falls | 5 | 7+ yrs | ₹100 | ₹500 | 1.45 |
| `gold1` | Gold Fund of Fund | Gold | Tracks gold without buying jewellery | 3 | 3+ yrs | ₹100 | ₹500 | 0.40 |

Each fund also has `whatItIs` (2–3 sentences), `mainRisk`, `goodFor`, `notIdealFor`, `illustrativeRange1y`, `expenseRatio` (mock), `exitLoad` (plain words), `whatHappensNext` (exactly 3 steps), `baseNav`, `sparkline` (24 points).

Collections (filters, not advice): Start with ₹100 · Money I may need this year · Steadier ride, 1–3 years · Long game, 5+ years · Simple and low-cost.

### 7.2 Stocks (P1)
10–12 fictional companies named "… (sample)", fields: `ticker, sector, price, whatTheyDo, sizeLabel, volFactor, sparkline, mainRisk`. At least two priced above ₹2,000.

### 7.3 Glossary (P0) and Learn cards (P2)
Glossary ≥ 15 terms (SIP, NAV, units, expense ratio, exit load, lump sum, redemption, index, Nifty 50, equity, debt fund, liquid fund, KYC, UPI autopay, delivery vs intraday, F&O, XIRR), each with a one-line meaning and an everyday analogy. Learn cards (P2): 8 cards × 3 bullets.

### 7.4 Demo personas (for reviewers; not design personas)
| Persona | Check-in | Pre-filled state |
|---|---|---|
| Riya, 22, first job (primary) | salary ₹25–50k, no cushion, wealth, 5+ yrs, "wait it out" | index SIP ₹2,000, 3 instalments, scenario `dip_sharp` |
| Kabir, 21, student | stipend < ₹10k, no cushion, exploring, 1–3 yrs, "sell" | none |
| Meera, 23, part-timer | part-time ₹10–25k, some cushion, specific goal, < 1 yr, "wait" | Goal "Laptop", liquid SIP ₹1,500 |
| Arjun, 24, curious about stocks | salary ₹50k+, cushion yes, wealth, 5+, "stay" | index SIP ₹5,000, watchlist 3 stocks |

---

## 8. Logic (pure functions, all tested)

### 8.1 Check-in → Starter plan (`planner.ts`)
Six steps, one per screen, no auto-advance, "Why we ask" under each:

| Step | Question | Options |
|---|---|---|
| 1 | How does money come in, and roughly how much a month? | Type: Stipend/pocket money · Part-time/freelance · Salary · Not earning yet. Band: < ₹10k · ₹10–25k · ₹25–50k · ₹50k+ (two tile rows on one screen) |
| 2 | Do you have money set aside for emergencies? | Yes, a few months · Some · Not yet |
| 3 | What is this money for? | Grow wealth · A specific goal · Build a cushion · Just exploring |
| 4 | When might you need it? | < 1 yr · 1–3 yrs · 3–5 yrs · 5+ yrs |
| 5 | If it fell 10% for a while, you'd… | Probably sell · Wait it out · Stay, maybe add |
| 6 | How much a month feels easy? | ₹100 · ₹500 · ₹1,000 · ₹2,500 · Custom (₹100–₹1,00,000) |

Derived: risk comfort sell → Low, wait → Moderate, stay → High. Comfort ceiling by band: < ₹10k → ₹1,500; ₹10–25k → ₹4,000; ₹25–50k → ₹10,000; ₹50k+ → ₹25,000 (soft note only, never blocks).

**Step A — Cushion vs Grow split (first match wins):**
| Rule | Condition | Cushion | Grow |
|---|---|---|---|
| A1 | Goal = cushion | 100% | 0% |
| A2 | Horizon < 1 yr | 100% | 0% |
| A3 | No cushion and income not salary | 70% | 30% |
| A4 | No cushion and salary | 50% | 50% |
| A5 | Some cushion | 30% | 70% |
| A6 | Cushion yes | 0% | 100% |
Round each part to nearest ₹50. If a part falls under ₹100, merge it into the other and say so.

**Step B — Grow category (horizon × risk comfort):**
| Horizon ↓ / Comfort → | Low (sell) | Moderate (wait) | High (stay) |
|---|---|---|---|
| < 1 yr | Liquid | Liquid | Liquid + conflict note |
| 1–3 yrs | Short Duration Debt | Short Duration Debt | Short Duration Debt, alt Balanced Advantage |
| 3–5 yrs | Short Duration Debt | Balanced Advantage | Balanced Advantage, alt Nifty 50 Index |
| 5+ yrs | Balanced Advantage + conflict note | Nifty 50 Index | Nifty 50 Index, alt Flexi Cap |

Rows (time) dominate columns (comfort) as horizon shrinks, because timing risk outweighs comfort with swings. Cushion bucket is always `liquid1`. Goal changes the wording of reasons, not the fund.

Conflict notes:
- < 1 yr + High: "You're fine with ups and downs, but you need this within a year. Shares could be down exactly when you withdraw, so we're starting you steadier."
- 5+ yrs + Low: "You have lots of time, but a big fall would worry you. A balanced fund grows with a smoother ride."

Output: `{ monthly, buckets[{role, fundId, amount, reason}], alternativeFundId?, factors[≥3, each citing an answer], conflictNote?, overCeilingNote?, label: 'Starter shortlist based on your answers. Not investment advice.' }`

### 8.2 SIP date
Salary: ask payday (default 1st), suggest payday + 3 days. Irregular income: default 10th with "Skip any month, free." Range 1–28.

### 8.3 Payday Split (`paydaySplit.ts`, P1)
Trigger: Home card "Got paid? Split it" (and reviewer tool "Simulate pay credit"). Input: amount received, existing monthly SIPs, cushion goal (target default = 3 × income-band midpoint, editable; current = value of liquid holdings).
Output three lines: **Already going to SIPs** (sum of active SIPs), **Cushion top-up** (10% of pay while cushion < target, else 0, rounded to ₹50), **Yours to spend** (the rest). One CTA "Top up cushion with ₹X" → one-time invest into `liquid1`. Copy: "A suggestion, not a rule. Change any number."

### 8.4 Market (`market.ts`)
Scenarios (weekly benchmark move): `normal +0.6%`, `dip_small −1.8%`, `dip_sharp −8%`, `up +2.4%`, `flat +0.1%`. Asset move = scenario × volatility factor. Default after first investment: `dip_small`. Reviewer tools switch scenario and advance weeks. Advancing a week appends the scenario to `market.history`, posts due SIP instalments to `activity` (skips and pauses respected), and recomputes values. `valueSeries(state)` returns weekly `{ week, invested, value }` points for the Dashboard chart. Demo personas ship with 8–12 weeks of seeded history (Riya's includes one `dip_sharp` week).

### 8.5 Dip insight (`insight.ts`)
Output `{ headline, body, actionNeeded, tone }`. Headline states what happened in ₹ and %. Rules:
- Up/flat: calm, "one week is not a trend", no action.
- Down, horizon ≥ 3 yrs, |move| < 10%: "A short-term move. Your horizon is {h}, so this alone doesn't mean you need to act."
- Down, horizon ≥ 3 yrs, |move| ≥ 10%: bigger dip acknowledged; past falls have recovered but not guaranteed; selling now locks in the fall; optional "Review my plan".
- Down, horizon < 3 yrs: explain the fund is the steadier type for this reason.
- Liquid-only portfolio under `dip_sharp` never produces alarming words ("crash", "alert", "sell now"). Never red styling.

### 8.6 Stop coach (`sipCoach.ts`)
| Reason | Response | Options, in order |
|---|---|---|
| Market fell | current move in plain numbers; continuing buys more units at lower prices | Keep going · Pause 1–3 months · Stop anyway |
| Money is tight | "Skipping is free and keeps your plan alive." | Skip next · Lower amount · Pause · Stop anyway |
| I need the money | stopping doesn't return money; Withdraw does, with timing | Go to Withdraw · Stop anyway |
| Found a better fund | side-by-side on risk, horizon, min, expense ratio | Keep · Stop anyway |
| Something else | — | Pause · Stop anyway |
After stopping: confirm existing units stay invested.

### 8.7 Buy-flow pick reason + Tip Check (`tipCheck.ts`, P1)
On Invest review and Stock buy review: "What made you pick this?" chips: My starter plan · I researched it · A friend or social media · Not sure. Optional, one tap, stored as `pickReason`. If "friend or social media" or "not sure": inline offer "Run a 30-second Tip Check?" (skippable, never blocks).
Tip Check: source (friend · Instagram/YouTube · Telegram/WhatsApp · news) + 6 yes/no: guaranteed return? · "buy now/only today"? · paid promoter or selling a course/group? · can you find what the company or fund does? · is the source SEBI-registered (RA/RIA)? · would losing this hurt rent, fees or EMI?
Outcomes: **Red flag** (any guaranteed return, or ≥ 3 risk answers) · **Be careful** (1–2) · **Fine to research further** (0). Show which answers drove it and one next step. Never says the market call is right or wrong. Also reachable from Learn.

### 8.8 Goals (`goals.ts`, P1)
Monthly needed = (target − current value) ÷ months left, rounded up to ₹50, labelled "Without counting returns". Shortfall line with three choices (increase SIP, extend date, keep as is). Goal < 1 year away linked to an equity fund: warning + "Switch to a steadier fund". Past date: ask to update.

### 8.9 Stocks safety (`readiness.ts`, `stockBudget.ts`, P1)
- Beginner mode: delivery only, Market or Limit orders (each explained). Intraday and F&O hidden with a "Why is this hidden?" sheet.
- Readiness: 5 questions, pass 4/5, unlocks the Pro view of stocks (more order types shown as explained text). F&O stays "Not available in this prototype".
- Stock budget: user-set % of portfolio (default 10%). A buy that would exceed it shows a gentle sheet with the numbers and "Buy anyway" / "Adjust". Never blocks.

### 8.10 Milestones (`milestones.ts`, P1)
Triggers: first investment · 3, 6, 12 instalments · "stayed invested through your first dip" (holding existed during a down week and the SIP was not stopped). Shown once as a calm card on Home. Skips and pauses never reset counts.

### 8.11 Plan health (`planHealth.ts`, P1, used by Dashboard)
Returns 4 checks, each `{ label, status: 'good'|'watch'|'todo', detail }`:
1. **Cushion:** liquid holdings vs cushion target → good ≥ 100%, watch 25–99%, todo < 25%.
2. **Horizon match:** every grow holding's fund horizon ≤ user's horizon → good, else watch with the mismatched fund named.
3. **Stock budget:** stock value as % of portfolio vs `stockBudgetPct` → good ≤ budget, watch above.
4. **SIPs running:** active SIPs / (active + paused) → good if all active, watch if any paused (with resume date), todo if none.
Never uses the word "fail". Statuses are text + icon, never colour alone.

### 8.12 Notifications (`notifications.ts`, P1)
Derived from state only: SIP due in 2 days · instalment done · skipped/paused · weekly insight ready · goal 25/50/75/100% · milestone · KYC pending. Tap routes to source.

---

## 9. Screens and acceptance criteria
Every screen: one primary CTA, a back path, no dead buttons, works at 390 px and at 1280 px.

1. **Landing `/`**: "Start investing with ₹100. Understand every step." Sub: "A plan built on your answers, not on tips." Primary Get started, secondary Just exploring, small link Reviewer? Load a demo. On desktop: two-column hero with a static mock of the Starter home on the right. No tickers or offers.
2. **Sign up**: 10-digit mobile → OTP ("Demo: any 6 digits") → name. "No KYC needed to look around."
3. **Check-in**: "Step n of 6", Continue disabled until answered, back keeps answers, `aria-live` errors on amount.
4. **Starter plan**: monthly amount, Cushion vs Grow bar with ₹ labels, one card per bucket (fund, one-liner, risk meter, horizon, Why this + factors), conflict/ceiling notes, plan label. Primary Start this plan; secondary Edit answers, See other options.
5. **Home**: greeting + status line → single Next-step card (check-in → KYC → first SIP → second bucket → "You're set. Next SIP on {date}") → portfolio snapshot with insight headline → Starter plan card → Got paid? Split it (P1) → milestone card if any (P1) → upcoming SIP with Skip shortcut. No news, gainers/losers, IPO or F&O banners.
6. **KYC**: PAN format → Aadhaar last 4 + OTP → selfie tile (tap simulates) → bank via UPI (₹1 check simulated) → "You're verified", return to origin.
7. **Explore / Funds**: hub tiles (Mutual funds, Stocks); funds list with search, collections, category chips, filter sheet (risk, min SIP), rows with risk label and illustrative 1-yr return. Empty search state with chips.
8. **Fund detail**: header with risk meter (text + 5 segments), horizon, minimums; sparkline + illustrative range band; three visible Confidence blocks (no tabs); mismatch banner if not in plan; good for / not ideal for; costs as `Term`s; watchlist; sticky Start SIP (primary) and One-time (secondary); disclaimer. Desktop: action card sticky on the right.
9. **Invest**: SIP/One-time toggle → amount with presets and ceiling note → SIP date (8.2) → review with key risk and required checkbox → pick reason chips (P1) → UPI app chooser (text tiles, no logos) → autopay mandate (SIP) → ~1s loading → Success: "Your first SIP is set." + 3 steps + Go to portfolio + "Set up your cushion SIP" if a second bucket exists.
10. **Portfolio**: value, invested, gain/loss ₹ and %, asset bar; insight card (`aria-live="polite"`) right under numbers; Holdings, SIPs, Goals (P1); empty state; disclaimer; small Reviewer tools link.
11. **Holding detail**: value, units, average NAV, sparkline; Invest more (primary), Withdraw (simulated, "reaches your bank in 1–3 working days", exit-load note).
12. **SIP detail**: amount, date, status, instalments, goal; Skip next (undo toast), Pause 1/2/3 months, Edit amount/date, Step-up +10% yearly, Stop SIP → coach.
13. **Stop coach**: section 8.6; toast and return to SIP detail with new status.
14. **Payday Split (P1)**: section 8.3.
15. **Goals (P1)**: create (suggestions: Emergency cushion, Laptop, Trip, Course fees), detail with progress, monthly needed, links, warnings.
16. **Stocks (P1)**: banner "New to stocks? 'Stocks vs funds' in 60 seconds" (glossary entry if P2 cards absent); list; detail with what they do, size label, sparkline, "₹1,000 buys {n} share(s)" (0 allowed, "Indian exchanges don't sell parts of a share"), main risk; buy with quantity stepper, order type, delivery only, budget check, pick reason, order placed.
17. **Learn**: glossary (P0), Tip Check (P1), cards (P2). No points. Desktop: sidebar item. Mobile: top-bar book icon and You menu.
18. **You**: name, masked mobile, KYC, bank and autopay, Redo check-in, Starter/Pro view (P1), Stock budget and readiness (P1), notification toggles, static Help (5 FAQs), About this prototype, Reviewer tools, Log out (= reset with confirm).
19. **Notifications (P1)**: Today / Earlier, unread dots, Mark all read.
20. **Reviewer tools `/review`**: scenarios + Advance one week, Simulate pay credit, load persona, jump links to every route, Reset. Note: "For reviewers. Not part of the user experience." On desktop also available as a collapsible right-edge panel.

21. **Dashboard `/dashboard` (P1)** — one-glance view of *my* money and plan, never the market. Layout follows `design-refs/01` (tile row, chart + donut, progress rows, table, bottom banner) in Groww green.
    - **Header:** "Your money at a glance", period chips (Last 4 weeks · Last 12 weeks · Since start), bell.
    - **Row 1, four KPI tiles** (pastel tinted, icon circle, mini sparkline): Current value (with ₹ and % since start) · Invested so far · This week (₹ and %; neutral amber icon when down, never red) · Next SIP (date, amount, inline Skip link).
    - **Row 2:** left 7 columns "Value vs invested" area chart from `valueSeries` (invested as a step line, value as a filled line, hover/tap tooltip, down weeks marked with a small dot and the label "You stayed invested" if no SIP was stopped that week). Right 5 columns "Where your money is" donut (Cushion · Grow funds · Stocks · Gold) with centre total, legend with ₹ and %, and a line "Plan split: 50 / 50 · Actual: 62 / 38".
    - **Row 3, three cards:** Plan health (8.11, status pills, each row links to the fix) · Goals (progress rows like the budget rows in `design-refs/01`, "₹X/month needed") · This month's SIPs (list of dates with status chips: done, upcoming, skipped, paused).
    - **Row 4:** Recent activity table (date, what happened, fund/stock, amount, status chip), 8 rows, "See all" → full list. On mobile it becomes a simple list.
    - **Row 5:** weekly insight as a full-width soft-green banner (same copy as Portfolio) with "Review my plan".
    - **Mobile order:** KPI tiles as a 2×2 grid → insight banner → chart → donut → plan health → SIPs → goals → activity list.
    - **Empty state:** greyed skeleton of the layout with "Your dashboard fills in after your first investment" and the Home next-step CTA.
    - **Must not show:** market indices, gainers/losers, other users, projections, leaderboards.

22. **Explore in Pro view (P1)** follows the Groww web pattern in `design-refs/03–05`: sub-tabs with underline indicator (Explore · Holdings · Orders · Watchlist), an index strip of *sample* indices labelled "Sample data", stock cards (letter avatar, name, price, change), and a watchlist table (trend sparkline, price, 1D change, 52-week L–H range bar). Conventional green/red with +/− signs is allowed for *market* prices in Pro view only; the user's own portfolio dips stay neutral everywhere. Starter view replaces the index strip with one plain line: "Markets this week: a small dip. Normal for a week."

**Starter vs Pro view (P1):** Starter is everything above. Pro shows denser fund rows (expense ratio, 1/3/5-yr illustrative returns), hides Confidence blocks behind a "Why this?" link, removes the stocks banner, and uses the Groww-web Explore pattern (item 22). The toggle lives in You and in the desktop top bar.

---

## 10. Design direction
- **Feel:** calm, confident, a little playful; looks like Groww grew up with Gen Z, not a different brand.
- **Palette tokens:** Groww-like green accent (`#00D09C`-like) for primary actions; ink `#1F2937`-like; near-white background; soft tinted card fills for categories (mint, lavender, peach, sky) at low saturation; amber for caution; blue (`#5367FF`-like) for info only; no red for normal dips.
- **Shape and type:** 16–24 px card radius, pill chips, large tabular numerals for money, system font stack, body ≥ 16 px, generous spacing on an 8 px grid.
- **Patterns:** one primary action per screen, bottom sheets for secondary choices, skeletons for loading, inline SVG icons and simple geometric illustrations (no remote images).
- **Motion:** 150–200 ms ease-out, respects `prefers-reduced-motion`. No confetti.
- **References (`design-refs/`, see `DESIGN_REFS.md`):**
  - `01-moneyflow-dashboard.png` → sidebar structure, KPI tiles with pastel tints and sparklines, donut + legend, progress rows, activity table, bottom banner. Swap its purple for Groww green.
  - `02-personal-finance-themes.png` → how one layout holds up in light and dark; large rounded cards; donut with centre total; pill segmented filters. Skip the radar chart.
  - `03/04/05-groww-web-*.png` → Groww's own web patterns: wordmark + top nav, underline sub-tabs, index strip, stock cards, watchlist table with sparkline and 52-week range bar, "Complete setup" side card (our Next-step card).
  - Never copy logos, real company names, real prices or illustrations from the refs. Use letter avatars and sample data.

---

## 11. Honesty, compliance, copy
- Plan label on every plan surface; disclaimer footer on Fund detail, Invest, Stock detail, Portfolio: "Illustrative prototype. All prices and returns are sample data. Investments are subject to market risks."
- Tone: smart older cousin. ≤ 18 words per UI sentence. Every jargon word is a `Term`. No hype, FOMO or urgency. At most one emoji per screen, as an icon.
- Gen Z touches: everyday ₹ framing ("₹500 is about two cinema tickets"), "start small, change later", "skip a month, free", payday-aware dates, zero lock-in language.
- Accessibility: semantic HTML, labelled inputs, visible focus, contrast ≥ 4.5:1, `aria-live` for insight, toasts and errors, risk never by colour alone, tap targets ≥ 44 px.
- Terminology: starter plan, cushion, grow, SIP (explained once), one-time, portfolio, holding, skip, pause, stop, withdraw.

---

## 12. Cross-cutting
Direct URLs never crash (4.3). Refresh restores state. Back after success goes to Portfolio, not into payment. Loading, empty and error states everywhere relevant. Zero console errors in a full walkthrough. Layout verified at 390 px, 768 px and 1280 px.

---

## 13. Evals

### 13.1 Success metrics (NPD step 6)
| Type | Metric | Window |
|---|---|---|
| **North star** | % of new 20–26 investors whose first SIP is active or paused (not stopped) at day 90, vs a control cohort | First 3 months post-launch |
| Supporting | Stop attempts that end in skip, pause or lower amount | 3 months |
| Supporting | First investments whose fund horizon matches the user's stated horizon | 3 months |
| Supporting | Comprehension: can explain why they hold it (in-app 2-question check) | 3 months |
| Guardrail | Re-stop within 7 days after the coach; complaint rate about stopping | Continuous |
| Guardrail | Share of new users trading intraday/F&O in first 90 days | Continuous |
| Guardrail | Notification opt-out rate | Continuous |
Usage numbers (opens, time in app, Learn views) are deliberately not success metrics.

### 13.2 Automated (agent builds; must pass)
| File | Must cover |
|---|---|
| `planner.test.ts` | all 12 matrix cells; A1–A6; both conflict notes; goal changes wording not fund; every reason cites ≥ 2 answers; rounding and merge; ceiling note; ₹99 and ₹1,00,001 |
| `paydaySplit.test.ts` | cushion below/at target; rounding; SIPs larger than pay |
| `insight.test.ts` | every branch; liquid-only under `dip_sharp` has no alarming words |
| `sipCoach.test.ts` | each reason returns its options in order; "Stop anyway" always present |
| `tipCheck.test.ts` | each tier; guaranteed return alone → red flag |
| `goals.test.ts` | monthly needed, rounding, short-goal-in-equity warning, past date |
| `readiness.test.ts`, `stockBudget.test.ts` | pass at 4/5; budget exceed detection |
| `milestones.test.ts` | triggers once; skip/pause never reset |
| `market.test.ts`, `format.test.ts` | value maths per scenario; `valueSeries` length and values; ₹1,00,000 grouping, negatives |
| `planHealth.test.ts`, `activity.test.ts` | every status threshold; skips/pauses respected when a week advances |

### 13.3 Human eval template (`evals/EVALS.md`; leave Result and Iteration blank)
| # | Cluster | Task / question | Metric | Success criterion | Result | Iteration made |
|---|---|---|---|---|---|---|
| 1 | B Start | "You earn ₹28k and want to start. Use the app." | completion, time to first SIP, wrong turns | ≥ 80% unaided, median < 4 min | | |
| 2 | B Start | "Why did the app suggest this?" | % citing ≥ 2 of their answers | ≥ 70% | | |
| 3 | B Start | "What is the main risk of this fund?" | % correct | ≥ 70% | | |
| 4 | A Stay | Portfolio −8% this week. "What would you do?" | % choosing an unnecessary stop/sell | ≤ 20% | | |
| 5 | A Stay | "Rent is due and money is tight. Handle your SIP." | % who skip/pause/lower instead of stop | ≥ 70% | | |
| 6 | A Stay | "You just got paid ₹28,000. What would you do in the app?" | % who find and use Payday Split | ≥ 60% | | |
| 7 | A Stay | "Are you on track for your laptop goal?" | % reading monthly-needed correctly | ≥ 70% | | |
| 8 | Safety | "A friend says buy stock X today." | % who check before buying | ≥ 60% | | |
| 9 | Safety | "Did the stop screen feel like it was trying to trap you?" 1–5 | mean | ≤ 2 | | |
| 10 | Visibility | On Dashboard: "Where is most of your money, and is your cushion on track?" | % answering both correctly | ≥ 70% | | |
| 11 | Overall | Confidence to invest, 1–5, before vs after | mean change | ≥ +1 with no drop in Q3 | | |
| 12 | Overall | "Does this feel like Groww?" 1–5 | mean | ≥ 4 | | |

### 13.4 Persona walkthroughs (`evals/PERSONAS.md`; results blank)
Scripts for the 4 demo personas with steps, expected plan from 8.1, expected insight branch, checkpoints. Agent findings are labelled **agent-simulated**, never user research.

---

## 14. Edge cases to verify
₹99 and ₹1,00,001 · PAN wrong format · OTP < 6 digits · direct URL to `/invest/x` without KYC · refresh mid-invest · back after success · stop coach on a paused SIP · skip then undo · goal date in the past · goal < 1 yr linked to equity · stock price > amount (0 shares) · buy exceeding stock budget · empty search · liquid-only in sharp dip · payday amount smaller than SIP total · Dashboard with no holdings · Dashboard after Advance one week ×3 · reset then direct URL to `/portfolio` · storage unavailable.

---

## 15. What I will write myself (agent: do not draft)
The one-page note (take, scope, out of scope, solution and why), the final prompt log, and the eval results.

---

## 16. Stages
- **Stage 0 — Understand.** 6-line summary, top 3 UX risks, assumptions. No code.
- **Stage 1 — Plan.** `PLAN.md`: route map, state shape, components, and per screen: user goal, key info, primary CTA, secondary actions, decision enabled, what must not appear, P-level. **Stop for approval.**
- **Stage 2 — Foundation.** Scaffold, tokens (light + dark), store, all `data/*` and `lib/*`, all 13.2 tests (plus `planHealth`, `activity`), single-file build config, GitHub Pages workflow. `npm test` and `npm run build` pass. Stop with test summary.
- **Stage 3a — Entry.** Shell (mobile tabs + desktop sidebar), Landing, Sign up, Check-in, Plan, Home, KYC, Glossary/`Term`, Learn hub, You, Reviewer tools. Stop.
- **Stage 3b — Money in.** Explore, funds, Fund detail, Invest, Success, Portfolio, Holding detail, Withdraw. Verify Landing → Portfolio. Stop.
- **Stage 3c — Stay.** SIP detail, Flex SIP actions, Stop coach, insight with scenarios. Stop. **(P0 complete.)**
- **Stage 3d — Should (P1).** Dashboard first, then Explore Pro view, Payday Split, Goals, Stocks + readiness + budget + pick reason/Tip Check, Starter/Pro, milestones, notifications. Stop and list unmet criteria.
- **Stage 4 — QA.** Create `evals/EVALS.md` and `evals/PERSONAS.md`. Walk the personas and section 14 at 390 / 768 / 1280 px (use Playwright screenshots if it can be installed; otherwise say so and rely on tests + my manual check). Report first (broken interactions, unclear copy, dead buttons, hesitation points, inconsistent terms, missing states), labelled agent-simulated. Fix only what I pick.
- **Stage 5 — Polish and ship.** Hierarchy, readability, CTA clarity, consistency, states, responsiveness, accessibility, terminology. Remove anything that doesn't help the next decision. Write `DEPLOY.md` (Claude artifact from single-file `dist/index.html`; optional Vercel/Netlify; verify in incognito). Tick section 17 only for what you verified.

---

## 17. Definition of done
Ticked in Stage 5 only where checked in that stage; the note says how. Unticked items say what was and wasn't checked.

- [x] Landing → sign-up → check-in → plan → KYC → first SIP → portfolio works with no dead buttons. *Checked:* scripted Playwright run on the single-file build at 390 and 1280 px (Get started → sign-up → 6 check-in steps → plan → Start this plan → KYC 4 steps → pay → autopay → Success → Go to portfolio → Back), every step advanced, 0 console errors, 0 network requests. Not a crawl of every control in Stage 5 (the Stage 3d-2 crawl is in `CHANGELOG.md`).
- [x] Planner matrix and A-rules correct; all tests pass. *Checked:* `npm test`, 686 tests passing (`planner.test.ts` covers the 12 cells and A1–A6).
- [x] Every plan and fund detail shows "Why am I seeing this?" citing ≥ 2 answers; conflicts explained. *Checked:* `planner.test.ts` (reasons cite ≥ 2 answers), `explore.test.ts` and `App.test.tsx` (fund detail why-text, conflict banners); Fund detail screenshots at 390 and 1280 px.
- [x] Fund detail shows all three Confidence blocks without tabs. *Checked:* `App.test.tsx` acceptance test and screenshots at 390 and 1280 px.
- [ ] Skip, pause, edit, step-up and Stop coach work and update Home and Portfolio; "Stop anyway" always visible. *Covered by reducer, sipCoach and App tests (all passing); not re-driven in a browser in Stage 5. Browser checks are in the Stage 3c and Stage 4 entries of `CHANGELOG.md`.*
- [x] Insight reacts to all scenarios; no alarm styling. *Checked:* `insight.test.ts` (every branch, no alarm words for a liquid-only portfolio) and the `App.test.tsx` no-red/no-alarm-word tests, all passing.
- [ ] (P1) Dashboard shows only my own money, all tiles/charts update with scenario and week changes, empty state works. *Stage 5 only checked the Dashboard layout (row 3 equal heights) at 390 and 1280 px for Riya; scenario and week updates not re-run.*
- [ ] (P1) Payday Split, Goals, Stocks safety, Tip Check, Starter/Pro, milestones, notifications work. *Not re-run in Stage 5; browser checks are in the Stage 3d and Stage 4 entries of `CHANGELOG.md`.*
- [x] No Won't feature built; no confetti, streak counter, leaderboard or projection. *Checked:* searched `src/` for confetti, leaderboard, streak, countdown and projection wording; only comments saying these are absent.
- [ ] Disclaimers and plan labels present; all numbers labelled illustrative. *Seen in screenshots of Home, Dashboard and Fund detail; not checked on every screen.*
- [ ] Works at 390, 768 and 1280 px; light and dark tokens render cleanly. *Stage 5 checked only the changed screens: Home at 390 and 1280 px in light and dark; Landing, Dashboard and Fund detail at 390 and 1280 px in light (screenshots); Plan at 390 and 1280 px by measured tap sizes and heading order, not screenshots. 768 px was not re-checked.*
- [x] Direct URLs, refresh and storage failure never crash. *Checked:* with `localStorage` throwing, loaded and refreshed `/`, `/home`, `/portfolio`, `/dashboard`, `/fund/midcap1`, `/invest/x`, `/plan`, `/payday` and an unknown route: each landed on a sensible screen with the storage notice and 0 page errors.
- [x] `npm test` and `npm run build` pass; single-file `dist/index.html` produced; zero console errors. *Checked:* both commands run before the final commit; `check-dist` confirmed one self-contained file; console had 0 errors on every page visited in Stage 5.
- [ ] `CHANGELOG.md`, `evals/EVALS.md`, `evals/PERSONAS.md`, `DEPLOY.md` exist; GitHub Pages URL loads in incognito. *The four files exist (checked). The Pages URL was **not** checked: this environment can't open the published site, and Pages deploys only after this PR is merged to `main`. Follow `DEPLOY.md` to verify it.*

---

## Appendix A — Full feature scoring

R = Reach (1–10), I = Impact on north star (0.25–3), C = Confidence, E = Effort (person-months, rough). Vanity tests: O = Outcome, P = Pain, S = Safe at max, M = Missed. ✓ pass, ✗ fail, ⚠ pass only with guardrail (3.3).

| ID | Feature | R | I | C | E | RICE | O | P | S | M | Fails | Verdict and reasoning |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F7 | Dip insight | 8 | 2 | 60% | 1 | 9.6 | ✓ | ✓ | ✓ | ✓ | 0 | Must. Everyone sees a down week; directly targets the quit moment |
| F1 | Starter plan | 10 | 2 | 80% | 2 | 8.0 | ✓ | ✓ | ✓ | ✓ | 0 | Must. Every new user; solves where-to-start and cushion together |
| F5 | Flex SIP | 7 | 3 | 70% | 2 | 7.35 | ✓ | ✓ | ✓ | ✓ | 0 | Must. Partly exists today; the change is making it the default alternative to stopping |
| F2 | Confidence Layer | 9 | 1 | 70% | 1 | 6.3 | ✓ | ✓ | ✓ | ✓ | 0 | Must. Cheap, on every decision |
| F6 | Stop coach | 3 | 3 | 60% | 1 | 5.4 | ✓ | ✓ | ⚠ | ✓ | 0 | Must. Low reach, huge impact; dark-pattern risk handled by guardrail |
| F21 | Event notifications | 9 | 1 | 50% | 1 | 4.5 | ✓ | ✓ | ⚠ | ✓ | 0 | Should. Delivery channel for F5/F7; spam risk guarded |
| F3 | Tap-to-explain | 8 | 0.5 | 80% | 1 | 3.2 | ✓ | ✓ | ✓ | ✓ | 0 | Must. Hygiene for jargon pain |
| F11b | Pick reason + Tip Check in buy flow | 5 | 1 | 50% | 1 | 2.5 | ✓ | ✗ | ✓ | ✓ | 1 | Should. Standalone Tip Check scored 1.2 with 2 fails (no pull); moving it into the buy flow raises reach |
| F13 | Stock budget cap | 4 | 1 | 50% | 1 | 2.0 | ✓ | ✗ | ✓ | ✓ | 1 | Should. Guardrail feature for stock curiosity |
| F9 | Goal pots | 6 | 1 | 60% | 2 | 1.8 | ✓ | ✓ | ✓ | ✗ | 1 | Should. Gives a reason to stay; users without goals won't miss it |
| F19 | Starter / Pro view | 9 | 1 | 60% | 3 | 1.8 | ✓ | ✓ | ✓ | ✓ | 0 | Should. Foundation of progressive disclosure; high effort for real Groww |
| F4 | Payday Split | 5 | 2 | 50% | 3 | 1.67 | ✓ | ✓ | ✓ | ✓ | 0 | Should. Strong idea, but needs income detection (bank data consent) in reality |
| F20 | Stocks beginner mode + readiness | 5 | 1 | 60% | 2 | 1.5 | ✓ | ✗ | ✓ | ✓ | 1 | Should. Needed for a complete Groww; protects guardrail metric |
| F15 | Milestones (no streak) | 7 | 0.5 | 40% | 1 | 1.4 | ✓ | ✓ | ⚠ | ✗ | 1 | Should, milestones only. A streak counter fails S (pressure to invest money you don't have) |
| F22 | Dashboard | 6 | 0.5 | 50% | 2 | 0.75 | ✗ | ✓ | ⚠ | ✓ | 1 | Should. Added on product-owner request and scored honestly: low RICE, but desktop reviewers and users need one place to see what they own (pain P2). Guardrail: only the user's own money and plan, never market movers |
| F17 | Future You projection | 6 | 0.5 | 40% | 1 | 1.2 | ✗ | ✓ | ✗ | ✗ | 3 | Won't. Projections read as return promises; motivational, not decisional |
| F14 | Learn cards | 6 | 0.5 | 50% | 2 | 0.75 | ✗ | ✓ | ✓ | ✗ | 2 | Could. Views are not outcomes; contextual help (F2, F3) does the real job |
| F8 | UPI round-ups | 4 | 1 | 50% | 3 | 0.67 | ✗ | ✗ | ✓ | ✗ | 3 | Won't. Feels good, tiny amounts, weak link to SIP retention; good future habit experiment |
| F12 | Practice mode | 4 | 1 | 50% | 3 | 0.67 | ✗ | ✗ | ✗ | ✗ | 4 | Won't. Paper trading can train trading frequency; revisit later without leaderboards |
| F16 | Groww Wrapped | 8 | 0.25 | 50% | 2 | 0.5 | ✗ | ✗ | ✓ | ✗ | 3 | Won't. A brand/growth loop, arrives after day 90; mention as future growth idea |
| F18 | Gift a SIP | 2 | 0.5 | 30% | 3 | 0.10 | ✗ | ✗ | ✓ | ✗ | 3 | Won't. Acquisition, not the agreed intent; gifting units has KYC complexity |
| F10 | Squad pots | 2 | 0.5 | 30% | 4 | 0.08 | ✗ | ✗ | ✗ | ✗ | 4 | Won't. Social comparison risk; pooled money isn't how fund units work |


---

## Appendix B — Sources
- NSE Market Pulse via Outlook Money (June 2026): https://www.outlookmoney.com/invest/gen-z-leads-the-charge-as-indias-investor-base-hits-1325-million
- Gen Z SIP tickets and preferences: https://www.share.market/buzz/learn/gen-z-financial-terms/
- SEBI Investor Survey 2025: https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf
- Finfluencer findings (Samco summary): https://www.samco.in/knowledge-center/articles/gen-z-investing-paradox-risk-averse-despite-high-awareness-sebi-survey-shows/
- Under-30 F&O losses: https://hdfcsky.com/blogs/media-coverage/young-investors-transform-indian-stockbroking
- SIP stoppage April 2026: https://oga-prod.angelone.in/news/mutual-funds/new-sip-registrations-drop-to-12-month-low-in-april-2026-amid-rising-closures
- Why young investors stop SIPs: https://startupwired.com/2026/05/25/of-investors-who-stop-sip-before-5-years/
- Gamification concerns (SEC review, Robinhood confetti): https://www.finextra.com/newsarticle/38728/sec-calls-for-feedback-on-trading-app-gamification
- Groww features (App Store): https://apps.apple.com/in/app/id1404871703
