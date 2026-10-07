# Evals — Groww Starter

Source: README section 13.1 (success metrics) and 13.3 (human eval template).

This file is a template. **No sessions have been run.** There are no participants, results or quotes here, and none may be added by the coding agent. The product owner fills in the Result and Iteration columns after real sessions.

Agent walkthroughs live in `PERSONAS.md` and are labelled **agent-simulated**. They are not user research and must not be copied into this file as results.

---

## 1. Success metrics (README 13.1, NPD step 6)

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

---

## 2. Human eval template (README 13.3)

Leave **Result** and **Iteration made** blank until real sessions have been run.

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

### Session set-up notes (for whoever runs the sessions)

- Tasks 1–3: start from a reset prototype (Reviewer tools → Reset) so the participant goes through Landing, sign-up and the check-in.
- Task 4: load **Riya** (two sharp-dip weeks; overall about −12%).
- Task 5: load **Riya** and start on Portfolio.
- Task 6: load **Riya** and start on Home (the "Got paid? Split it" card is there), or use Reviewer tools → Simulate pay credit.
- Task 7: load **Meera** (Laptop goal, liquid SIP).
- Task 8: load **Arjun** or **Kabir** and start on Explore.
- Task 10: load **Riya** and open Dashboard.
- Reviewer tools are not part of the user experience; the facilitator sets state before handing over.
