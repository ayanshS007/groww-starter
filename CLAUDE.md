# CLAUDE.md — working agreements for this repo

Claude Code reads this file automatically at the start of every session. Keep it short and obey it.

## What this repo is
A clickable front-end prototype: **Groww Starter**, a redesign of Groww for first-time investors aged 20–26.
- **Spec (single source of truth):** `README.md`. If anything here or in a prompt conflicts with `README.md`, follow `README.md` and say so.
- PLAN.md's 'Changes to README' section overrides README.md on the points it lists; everywhere else README.md is the source of truth.
- **Visual references:** `design-refs/` + `design-refs/DESIGN_REFS.md` (read-only; never edit or delete).
- **Running memory between sessions:** `PLAN.md` (approved plan), `CHANGELOG.md` (every decision and change). Read both at the start of every session before doing anything.

## Commands
```bash
npm ci            # install (use npm install only when adding a dependency)
npm run dev       # local dev server
npm test          # Vitest, must pass before any commit
npm run build     # must pass; produces dist/ AND single-file dist/index.html
npm run preview   # serve the build
```

## How we work
1. **Stages.** Work only on the stage named in my prompt (README section 16). When the stage is done: run `npm test` and `npm run build`, commit, push the branch, open a PR titled `Stage <n>: <name>`, then stop and summarise in 5 lines or fewer.
2. **Never skip a gate.** Stage 1 ends with `PLAN.md` and no code. Wait for my approval.
3. **Priorities.** P0 before P1. Never start P2 unless I ask. Never build anything graded Won't (README section 3 and 5).
4. **Small, focused commits.** Conventional messages (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Do not rewrite working files to fix a small issue.
5. **Log decisions.** Every non-trivial choice or assumption → one line in `CHANGELOG.md`: `YYYY-MM-DD | stage | what | why`.
6. **Ambiguity.** Pick the simplest option that satisfies README, log it, continue. Ask me only if it changes scope or a stage gate.
7. **Verify before claiming.** Only tick a Definition-of-Done item you actually checked. Say how you checked it. If you could not check something (for example visual layout without a browser), say so plainly.

## Hard rules (do not break)
- No network calls at runtime: no APIs, analytics, remote images, CDN fonts. System font stack only.
- All market data is simulated. Every number shown is labelled illustrative or sample.
- No advice language ("best", "recommended for you", "guaranteed"). Use "starter shortlist based on your answers".
- No confetti, streak counters, leaderboards, points, countdowns or return projections.
- The user's own portfolio dips are never red. Neutral or amber, icon + text.
- No real logos, real company names, real prices or brand illustrations from `design-refs/`. Text wordmark "Groww" only; letter avatars for sample companies.
- Do not write my submission documents: no one-page note, no invented eval results, users or quotes. Agent findings are labelled **agent-simulated**.
- Never weaken a test to make it pass. Fix the code; if a test is genuinely wrong, fix it and log why.

## Code conventions
- TypeScript strict. Pure logic in `src/lib/*` with no React imports, each with a `*.test.ts`.
- Tailwind theme tokens only (colours, radii, spacing, type). No ad-hoc hex values in components.
- Light tokens + dark tokens via `prefers-color-scheme` (no toggle).
- Accessibility: semantic elements, labelled inputs, visible focus, `aria-live` on insight, toasts and form errors, tap targets ≥ 44 px.
- Storage: one `localStorage` key, every access in try/catch; the app must work if storage throws.
- Routing: hash routes. Missing state redirects with a toast (README 4.3).

## Visual checks
If Playwright with Chromium can be installed in this environment, use it to screenshot key screens at 390, 768 and 1280 px and look at them before claiming a screen is done. If installation fails, do not fight it: say so, rely on tests, and list what I should check manually on the GitHub Pages preview.

## Deploy
`.github/workflows/deploy.yml` builds on push to `main` and deploys `dist/` to GitHub Pages. `vite.config.ts` uses `base: './'`. The single-file `dist/index.html` must work when opened on its own.
