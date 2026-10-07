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
2026-10-07 | 3a | Router reads the hash with useSyncExternalStore; screens navigate then dispatch in one handler | A guard must never see the new path with old state (or the reverse); timers wrap both in flushSync
2026-10-07 | 3a | New route /kyc/done shows "You're verified" and needs KYC done; later KYC steps redirect to the first open step | README 9.6 wants a verified screen before returning; steps can't be skipped by URL
2026-10-07 | 3a | Landing renders without tabs or sidebar | It is the entry page, not part of the signed-in app shell
2026-10-07 | 3a | Stage 3b/3c screens (Explore, Portfolio, Invest, SIP…) render a "arrives in the next build" card with Back to Home | Keeps tabs and Next-step links working with no dead ends until those stages land
2026-10-07 | 3a | Next-step card, status line and upcoming SIPs live in lib/nextStep.ts; a missing bucket links to /invest/:fundId?amount=<bucket> | Pure, tested; PLAN C6 order; Invest (3b) reads the amount as a preset
2026-10-07 | 3a | A started check-in resumes at its first unanswered step; Close keeps the draft and goes Home | README 9.3 "back keeps answers"; no lost work
2026-10-07 | 3a | Get started → /signup?next=/checkin/1 (or /home when a plan exists); sign-up redirects to next via its guard | One path, no race between navigate and the guard
2026-10-07 | 3a | Home shows the portfolio snapshot (value, invested, change, insight headline) whenever holdings exist | Personas have holdings now; the full InsightCard and Portfolio come in 3b
2026-10-07 | 3a | Cushion is drawn as brand green at 35%, grow as full brand green; split slider track uses the same two colours | README 10 reserves blue for info only
2026-10-07 | 3a | Own-money change on Home: amber text + down arrow + "down" for screen readers; up uses link green | Hard rule: own dips never red, never colour alone
2026-10-07 | 3a | Term definition sheet is portalled to <body>; Terms claim "first appearance" per screen via a TermScope keyed by path | A <dialog> may not sit inside the <p> holding the term; PLAN C8
2026-10-07 | 3a | Reviewer persona load and reset confirm inline (two buttons) instead of a second dialog | The desktop panel is already a dialog; nested dialogs trap focus awkwardly
2026-10-07 | 3a | Desktop reviewer panel is a right-docked dialog opened from an edge tab, shown at ≥ 1024 px on every screen | README 9.20; hidden on mobile, where /review is linked from Landing and You
2026-10-07 | 3a | Learn hub shows Glossary and Stocks vs funds only; Tip Check tile waits for 3d | Tip Check is P1; no P2 cards
2026-10-07 | 3a | Glossary opens one term at a time; ?term= opens and scrolls, ?from= shows "Back to where I was" | README 9.17 deep link; term sheets pass the current path as from
2026-10-07 | 3a | Salary payday question (README 8.2) deferred to the Invest date step in 3b | That is where the SIP date is chosen; setPayday already exists
2026-10-07 | 3a | Screen focus moves to <main> and the page scrolls to top on each route change (not first load) | Screen-reader and keyboard users land on the new content
2026-10-07 | 3a | App placeholder tests replaced by render tests for every 3a route plus acceptance checks (one Next-step card, plan label, no advice/alarm words, masked mobile, Term once) | The placeholder they tested no longer exists
2026-10-07 | 3a | Checked with Playwright (Chromium) on the built app: 15 screens at 390/768/1280 light + Home dark, and a scripted walkthrough at 390 and 1280 | Zero console errors, no external requests, no horizontal overflow
2026-10-07 | 3b | One InvestFlow component drives /invest/:fundId and /invest/plan; the step lives in investDraft, so refresh resumes at the same step | PLAN item 20; one flow means one set of rules
2026-10-07 | 3b | SIP / One-time toggle sits on the amount step, not a separate "type" step (the `type` step is kept in the type union but never used) | One fewer screen; README 9 item 9 order is unchanged
2026-10-07 | 3b | Continue to payment saves step "pay" then sends the user to sign-up/KYC only if needed; a saved pay step without KYC shows review (resolveStep) | PLAN item 19. Finishing KYC resumes at payment; leaving KYC lands on review. Differs slightly from the stage prompt's "returning to review", which would add a tap after every verification; flagged in the PR
2026-10-07 | 3b | Sign-up from the invest flow goes to /kyc/1?next=<invest route> | One path from review to payment for a brand-new user
2026-10-07 | 3b | /invest/plan only includes plan buckets that have no running SIP; if none are missing it redirects to Portfolio with a toast | Avoids duplicate SIPs (Riya already has the index SIP); same rule as the Next-step card
2026-10-07 | 3b | Plan draft re-syncs to the current plan (Change split → /plan → back), resets the risk box and returns to review | A ticked box must never apply to amounts the user hasn't seen
2026-10-07 | 3b | Amount errors show live as the user types (like check-in step 6), and Continue stays enabled so the error can be read | ₹99 shows "The minimum for a SIP in this fund is ₹100." inline, aria-live
2026-10-07 | 3b | Amount is pre-filled with the plan's amount when the fund is in the plan (or from ?amount=), and kept out of one-time | PLAN item 27 preset; Home's second-bucket link already passes ?amount
2026-10-07 | 3b | Fund detail Start SIP / One-time start a fresh draft; a plain link to /invest/:fundId resumes a saved draft for the same fund | "Close keeps the draft" without surprising a user who taps Start SIP again
2026-10-07 | 3b | Success replaces the invest entry; Back from Success (not a click on the page) is redirected to /portfolio | Hash history keeps earlier KYC entries; this keeps Back out of payment (README 12)
2026-10-07 | 3b | Success has a SIP headline "Your first SIP is set." only when it is the user's only SIP, otherwise "Your SIP is set." | PLAN item 32 variants
2026-10-07 | 3b | Fund detail banners: horizon longer than the user's, dip comfort lower than the fund's risk (caution); not in plan, browse mode, existing SIP outside the plan (info) | PLAN items 6 and 30
2026-10-07 | 3b | "Why am I seeing this?" for a fund outside the plan says how the user arrived via ?from=search|collection|plan|portfolio, default "a link" | PLAN item 6
2026-10-07 | 3b | Fund list state (search, chips, filters) is local; only ?q= and ?collection= seed it | Keeps history clean; refresh on the list isn't a required case
2026-10-07 | 3b | Desktop top-bar search only on the Explore hub; the fund list has its own search | Two search boxes with the same name on one screen
2026-10-07 | 3b | Stock holdings show Sell only (no Buy more) until stock screens exist in 3d; Withdraw sheet sells whole shares for stocks | No dead button; no stock routes before 3d
2026-10-07 | 3b | Withdraw of the whole holding navigates to /portfolio first, then dispatches | Otherwise the holding's own guard would redirect with a "not in your portfolio" toast
2026-10-07 | 3b | Added an inline SVG favicon (green tile, check mark; no brand logo) | Browsers request /favicon.ico and the 404 showed as a console error
2026-10-07 | 3b | Portfolio SIP rows and "Manage my SIP" link to /portfolio/sip/:id, which is still the 3c placeholder | Keeps links working until 3c; SIP rows become actionable there
2026-10-07 | 3b | Shared Note (info/caution callout), BackLink, ChangeText (own gain/loss: amber + arrow + word), StatusPill added; Plan now imports Note | Reuse across 3b screens; no visual change on Plan
2026-10-07 | 3b | lib/planStatus.ts holds hasLiveSip/missingBuckets, used by nextStep, routes and the plan flow | routes.ts can't import nextStep.ts (routes → nextStep → routes cycle)
2026-10-07 | 3b | Checked with Playwright (Chromium) on the built app at 390, 768 and 1280 px: Landing → check-in → plan → Start this plan → KYC → both SIPs → Portfolio, ₹99 inline error, refresh mid-invest, Back after Success, Explore/Funds/Fund detail, personas, Withdraw; plus a dark-mode look at three screens | Zero console errors, no external requests, no horizontal overflow
2026-10-07 | 3c | SIP detail replaces the 3b placeholder. Primary action follows status: Skip next instalment (active), Undo skip (skip pending), Resume now (paused), Start a new SIP in this fund (stopped) | PLAN S15; one obvious next action per state
2026-10-07 | 3c | Pause is one tap in a sheet ("Pause for 1/2/3 months · restarts after {date}"); a paused SIP shows "Change the pause" instead | Fewest taps when money is tight. Auto-resume already lived in activity.postWeek
2026-10-07 | 3c | Step-up is a switch showing "Next step-up {date}: ₹X → ₹Y" (+10%, nearest ₹10) and says the demo doesn't run years; Portfolio's SIP row adds "Step-up +10% yearly is on" | PLAN item 17: stored and shown, not simulated
2026-10-07 | 3c | "Linked goal" row shows the goal's name or "None yet"; goals themselves stay P1 (3d) | README 9 item 12 asks for a linked goal; no goal screens before 3d
2026-10-07 | 3c | Stop coach: action row is in the page from the first render, "Stop anyway" last and the same width/height/font as the other options (same Button, secondary variant), reason tiles dense (48 px) with a one-line summary | README 3.3 guardrail. Measured in Chromium: 358×44 each at 390 px, 568×44 at 1280 px
2026-10-07 | 3c | After a reason is picked the row scrolls into view (block: nearest, smooth unless reduced motion) | At 1280×800 the response pushed Stop anyway below the fold. Checked all five reasons at 390×844, 390×667, 768×1024, 1280×800, and a paused SIP at the same sizes
2026-10-07 | 3c | "Pause 1–3 months" and "Lower amount" open the same Pause and Edit sheets as SIP detail; "Go to Withdraw" opens the holding with the Withdraw sheet already open (?withdraw=1) | One screen, no new surfaces; every option does what it says
2026-10-07 | 3c | Every coach choice replaces the coach history entry with SIP detail | Back from SIP detail never returns into the coach
2026-10-07 | 3c | Stop anyway needs no reason (stopReason 'none') and no extra confirm; toast "SIP stopped. Your ₹X stays invested." (X = current sample value of the holding in that fund) and the stopped SIP page repeats it | PLAN S16 and README 8.6
2026-10-07 | 3c | "Market fell" only says "buys more units while prices are lower" when this week was down; in an up or flat week it says "more units when prices dip and fewer when they rise" | The first wording is false after an up week
2026-10-07 | 3c | Coach "Found a better fund" compares with the plan's alternative fund, else a same-category fund, via a native select | README 8.6 side-by-side; sample data, not a ranking
2026-10-07 | 3c | When every SIP in the plan has been stopped, the Next-step card reads "Restart your plan whenever you like" / "Restart my plan" (not "first SIP"). One stopped bucket still reads "Set up your {role} SIP" | PLAN C6 and the existing nextStep test. Flagged in the PR: right after Stop that card may feel pushy
2026-10-07 | 3c | Home shows a "SIP paused" card with Resume now when every live SIP is paused and none is upcoming | README 17: pause must update Home
2026-10-07 | 3c | Insight logic unchanged (PLAN item 15). Home's insight line now shares the Portfolio card's tone (calm, neutral, amber; icon + words) and sits in an always-present aria-live region | A new week is announced to screen readers. Never red
2026-10-07 | 3c | After one up week Riya stays on the big-dip text (overall −10.1%, rule 1 comes first); it turns calm once overall is above −10% | PLAN item 15 as written; the headline still states the up week. Noted for the owner in case the copy should change
2026-10-07 | 3c | Keyboard: a global focusin handler scrolls the focused field and the primary button below it into view (geometry in lib/viewport, tested); --kb lifts bottom sheets; viewport meta adds interactive-widget=resizes-content | CLAUDE.md mobile requirement. Emulated by shrinking the viewport (Android behaviour); the iOS visualViewport path is unit-tested only, not run on a device
2026-10-07 | 3c | Safe-area: flow screens get bottom inset padding, tab bar and toast use side insets, sheets use px-sheet | Checked with a CDP safe-area override: top 47 / bottom 34 portrait, left/right 47 landscape
2026-10-07 | 3c | "Skip to content" moves focus to <main> instead of changing the hash | In a hash router href="#main" became the route /main and redirected to Home
2026-10-07 | 3c | Removed screens/NotYetBuilt.tsx; renderScreen is now exhaustive | No placeholder routes remain
2026-10-07 | 3c | Stop coach carries the standard illustrative disclaimer | It quotes this week's sample move (PLAN item 42). Found by the screen-by-screen disclaimer matrix
2026-10-07 | 3c | README 17 P0 pass in Chromium on the single-file build: 659 (390 px) and 750 (1280 px) controls clicked across 51 screen/state combinations, none dead; 306 renders (3 widths × light/dark) with no overflow, banned words, red, or console errors; 28 direct URLs, refresh on 13 screens and a throwing localStorage never crash | CLAUDE.md verify-before-claiming; scripts live outside the repo
2026-10-07 | 3c | Owner change 1: re-measured the paused Stop coach at 390 px: 67 variants (all 10 funds, active and paused, ₹2,000 and ₹1,00,000, 4th and 28th, 3 pause lengths, Meera and Arjun) × heights 844/780/740/667. "Stop anyway" and the first option were on screen without scrolling in all 268 measurements; worst case bottom edge 632 px (one extra summary line), so 35 px spare at 390×667. No layout change needed | The paused note already lives in the one-line summary (earlier fix). Not claimed for 390×568 or shorter
2026-10-07 | 3c | Owner change 2: for 30 simulated days after a SIP is stopped, the Next-step card skips "Set up your … SIP" for that plan part and moves on; Home shows one quiet line "One part of your plan isn’t running. Restart any time." with a small "Restart" link (to /invest/:fund?amount=, or /invest/plan when two parts are stopped; then "Two parts of your plan aren’t running…"). Day 29 is quiet, day 30 the card returns and the line goes | Owner decision: don't push a restart straight after a stop. Curly apostrophe to match the rest of the app copy
2026-10-07 | 3c | Quiet period applies only to a part with a stopped SIP and no live SIP in that fund. A part that was never started still gets its card (Riya's cushion). With every part stopped and quiet, the card reads "You’re set / No SIP is scheduled right now. What you own stays invested."; Home's status line says "No SIP is running right now…"; after day 30 the earlier "Restart your plan whenever you like" returns | Moves to the next item as asked without saying "paused" when nothing is paused. Success and empty-Portfolio use the same nextStep, so they stay quiet too
2026-10-07 | 3c | Changed two nextStep tests that asserted the old "offer the stopped part immediately" behaviour: they now check the offer returns after 5 weeks (35 days); added day-29/day-30 boundary, both-parts-stopped, restart-clears, pause-is-not-a-stop and Home render tests | The behaviour changed on purpose (owner decision); the tests were wrong for the new rule, not weakened
2026-10-07 | 3c | Owner change 3: big-dip insight with a gain this week (week > 0) while overall ≤ −10% and horizon ≥ 3 yrs: headline "Up ₹X (+y%) this week. Overall: −₹Z (−p%) on what you put in."; body says the portfolio is still ₹Z (p%) below what was put in, that's normal after a bigger fall, no action needed, review optional; neutral tone (not the amber card); branch id stays big_dip so PLAN item 15 order is unchanged. Down or exactly-flat weeks keep the original big-dip wording | Owner decision. The up-week body leaves out "recovered" and "lock in the fall" since there is nothing to sell into; it says nothing that reads as a promise. Replaces the earlier note about Riya's up week
