# How to build Groww Starter with Claude Code (web)

This file is for **you**, not the agent. It has the one-time setup, the exact prompt for each stage, what to check before you approve, and recovery prompts. Copy each prompt as written, then log what you actually sent in `PROMPT_LOG.md` (you submit those prompts).

---

## Part A — One-time setup (about 15 minutes)

1. **Create the GitHub repo.** On GitHub: New repository → name `groww-starter` → Public (needed for free GitHub Pages) → no template.
2. **Add these files to the repo root** (upload via "Add file → Upload files", or git push):
   ```
   README.md
   CLAUDE.md
   PROMPTS.md
   PROMPT_LOG.md
   CHANGELOG.md
   design-refs/01-moneyflow-dashboard.png
   design-refs/02-personal-finance-themes.png
   design-refs/03-groww-web-explore.png
   design-refs/04-groww-web-top-gainers.png
   design-refs/05-groww-web-watchlist.png
   design-refs/DESIGN_REFS.md
   ```
   Commit message: `docs: spec, agent rules, design refs`.
3. **Turn on GitHub Pages:** repo Settings → Pages → Source: **GitHub Actions**. (The agent writes the workflow in Stage 2.)
4. **Open Claude Code on the web** (claude.ai/code). Click **Select repository…** → connect GitHub if asked → pick `groww-starter`. Keep the environment on **Default** (it needs npm package access).
5. **Model:** use the strongest model available for Stages 0–2 (planning and logic). Sonnet is fine for Stages 3–5.
6. **One session per stage.** Start a **New** session for each stage. Claude Code works on a branch and opens a pull request; you review and **merge to `main`** before starting the next stage. `CLAUDE.md`, `PLAN.md` and `CHANGELOG.md` carry context between sessions, so you never re-explain the project.
7. **Preview:** after each merge, wait for the "Deploy" action to go green (repo → Actions), then open `https://<your-username>.github.io/groww-starter/`. Check it on your phone and on a laptop.

---

## Part B — Stage prompts (send in order)

### Stage 0 — Understand (no code)
```text
Read README.md, CLAUDE.md and design-refs/DESIGN_REFS.md fully, and look at every image in design-refs/. Do not write code or create files.
Reply with:
1. A 6-line summary of what you will build, for whom, and the one assumption the MVP tests.
2. The three biggest user-experience risks you see in the spec, and how the spec handles each (or doesn't).
3. Every place the spec is ambiguous, with the assumption you would make.
4. Anything in the spec you think contradicts itself.
```
**You check:** Does the summary mention *staying invested through the first 90 days*, not just "a beginner app"? Answer any ambiguity you disagree with in the next prompt.

### Stage 1 — Plan (stop for approval)
```text
Proceed with Stage 1 of README.md section 16.
Create PLAN.md containing: the route map, the full TypeScript state shape, the component list, the build order, and for every screen: user goal, key information, primary CTA, secondary actions, the decision it enables, what must NOT appear, and its P-level.
Also add my answers to your Stage 0 questions as "Resolved assumptions": <paste your answers, or write "use your proposed assumptions">.
Do not scaffold or write any code. Commit PLAN.md, open a PR titled "Stage 1: Plan", and stop.
```
**You check before merging:** every screen has exactly one primary CTA · Dashboard has no market data · no Won't feature appears · stop coach shows "Stop anyway". If something is off, reply in the same session: `Change PLAN.md: <what and why>. Keep everything else.` When happy, merge the PR.

### Stage 2 — Foundation (logic + tests, no screens)
```text
PLAN.md is approved and merged. Execute Stage 2 of README.md.
Scaffold Vite + React 18 + TypeScript + Tailwind with hash routing, set up design tokens (light and dark via prefers-color-scheme), the store with localStorage persistence (try/catch), all files in src/data and src/lib, and every test listed in README section 13.2.
Configure the build to output dist/ and a single self-contained dist/index.html (vite-plugin-singlefile), and add .github/workflows/deploy.yml that deploys dist/ to GitHub Pages on push to main.
Run npm test and npm run build until both pass. Log decisions in CHANGELOG.md.
Do not build screens beyond a placeholder App that renders "Groww Starter". Commit, open a PR "Stage 2: Foundation", and show me the test summary.
```
**You check:** test summary shows the planner's 12 matrix cells and rules A1–A6 · build passes · after merging, the Pages URL shows the placeholder.

### Stage 3a — Entry screens
```text
Execute Stage 3a of README.md: the responsive shell (mobile tab bar, desktop sidebar with the "Your plan" card, top bar), Landing, Sign up, Check-in, Starter plan, Home, KYC, Glossary with the Term component, Learn hub, You, and Reviewer tools.
Follow README section 9 acceptance criteria and section 10 design direction, using design-refs/01 for the shell and tiles.
If you can install Playwright, screenshot each screen at 390, 768 and 1280 px and fix layout problems before moving on; if not, tell me what to check manually.
Run tests and build. Commit, open a PR "Stage 3a: Entry", list any acceptance criteria you could not meet, and stop.
```
**You check on the preview:** Landing → Get started → check-in → plan → Home works on your phone · Continue disabled until an answer · back keeps answers · the plan's "Why this" cites your answers.

