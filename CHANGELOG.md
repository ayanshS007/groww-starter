# Changelog

Format: YYYY-MM-DD | stage | what | why

2026-10-07 | 0 | Read README, CLAUDE.md, DESIGN_REFS and all 5 refs; reported risks, 37 ambiguities, 10 contradictions | Stage 0 gate; answers recorded in PLAN.md section 1
2026-10-07 | 1 | Created PLAN.md (routes, state shape, lib modules, components, 31 screens, build order) | Stage 1 deliverable; awaiting approval
2026-10-07 | 1 | PLAN.md wins over README on the points in its "Changes to README" table (C1–C18) | Owner instruction; README wins everywhere else
2026-10-07 | 1 | Accepted Stage 0 assumptions 1–37 and contradiction resolutions, with owner changes | Owner approval, recorded in PLAN.md section 1
2026-10-07 | 1 | Big-dip insight rule uses overall change vs invested (≤ −10%); headline also states this week's change | Owner decision; README's weekly rule was unreachable for index funds (max −8%/week)
2026-10-07 | 1 | Insight branch order: big dip → up/flat → short-term down (≥3 yrs) → steadier fund (<3 yrs) | Needed once big-dip no longer depends on the weekly move
2026-10-07 | 1 | Riya seed: two dip_sharp weeks (mid-history + current), overall about −12%; check-in monthly ₹4,000 | Owner decision; makes the big-dip branch and the cushion next-step demoable
2026-10-07 | 1 | Dashboard tab and bell hidden until Stage 3d; mobile bar has 4 tabs until then | Owner decision; avoids dead or stub P1 items in the P0 shell
2026-10-07 | 1 | New route /invest/plan sets up both plan SIPs in one pass (one review, checkbox, mandate, success) | Owner decision; halves the path to first SIP (UX risk 1)
2026-10-07 | 1 | KYC triggered only at the payment step; Home card reads "Start your first SIP (quick verification included)" | Owner decision; resolves README's three KYC-timing statements
2026-10-07 | 1 | Adjust split slider on Starter plan (cushion 0–100%, step 10), one trade-off line, never blocks | Owner decision; reduces paternalism (UX risk 2)
2026-10-07 | 1 | Term underlined only at first appearance per screen | Owner decision; reduces visual noise (UX risk 3)
2026-10-07 | 1 | Ink text on green buttons; darker green token for links/text; darker amber for caution text | White on #00D09C is about 2:1 and fails the 4.5:1 rule
2026-10-07 | 1 | State shape adds market.startDate, investDraft, checkinDraft, kycProgress, user.payday, version, batch/week/unit fields | Simulated calendar, refresh mid-flow, plan batch, valueSeries rebuild
2026-10-07 | 1 | Simulated calendar: today = startDate + 7 × week; instalments post when dayOfMonth falls in an advanced week | Maps monthly SIPs onto weekly reviewer controls deterministically
2026-10-07 | 1 | Cushion part rounded to ₹50, grow gets the remainder; ties under ₹100 merge into cushion | Keeps parts summing to monthly; cushion is the root-cause fix (P4)
2026-10-07 | 1 | "Not earning yet" treated as irregular income (A3, default SIP date 10th) | README rules only split salary vs non-salary
2026-10-07 | 1 | Stop coach: "Keep my SIP" + "Stop anyway" before a reason; "Keep it paused" on paused SIPs; no extra confirm | One primary CTA, one screen, no added friction to stopping
2026-10-07 | 1 | Withdraw is a bottom sheet on Holding detail; stock holdings get Sell via the same sheet | README lists Withdraw without a route; simplest option
2026-10-07 | 1 | Plan flow records pickReason 'plan' and hides the chips | The answer is known; avoids a redundant question
2026-10-07 | 1 | Starter/Pro toggle is free; readiness unlocks only extra order-type explanations | Resolves README 8.9 vs 9 ambiguity
2026-10-07 | 1 | Payday top-up = min(10% of pay, gap to cushion target), rounded to ₹50 | Avoids topping up past the target
2026-10-07 | 1 | UPI chooser uses generic text tiles (UPI app 1/2/3, Enter UPI ID) | CLAUDE.md bans real company names
2026-10-07 | 1 | Kabir demo uses < ₹10k band per README 7.4 table (story says ₹12k) | Demo table is the state reviewers load
2026-10-07 | 1 | data/learn.ts holds only Stocks vs funds, Help FAQs and readiness questions; no P2 cards | P2 not requested
2026-10-07 | 1 | Pro stock cards sorted alphabetically with size chips, never ranked by change | DESIGN_REFS says ignore "Top gainers" framing
2026-10-07 | 1 | CLAUDE.md now states PLAN.md 'Changes to README' overrides README on listed points | Owner instruction; removes conflict with the README-wins rule
2026-10-07 | 2 | Stack: Vite 5, React 18, TypeScript 5 strict, Tailwind 3.4, Vitest 2, vite-plugin-singlefile | README 6.1; Vite 5 + Vitest 2 is a stable pair on Node 22
2026-10-07 | 2 | Colour tokens live once in src/styles/tokens.ts and become CSS variables on :root and under prefers-color-scheme: dark | One source for Tailwind and for the contrast test
2026-10-07 | 2 | Token values: ink #1F2937 on brand #00D09C (7.3:1), link green #007A5A (5.1:1), caution text #9A5B00 (5.1:1); dark: bg #0F172A, link #3DE0B5, caution #F5C04A | PLAN item 43; contrast.test.ts checks 21 text pairs ≥ 4.5:1 in both modes
2026-10-07 | 2 | npm run build = tsc + vite build + scripts/check-dist.mjs (fails on any non-inlined file, external src/href or ≥ 16 MB) | README 6.2 single-file rule is checked on every build
2026-10-07 | 2 | Reducer in state/reducer.ts and storage in state/storage.ts as pure modules; store.tsx only wires React | Lets storage failure and reducer behaviour be tested without React
2026-10-07 | 2 | Route table and guards in lib/routes.ts (pure, tested); router.tsx only listens to the hash | Guards from PLAN section 3 are testable; P1 routes resolve to /home until 3d
2026-10-07 | 2 | advanceWeek lives in lib/activity.ts, not market.ts | Avoids a circular import (it posts instalments, which needs market prices)
2026-10-07 | 2 | Added lib/dates.ts and lib/contrast.ts with tests | UTC ISO date maths for the simulated calendar; WCAG contrast checks
2026-10-07 | 2 | Added reducer actions clearInvestDraft, deleteGoal, setPayday; no simulatePay action | Needed by invest Close, goal Delete and the 8.2 payday question; a pay credit changes no state, so Payday Split will take it as a route param
2026-10-07 | 2 | SIP auto-instalments start on the first SIP date at least 15 days after the first payment | Otherwise a SIP set up on the 7th for the 10th would debit twice in 3 days
2026-10-07 | 2 | This week's change = value change minus money in or out that week; % is against last week's value | New deposits must not show up as market gains
2026-10-07 | 2 | Horizons compared in four buckets; Mid Cap "7+ yrs" counts as 5+, Gold "3+ yrs" as 3–5 | The check-in has only four horizon answers
2026-10-07 | 2 | "5+ yrs + Low" conflict note only when a grow bucket exists; "< 1 yr + High" note always | The balanced-fund note means nothing when grow is 0%; PLAN item 10 covers the other
2026-10-07 | 2 | Big-dip insight says "there's no promise this one will" instead of "isn't guaranteed" | CLAUDE.md bans "guaranteed"; same meaning
2026-10-07 | 2 | Insight horizon in browse mode with only stocks held = 5+ yrs | No check-in and stocks have no horizon
2026-10-07 | 2 | Payday top-up is also capped at what is left after SIPs (to ₹50) | Keeps "Yours to spend" at ₹0 or more without suggesting money the pay can't cover
2026-10-07 | 2 | Plan health SIP check: To do when no active or paused SIPs; Keep an eye when any is paused, even all | README "todo if none" is ambiguous; showing the resume date is calmer
2026-10-07 | 2 | Without a check-in, the cushion and time-frame checks are To do, linking to /checkin/1 | There is no target or horizon to compare against
2026-10-07 | 2 | Stock budget % includes the proposed buy; a first buy is 100% stocks only when nothing else is held | PLAN item 35's "always" only holds for an empty portfolio; code follows the stated formula
2026-10-07 | 2 | Goal-progress and milestone notifications are dated by the simulated week they were reached | Keeps "Today / Earlier" grouping correct
2026-10-07 | 2 | Personas replay fixed purchase weeks through the same lib functions; startDate = today − 7 × weeks | Deterministic numbers; simulated today equals real today
2026-10-07 | 2 | Riya history tuned to overall −12.2%, latest week −8.0%; SIP day = day of the last seeded instalment (max 28) | PLAN item 16 (−13% to −11%); next due date about a month after the last instalment
2026-10-07 | 2 | Kabir gets 8 weeks of market history with nothing invested | README 8.4: personas ship with 8–12 weeks
2026-10-07 | 2 | Fictional stocks (Tealeaf Kitchens, Voltara Grid, …), all named "… (sample)" | CLAUDE.md: no real company names
2026-10-07 | 2 | Exit load copy "No fee to withdraw, at any time." instead of "None." | README 7.1 asks for plain words
2026-10-07 | 2 | Storage: probe write on load; saved state rejected on wrong version or shape; missing fields filled from defaults | PLAN section 4; the app runs in memory with a quiet notice if storage throws
2026-10-07 | 2 | .px-safe utility = max(16px, safe-area inset) | First 390 px screenshot showed text touching the screen edge
2026-10-07 | 2 | Checked dist/index.html in Chromium via Playwright at 390/768/1280 px, light and dark | No external requests, no console errors, unknown route → /home, blocked storage shows the notice
2026-10-07 | 2 | npm audit lists dev-only advisories (esbuild dev server, vitest, braces); left as is | Not in the shipped static bundle; fixing needs major tool upgrades
2026-10-07 | 2 | deploy.yml runs npm test before the build | Failing tests never deploy; Pages needs Settings → Pages → Source: GitHub Actions
