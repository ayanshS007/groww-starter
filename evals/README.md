# Evals

Groww Starter is checked in three layers. They are kept apart on purpose, because they are different kinds of evidence.

| Layer | What it is | Evidence | Status |
|---|---|---|---|
| 1. Automated tests | Code checks that run on every change | 1,354 tests in 42 files, all passing | Done |
| 2. Agent-simulated QA | Claude Code walked the app and reported issues | 37 issues found, all 37 fixed | Done. Not user research. |
| 3. Real-user tests | People outside the project use the app | Template and script ready | Results to be added by the author |

## 1. Automated tests

Run them with:

```bash
npm ci
npm test
```

The last run on this branch, on 8 October 2026, printed:

```
Test Files  42 passed (42)
     Tests  1354 passed (1354)
```

The build (`npm run build`) also type-checks the code and confirms the single-file output.

Examples of what is covered:

| File | Tests | What it checks |
|---|---|---|
| [`src/lib/planner.test.ts`](../src/lib/planner.test.ts) | 61 | All 12 category cells, split rules A1 to A6, conflict notes, a plan that never names a chosen fund |
| [`src/lib/cutoff.test.ts`](../src/lib/cutoff.test.ts) | 13 | The 3-business-day skip, pause and edit cutoff |
| [`src/lib/sipCoach.test.ts`](../src/lib/sipCoach.test.ts) | 20 | Each reason's options, "Stop anyway" always last |
| [`src/lib/insight.test.ts`](../src/lib/insight.test.ts) | 26 | Every dip insight branch, no alarming words |
| [`src/lib/planHealth.test.ts`](../src/lib/planHealth.test.ts) | 21 | Every plan health threshold |
| [`src/lib/contrast.test.ts`](../src/lib/contrast.test.ts) | 172 | Text contrast in light and dark, for every mood |
| [`src/copy.test.tsx`](../src/copy.test.tsx) | 437 | Banned words, em dashes and exclamation marks on every route |
| [`src/App.test.tsx`](../src/App.test.tsx) | 176 | Screens, flows and acceptance checks |

Tests do not cover how the app looks or feels. Visual checks were done by hand with Playwright screenshots, and the screens are in [`../docs/screenshots/`](../docs/screenshots/).

## 2. Agent-simulated QA

**This is not user research.** In Stage 4, Claude Code walked the four demo personas and the edge cases at 390, 768 and 1280 px, then reported issues. Every finding is labelled **agent-simulated**.

- **37 issues found.**
- **33 fixed in the Stage 4 fix round** (#1 to #31, #35 and #36).
- **The other 4 fixed in Stage 5** (#32, #33, #34 and #37).
- Each fix and its reason is one line in [`../CHANGELOG.md`](../CHANGELOG.md). Search the file for `QA #`.
- The persona scripts the agent walked are in [`PERSONAS.md`](PERSONAS.md). Their Result column is blank.

## 3. Real-user tests

This layer needs real people. It is not done by the agent.

- [`EVALS.md`](EVALS.md): the success metrics and a 12-task test template, with a Result and an Iteration column for each task.
- [`SESSION_SCRIPT.md`](SESSION_SCRIPT.md): the 15-minute session script for the person running the test.

**Results: to be added by the author.** No results, participants or quotes are recorded in this repository.