### Stage 3b — Money in
```text
Execute Stage 3b of README.md: Explore, fund list, Fund detail (all three Confidence blocks visible), Invest flow with UPI chooser and autopay mandate, Success, Portfolio, Holding detail, Withdraw.
Verify the full journey Landing → first SIP → Portfolio at 390 and 1280 px. Run tests and build. Commit, open a PR "Stage 3b: Money in", list unmet criteria, and stop.
```
**You check:** KYC is asked only at first payment and returns you to the same spot · Confirm disabled until the risk box is ticked · ₹99 shows an inline error.

### Stage 3c — Stay (completes P0)
```text
Execute Stage 3c of README.md: SIP detail with skip (with undo), pause 1–3 months, edit amount/date, step-up, the Stop coach exactly as README 8.6, and the weekly insight reacting to every scenario from Reviewer tools.
Then run through README section 17 for P0 items only and report each as verified / not verified with how you checked.
Commit, open a PR "Stage 3c: Stay (P0 complete)", and stop.
```
**You check:** Reviewer tools → Sharp dip → insight copy is calm and not red · Stop SIP → coach shows reasons, "Stop anyway" always visible and same size.

### Stage 3d — Should features (P1)
```text
Execute Stage 3d of README.md in this order: Dashboard (README 9 item 21 and 8.11), Explore Pro view (item 22), Payday Split, Goals, Stocks beginner mode with readiness check and stock budget, the "What made you pick this?" chips with Tip Check, the Starter/Pro toggle, milestone cards, and the notifications inbox.
The Dashboard must show only the user's own money and must update when Reviewer tools change the scenario or advance a week. Use design-refs/01 for its layout and design-refs/03–05 for Explore Pro.
Run tests and build. Commit, open a PR "Stage 3d: P1", list unmet criteria, and stop.
```
**You check:** load the Riya persona → Dashboard shows the dip week marked "You stayed invested" · Advance one week ×3 updates tiles, chart and activity · Dashboard with a fresh account shows the empty state.

### Stage 4 — QA (report first, fix later)
```text
Execute Stage 4 of README.md.
Create evals/EVALS.md and evals/PERSONAS.md exactly as described in section 13, with every Result and Iteration cell left blank.
Then walk all four demo personas and every edge case in section 14 at 390, 768 and 1280 px.
Report only, as a numbered list grouped under: broken interactions, unclear copy, dead buttons, hesitation points, inconsistent terminology, missing states, accessibility issues. Give each item a severity (high/medium/low) and the file it lives in.
Label every finding "agent-simulated". Do not fix anything yet. Commit the evals files, open a PR "Stage 4: QA report", and stop.
```
Then, after you pick items:
```text
Fix only these items from your QA report: <paste numbers>. Keep diffs small, log each fix in CHANGELOG.md, re-run npm test and npm run build, push to the same PR, and stop.
```

### Stage 5 — Polish and ship
```text
Execute Stage 5 of README.md.
Prioritise, in order: hierarchy, readability, CTA clarity, consistency, empty and success states, responsiveness at 390/768/1280, accessibility basics, terminology.
Remove any UI element that does not help the user make or understand the next decision, and list what you removed.
Write DEPLOY.md with exact steps for (1) GitHub Pages, (2) publishing the single-file dist/index.html as a Claude artifact, (3) Vercel as a fallback, and how to verify each link in an incognito window.
Finish with README section 17, ticking only items you verified and saying how. Commit, open a PR "Stage 5: Ship", and stop.
```

### Getting the Claude link (after Stage 5 is merged)
Download `dist/index.html` from the build (or run `npm run build` locally), open a normal chat on claude.ai, upload the file and say:
```text
Publish this single-file HTML app as an artifact exactly as it is, without changing the app's behaviour.
```
Open the resulting link in an incognito window, run the journey once, and use that link (or the GitHub Pages URL) in your submission.

---

## Part C — Recovery prompts

**Agent drifts out of scope**
```text
Stop. Re-read README.md sections 0, 3 and 5 and CLAUDE.md. List which of your recent changes are outside the current stage or scope, revert them, and continue with the current stage only.
```

**New session, needs context**
```text
Read CLAUDE.md, README.md, PLAN.md and the last 20 lines of CHANGELOG.md. Tell me in 5 lines which stage we are on and what is left in it, then continue that stage only.
```

**Something is broken on the preview**
```text
Bug on the live preview at <390 / 1280> px: <what you did> → <what happened> → <what should happen per README section X>.
Find the cause, fix it with the smallest change, add a test if the cause is in src/lib, log it in CHANGELOG.md, and push.
```

**Tests or build keep failing**
```text
Stop changing code. Show me the exact failing test or build error, your diagnosis of the root cause, and the smallest fix you propose. Wait for my OK.
```

**Design feels generic**
```text
Compare the <screen> at 1280 px with design-refs/01 and design-refs/DESIGN_REFS.md. List 5 concrete differences in hierarchy, spacing, card treatment and typography, then apply them using existing tokens only.
```
