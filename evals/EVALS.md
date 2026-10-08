# Evals

Groww Starter was tested in three layers.

| Layer | What it checks | Result |
|---|---|---|
| Automated tests | Planner rules, insight copy, Stop coach, contrast, wording rules | 1,365 tests passing (`npm test`) |
| Agent QA (simulated) | Every screen and edge case at phone, tablet and laptop sizes | 37 issues found, all fixed (see CHANGELOG, Stages 4–5) |
| Human feedback | Real people using the live app | 4 people, below |

---

## Human feedback

**How:** Each person used the live app on their own (https://ayanshs007.github.io/groww-starter/) and sent written feedback. These were not timed task sessions. Feedback is copied exactly as received.

| # | Person | Role | Age | Relation to me |
|---|---|---|---|---|
| 1 | Nishant Tripathi | Ex-PM, Zupee | 24 | [RELATION] |
| 2 | Akansh Shankar | 2nd-year PGP student, IIM Indore (Accenture PPO) | 25 | [RELATION] |
| 3 | Mantra Jain | Student, IIT Kanpur | 21 | [RELATION] |



### 1. Nishant Tripathi, ex-PM Zupee, 24
> "Interected with the app but was confused with the wordings in the onboarding stage like cushion and where does money come from .
> UI is nice and scenario simulation is a plus . Liked how pro and starter are separated by a quiz game which makes the user learn more before diving deep into exploration of stock window.
> overall , app felt smooth but some jargons still present"

**What we learned:** He confirmed the wording problem independently ("cushion"). He liked earning Pro through the quick check, which supports keeping it.
**What we changed:**
- "Cushion" → "Emergency fund" (Stage 8)
- "How does money come in?" → **How do you earn?**, with clear options and "Your monthly income, after tax" (Stage 9)
- **Still to do:** a pass to find remaining jargon

### 2. Akansh Shankar, PGP student, IIM Indore, 25
> "Hi,
> This is Akansh, 2nd year PGP Student at IIM Indore and i have used groww-starter and i have found it really useful and easy to understand how to invest my funds, money etc. it's features like cushion & grow helped me a good understanding on how to keep my money safe and also grow. I would recommend this others also. It gave me a good understanding on portfolio diversification, and keeps up to date information about the funds that i invest in and about the potential high active returns (i.eAlpha) generating funds."

**What we learned:** The idea of splitting money into "safe" and "growth" made sense to him, so we kept the idea and only renamed the labels. He also described the app as keeping "up to date information" and showing "alpha generating funds". The app uses sample data and does not rank funds by alpha, so a user can mistake sample data for real data.
**What we changed:** Kept the two-part plan. Added a visible "Sample data" label on Fund detail, Stock detail and the fund list (Stage 9).

### 3. Mantra Jain, student, IIT Kanpur, 21
> "The onboarding was very nice and it gave a good suggestion from my finances. I really like the features and ux of the dashboard and the features of the pro version are very useful . As a new user starting to invest, I found it really easy to understand and it is perfectly made for a finance newbie."

**What we learned:** A first-time investor found onboarding, the Dashboard and Pro easy to use. She described the plan as "a good suggestion", which fits our approach: guidance from her own answers, while she still picks the fund.
**What we changed:** Nothing; this confirms the current design.

---

## Summary

| | |
|---|---|
| **What worked** | Clean UI, market scenarios, Dashboard, earning Pro through the quick check, easy for beginners |
| **What didn't** | Unclear onboarding words ("cushion", "grow", "where money comes from"), some jargon left, sample data mistaken for real data |
| **Changed** | Standard terms with plain explanations (Stage 8); clearer income question and visible "Sample data" labels (Stage 9) |
| **Still to do** | A jargon pass across the app |


## What we'd measure after launch
| Metric | Type |
|---|---|
| Share of first SIPs still active or paused at day 90 | North star |
| Users who stop again within 7 days of the Stop coach | Guardrail |
| New users trying intraday or F&O in their first 90 days | Guardrail |
| Notification opt-outs | Guardrail |
