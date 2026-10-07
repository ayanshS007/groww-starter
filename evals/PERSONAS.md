# Persona walkthroughs — Groww Starter

Source: README section 13.4 and the demo personas in README 7.4 (as changed by PLAN C2 and C15).

These are **scripts**, not results. Each persona is a demo state for reviewers, not a design persona and not a research participant. The **Result** column is blank on purpose: the product owner fills it in. Anything the coding agent observes while walking these scripts is labelled **agent-simulated** and is reported in the Stage 4 QA report, never here.

**How to load a persona:** Reviewer tools (`#/review`, or the right-edge panel on desktop) → Load *name* → Replace and load. Loading sets the simulated today to the real date and replaces all state.

**Widths to check:** 390 px (mobile), 768 px (tablet: mobile layout centred at max 600 px), 1280 px (desktop sidebar). Key screens also in dark mode (`prefers-color-scheme: dark`).

**Expected values** below come from the app's own logic (`buildPlan`, `insightFromState`, `planHealth`, `nextStep`) run on each persona seed. Money figures that depend on the simulated market are given as the persona loads, before any "Advance one week".

---

## 1. Riya, 22, first job (primary persona)

**Check-in (seeded):** Salary · ₹25–50k · emergency money: not yet · grow wealth · 5+ yrs · "wait it out" · ₹4,000 a month. Payday 1st.

**Seeded state:** Nifty 50 Index Fund SIP ₹2,000 on the 16th, 3 instalments; 12 weeks of history with two `dip_sharp` weeks (one mid-history, one the latest); next scenario `dip_sharp`. No cushion SIP yet.

**Expected plan (README 8.1):**
- Rule **A4** (no cushion, salary) → 50 / 50.
- Cushion: **Liquid Fund – A, ₹2,000**. Grow: **Nifty 50 Index Fund, ₹2,000** (5+ yrs × Moderate).
- No conflict note, no ceiling note (₹4,000 ≤ ₹10,000), no merge note.
- Suggested SIP date: the **4th** (payday + 3).
- Each bucket reason cites ≥ 2 answers; factors list ≥ 3.

**Expected insight branch:** **big dip** (overall ≤ −10% and horizon ≥ 3 yrs). Headline about "This week: −₹458 (−8.0%). Overall: −₹732 (−12.2%) on what you put in." Optional "Review my plan". Caution tone (amber), never red.

**Expected Home next step:** "Set up your cushion SIP" → ₹2,000 a month into Liquid Fund – A.

