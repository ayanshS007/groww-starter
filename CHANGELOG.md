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
