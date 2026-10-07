# DEPLOY.md — publishing Groww Starter

Three ways to publish the same build. Pick the first for a stable public URL, the second for the Claude artifact link, the third as a fallback.

| | What it publishes | Needs | Link looks like |
|---|---|---|---|
| (a) GitHub Pages | `dist/` built by the workflow | repo admin, one setting | `https://ayanshs007.github.io/groww-starter/` |
| (b) Claude artifact | `release/groww-starter.html` (one file) | a claude.ai account | `https://claude.ai/artifact/...` |
| (c) Vercel | `dist/` built by Vercel | a Vercel account | `https://<project>.vercel.app` |

All three serve a static page. The app makes no network calls, uses hash routes (`#/home`), and keeps its state in `localStorage`, so no server rewrites or environment variables are needed.

## Before you publish: refresh the build

```bash
npm ci
npm test                      # must pass
npm run build                 # must pass; writes dist/ and the single-file dist/index.html
cp dist/index.html release/groww-starter.html
git add release/groww-starter.html && git commit -m "chore: refresh release build"
```

`release/groww-starter.html` is a committed copy of the single-file build, so you can download it from GitHub without building anything. If you change any code, refresh it with the last three lines above.

---

## (a) GitHub Pages

The workflow `.github/workflows/deploy.yml` builds and deploys on every push to `main`. `vite.config.ts` uses `base: './'`, so the build works under the `/groww-starter/` sub-path.

**One-time setup**
1. Open the repository on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. (Not "Deploy from a branch".)

**Publish**
1. Merge the Stage 5 pull request into `main`. This triggers the **Deploy** workflow.
   - To deploy without a merge: **Actions** → **Deploy** → **Run workflow** (it has `workflow_dispatch`), choosing `main`.
2. Open **Actions** → the latest **Deploy** run. Wait for both jobs, `build` (runs `npm ci`, `npm test`, `npm run build`) and `deploy`, to turn green.
3. The URL is shown on the `deploy` job under **github-pages**, and under **Settings** → **Pages**. It should be `https://ayanshs007.github.io/groww-starter/`.

**Verify in an incognito window**
1. Open a private/incognito window (Ctrl/Cmd+Shift+N in Chrome, Ctrl/Cmd+Shift+P in Firefox/Edge). Nothing from your normal session, including saved app state, is present.
2. Paste the Pages URL. The Landing page ("Start investing with ₹100. Understand every step.") must load with no sign-in prompt.
3. Open DevTools (F12) → **Console**: no red errors. **Network**: no failed requests, and nothing outside the Pages host.
4. Click **Get started** and go through sign-up and the check-in. Reload the page mid-way; it should resume or redirect with a toast, not show a blank screen.
5. Test a deep link in the same window: paste `<Pages URL>#/learn/glossary`. It should open the Glossary.
6. Repeat at phone width: DevTools → device toolbar → 390 px wide.

If the page is blank or shows a 404: Pages **Source** is not set to GitHub Actions, or the `deploy` job did not finish. If the URL shows an old version: hard-refresh (Ctrl/Cmd+Shift+R) or wait a minute for the CDN.

---

## (b) Claude artifact, from `release/groww-starter.html`

The artifact is the single-file build uploaded to a claude.ai chat and published from there. You need the file on your computer first.

**Get the file**
1. On GitHub, open `release/groww-starter.html` in the repository (branch `main` after the merge).
2. Click **Download raw file** (the download icon above the file view). Keep the name `groww-starter.html`.
   - Or, if you have the repo locally: use `release/groww-starter.html` directly, or build it fresh as in "Before you publish".

**Publish**
1. Open <https://claude.ai> and start a **new chat**.
2. Attach `groww-starter.html` (the paperclip / **Add files** button, or drag the file into the chat).
3. Send this message, which is the same wording as `PROMPTS.md`:
   > Publish this single-file HTML app as an artifact exactly as it is, without changing the app's behaviour.
4. Wait for the artifact to open in the side panel. If Claude rewrites or "improves" the file instead of publishing it as is, stop and start a new chat with the same message. The file is already complete.
5. In the artifact panel choose **Publish** (or **Share**) and set access to **anyone with the link** if you want people outside your account to open it. Copy the link.

The file is about 520 KB, far under the 16 MB limit. It loads no scripts, fonts or images from outside, so it works inside the artifact sandbox. If the sandbox blocks `localStorage`, the app shows its "Progress won't be saved in this browser" notice and keeps working in memory.

The button names above can change in the claude.ai interface. The idea stays the same: upload the file, ask for it to be published unchanged, then share the link with access for anyone who has it.

**Verify in an incognito window**
1. Open a private/incognito window and paste the artifact link. Do **not** sign in to claude.ai.
2. If the link asks you to sign in, the sharing setting is still private. Go back to the artifact, change access to anyone with the link, and try again.
3. The Landing page must load. Click **Get started** and complete the sign-up screen and the first check-in question to confirm the app is interactive inside the artifact frame.
4. Check **Just exploring** → Home loads, and the Glossary opens from **Learn**.
5. Compare it with the Pages link: same screens, same copy.

---

## (c) Vercel (fallback)

Use this if Pages is unavailable. Vercel builds the same `dist/`.

**From the dashboard**
1. Sign in at <https://vercel.com> and choose **Add New…** → **Project**.
2. **Import** the GitHub repository `ayanshS007/groww-starter`. (Allow Vercel access to it if asked.)
3. Set:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
   - No environment variables.
4. Click **Deploy**. When it finishes, the project URL (`https://<project>.vercel.app`) is shown.
5. Production deploys happen on each push to `main`. Pull requests get preview URLs.

**From the command line instead**
```bash
npm ci && npm run build
npx vercel deploy dist --prod
```
The first run asks you to sign in and name the project. Answer the prompts; it uploads `dist/` as it is.

**Verify in an incognito window**
1. Open an incognito window and paste the `.vercel.app` URL.
2. If Vercel shows a login page, "Deployment Protection" is on. In the project: **Settings** → **Deployment Protection** → turn off **Vercel Authentication** for production, then retry in incognito.
3. Run the same checks as for GitHub Pages: Landing loads, Console has no errors, **Network** has no external requests, a reload mid-way and the deep link `<URL>#/learn/glossary` both work, and 390 px width looks right.

---

## Final checklist (do in incognito, for each link you will submit)

- [ ] Opens without signing in to anything.
- [ ] Landing loads; **Get started** reaches the sign-up screen.
- [ ] Console shows no errors; Network shows no requests to other hosts.
- [ ] Reload on `#/home` and on `#/learn/glossary` does not crash.
- [ ] Looks right at 390 px and at 1280 px.
- [ ] You tried it in a normal window too, since saved app state can hide a first-visit problem. Use **Reviewer tools** → **Reset** to start clean.