**Expected plan health:** Cushion **To do** (₹0 of a first ₹10,000; full target ₹1,12,500) · Time frame match **On track** · Stock budget **On track** (0% of 10%) · SIPs running **Keep an eye** (1 of 2 SIPs in the plan running; the cushion SIP isn't set up yet).

| # | Step | Checkpoint | Result |
|---|---|---|---|
| R1 | Load Riya, open Home | Greeting, "1 of 2 SIPs in your plan are running", one primary button (the next-step card) | |
| R2 | Home → Your money | Value, "You put in", change shown amber with an arrow and text, not red | |
| R3 | Open Portfolio | Insight card under the numbers is the big-dip branch; "Review my plan" is optional | |
| R4 | Open Plan | Plan matches the expected plan above; label "Starter shortlist based on your answers. Not investment advice." | |
| R5 | Home → "Set up ₹2,000 a month" | Single-fund flow into Liquid Fund – A with ₹2,000 prefilled; KYC already done so no verification step | |
| R6 | Portfolio → SIP → Skip next instalment | Undo toast; Undo restores the instalment | |
| R7 | SIP → Pause 1, 2 or 3 months → 1 month | Status Paused, resume date shown; Home and Dashboard reflect it | |
| R8 | SIP → Stop SIP | Stop coach is one screen; "Keep my SIP" and "Stop anyway" equal size from first render | |
| R9 | Stop coach → "Money is tight" | "Skipping is free and keeps your plan alive." Options in order, "Stop anyway" last | |
| R10 | Stop coach → "Market fell" | Current move in plain numbers; continuing buys more units at lower prices | |
| R11 | Home → "Got paid? Split it" | Pay ₹28,000; SIPs ₹2,000 · cushion top-up ₹2,800 · yours to spend ₹23,200 | |
| R12 | Payday → "Top up cushion with ₹2,800" | One-time draft into Liquid Fund – A at the amount step | |
| R13 | Open Dashboard | KPI tiles, value vs invested chart with down-week dots and "You stayed invested", donut, plan health as above | |
| R14 | Reviewer tools → Advance one week ×3, back to Dashboard | Tiles, chart end date, This month's SIPs and activity all change | |
| R15 | Portfolio → Goals → Create a goal (Laptop, date 8 months out, link the index SIP) | Short-goal-in-equity warning with "Switch to a steadier fund" | |

---

## 2. Kabir, 21, student

**Check-in (seeded):** Stipend or pocket money · < ₹10k · emergency money: not yet · just exploring · 1–3 yrs · "probably sell" · ₹500 a month.

**Seeded state:** signed up, KYC **not done**, nothing invested. 8 weeks of history; next scenario `normal`.

**Expected plan (README 8.1):**
- Rule **A3** (no cushion, income not salary) → 70 / 30.
- Cushion: **Liquid Fund – A, ₹350**. Grow: **Short Duration Debt Fund, ₹150** (1–3 yrs × Low).
- No conflict note; no ceiling note (₹500 ≤ ₹1,500); no merge (both parts ≥ ₹100).
- Suggested SIP date: the **10th** with "Skip any month, free." (irregular income).

**Expected insight branch:** none before the first investment. Straight after it: the **first-week** note ("Your money is on its way in."), holdings show "Processing, units arrive in 1–2 working days" and value equals what was invested. After Reviewer tools → Small dip → Advance one week: **down, horizon < 3 yrs** branch, explaining the funds are the steadier type for this reason.

**Expected Home next step:** "Start your first SIP (quick verification included)" → `/invest/plan`.

| # | Step | Checkpoint | Result |
|---|---|---|---|
| K1 | Load Kabir, open Home | Next-step card "Start your first SIP (quick verification included)"; no KYC step shown separately | |
| K2 | Open Portfolio and Dashboard | Empty states with "Start my plan"; Dashboard shows the greyed skeleton | |
| K3 | Plan → Start this plan | One date step, one review listing both SIPs, one risk checkbox | |
| K4 | Review → tick → Continue to payment | KYC starts at payment: PAN (wrong format shows an inline error), Aadhaar last 4 + code, selfie tile, ₹1 bank check | |
| K5 | After KYC | Returns to the payment step of the same draft; UPI chooser uses text tiles only | |
| K6 | Pay → Approve autopay | Success "Your plan is set. 2 SIPs, ₹500 a month."; Back goes to Portfolio, not into payment | |
| K7 | Portfolio after first investment, then Small dip → Advance one week | First-week note and "Processing" rows, no loss shown; after the week, the short-horizon "steadier type" branch | |
| K8 | Direct URL `#/invest/x` | Redirects to fund list with "We couldn't find that fund" | |
| K9 | Explore → Stocks → Voltara Grid (sample) | "₹1,000 buys 0 shares" with "Indian exchanges don't sell parts of a share." | |
| K10 | Stock buy (1 share) → Continue | Stock budget sheet (first stock buy goes over 10%), Adjust and Buy anyway equal width, never blocks | |
| K11 | Review → "A friend or social media" | Inline "Run a 30-second Tip Check?" offer, skippable | |
| K12 | Tip Check → answer "guaranteed return: Yes" | Red flag tier (amber caution style, not red), drivers listed, one next step, "Back to my order" | |

---

## 3. Meera, 23, part-timer

**Check-in (seeded):** Part-time or freelance · ₹10–25k · emergency money: some · a specific goal · < 1 yr · "wait it out" · ₹1,500 a month.

**Seeded state:** Liquid Fund – A SIP ₹1,500 on the 9th, 2 instalments; goal **Laptop** ₹45,000, about 10 months out, linked to that SIP. 10 weeks of history; next scenario `normal`.

**Expected plan (README 8.1):**
- Rule **A2** (horizon < 1 yr) → 100 / 0.
- One bucket: **Liquid Fund – A, ₹1,500**. Moving the Adjust split slider below 100% keeps one liquid bucket and shows: "You need this within a year, so all of it stays in a liquid fund."
- No conflict note (Moderate comfort), no ceiling note (₹1,500 ≤ ₹4,000).
- Suggested SIP date: the **10th** (irregular income).

**Expected insight branch:** as loaded, **calm** (this week ≥ 0): "One week is not a trend. Nothing to do." Under `dip_sharp` + Advance one week: **down, horizon < 3 yrs**, liquid-fund wording with no alarming words ("crash", "alert", "sell now").

**Expected Home next step:** "You're set. Next SIP on {9th}".

**Expected goal:** progress about 7%; "₹X/month needed, without counting returns" with a shortfall line (increase SIP · extend date · keep as is).

| # | Step | Checkpoint | Result |
|---|---|---|---|
| M1 | Load Meera, open Home | "You're set" card; no second-bucket prompt | |
| M2 | Open Plan, move the split slider | Still one liquid bucket; the all-liquid line appears | |
| M3 | Portfolio → Goals → Laptop | Progress, monthly needed labelled "without counting returns", shortfall choices | |
| M4 | Goal → Increase SIP to ₹X | SIP amount changes; undo toast | |
| M5 | Goal → Extend date / Keep as is | Each acts; no dead button | |
| M6 | Create a goal with a date in the past | Refused on the form: "Pick a date after today." | |
| M7 | Reviewer tools → Sharp dip → Advance one week → Portfolio | Liquid-only insight stays calm; no red; no alarming words | |
| M8 | Reviewer tools → Advance 5 weeks | Next instalment posts; a milestone card shows once on Home; "Got it" hides it after reload | |
| M9 | Dashboard | Donut shows all cushion; plan split vs actual line; goals row links to goal detail | |

---

## 4. Arjun, 24, curious about stocks

**Check-in (seeded):** Salary · ₹50k+ · emergency money: a few months · grow wealth · 5+ yrs · "stay, maybe add" · ₹5,000 a month. Payday 1st.

**Seeded state:** Nifty 50 Index Fund SIP ₹5,000, 3 instalments; watchlist of 3 sample stocks. 10 weeks of history; next scenario `normal`.

**Expected plan (README 8.1):**
- Rule **A6** (cushion yes) → 0 / 100.
- One bucket: **Nifty 50 Index Fund, ₹5,000** (5+ yrs × High); alternative **Flexi Cap Fund**.
- No conflict or ceiling note (₹5,000 ≤ ₹25,000).
- Suggested SIP date: the **4th** (payday + 3).

**Expected insight branch:** as loaded, **calm** (this week +2.4%). After a `dip_small` week: **short-term move, horizon ≥ 3 yrs**: "A short-term move. Your horizon is 5+ years, so this alone doesn't mean you need to act."

**Expected Home next step:** "You're set. Next SIP on {date}".

| # | Step | Checkpoint | Result |
|---|---|---|---|
| A1 | Load Arjun, open Home | "You're set" card | |
| A2 | You → App view → Pro (or desktop top bar) | Toast; badge reads "Pro"; Explore shows sub-tabs, index strip labelled "Sample data", stock cards A–Z | |
| A3 | Pro Explore → Watchlist | 3 saved stocks; sparkline, price, 1D change, 52-week range bar; market green/red only here | |
| A4 | Pro → Fund detail | Confidence blocks behind "Why this?" | |
| A5 | Stocks → any stock → Buy (1 share within budget) → Review | Market/Limit explained; delivery only; risk checkbox; Place order → Success "Order placed (simulated)." | |
| A6 | Back after stock success | Goes to Portfolio, not back into the order | |
| A7 | You → Stocks: budget and quick check | Budget presets and stepper save; "Quick check: 5 questions", 4 of 5 matching unlocks the explanations | |
| A8 | Finish the quick check → stock buy | "More order types, explained" shown as text only; F&O "Not available in this prototype" | |
| A9 | Switch back to Starter | Explore returns to the hub with the plain "Markets this week" line | |

---

## 5. Edge cases (README 14)

| # | Edge case | Persona / start | Expected | Result |
|---|---|---|---|---|
| E1 | ₹99 and ₹1,00,001 | Check-in step 6 custom; Invest amount | Inline `aria-live` error, Continue disabled | |
| E2 | PAN wrong format | KYC step 1 | Inline error with the format | |
| E3 | OTP < 6 digits | Sign-up and KYC step 2 | "Enter all 6 digits of the code." | |
| E4 | Direct URL to `/invest/x` without KYC | Kabir | Unknown fund → fund list + toast; a real fund opens the flow, KYC at payment | |
| E5 | Refresh mid-invest | Any, at review | Resumes at the same step from the saved draft | |
| E6 | Back after success | Fund and stock orders | Goes to Portfolio, not into payment | |
| E7 | Stop coach on a paused SIP | Riya, after Pause | "Pause" shows as "Keep it paused" | |
| E8 | Skip then undo | Riya, SIP detail and Home | Undo restores the instalment | |
| E9 | Goal date in the past | Any, create goal | Refused on the form; a goal that passes later asks for a new date | |
| E10 | Goal < 1 yr linked to equity | Riya, Laptop goal + index SIP | Warning + "Switch to a steadier fund" | |
| E11 | Stock price > amount (0 shares) | Voltara Grid (sample), ₹1,000 | "0 shares" with the explanation; Continue disabled; "Buy 1 share instead" | |
| E12 | Buy exceeding stock budget | Any first stock buy | Gentle sheet with numbers; Adjust / Buy anyway; never blocks | |
| E13 | Empty search | Fund list and Stocks | Empty state with chips / Clear search | |
| E14 | Liquid-only in sharp dip | Meera | Calm insight, no alarming words, no red | |
| E15 | Payday amount smaller than SIP total | Riya, pay ₹1,500 | Yours to spend ₹0 with a note; no negative numbers | |
| E16 | Dashboard with no holdings | Kabir or fresh | Greyed skeleton + "Your dashboard fills in after your first investment" | |
| E17 | Dashboard after Advance one week ×3 | Riya | Tiles, chart, SIP list and activity update | |
| E18 | Reset then direct URL to `/portfolio` | Any | Empty Portfolio, no crash | |
| E19 | Storage unavailable | Browser with storage blocked | App works in memory; one notice "Progress won't be saved in this browser" | |
