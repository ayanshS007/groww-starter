# Feasibility: what would change in the real world

Groww Starter is a prototype. This file checks every feature against technical, regulatory and business reality, and says what would change before it could ship.

**Status of this file.** It has not been reviewed by Groww or by a lawyer. Points stated plainly come from the author's research. Anything not checked is marked **to confirm with Groww compliance**. Nothing here is legal advice.

## Key points

- **Personal fund picks can count as investment advice.** For that reason the Starter plan names a category (for example "Nifty 50 index funds") and lists 2–3 funds, sorted by name. The user picks. The app never chooses a fund for them, including for the Payday top-up.
- **One UPI AutoPay mandate can fund several SIPs.** For mutual funds, a mandate can carry up to ₹1 lakh per transaction without extra authentication. The plan flow uses one mandate for both SIPs.
- **Skips need a cutoff.** A real debit can't be changed at the last minute. The prototype uses about 3 business days, and the bank sends a pre-debit notice 24 hours before. Inside the cutoff, Skip, Pause and Edit are off, with one line saying why. The exact cutoff is to confirm with Groww compliance.
- **Fund-house pauses have their own rules.** The pause options in the app (1–3 months) are a simplification. Each fund house sets its own limits.
- **Payday Split works manually today.** The user types the pay amount. Detecting a salary credit on its own would need Account Aggregator consent.
- **Plan health only sees money held on Groww.** A cushion kept in a bank account is invisible to it. Seeing more would need Account Aggregator consent.
- **Beginner stock mode has a revenue trade-off.** It hides intraday and F&O, and those products earn brokers money. Groww would trade some of that revenue for retention. This is a business decision, not a technical one.
- **The Stop coach must avoid dark patterns.** That is why "Stop anyway" is always visible and the same size as the other options, and why the coach is one screen. Success is measured by users choosing what they meant to, not by stops prevented.

## How to read the matrix

**Verdict:** *Ship* means it can go live with little change. *Ship with changes* means the idea holds but something real must change first. *Needs partner or data* means it depends on a bank, fund house, exchange or data provider. *Prototype only* means it exists for reviewers and would not ship.

## Matrix

### Start

| Feature | Technical | Regulatory | Business | Verdict | What changes in the real world |
|---|---|---|---|---|---|
| Money check-in (6 questions) | A short form. Answers saved on the user profile. | Answers are personal data. Consent and storage rules apply. To confirm with Groww compliance. | Short flows finish more often. Each added question loses some users. | Ship | Add consent text. Compliance should read the questions, because they feed the plan. |
| Starter plan (categories, user picks the fund) | A rules engine maps answers to a category and a list of 2–3 funds. | A personal fund pick can count as investment advice, so the plan shows categories and the user picks. Whether a short list of 2–3 funds is itself safe is to confirm with Groww compliance. | A shortlist converts less than "one tap, we chose". It keeps Groww out of advice territory. | Ship with changes | Use the real fund catalogue. Keep lists neutral: sorted by name, never by return or cost. |
| Adjust split | Slider and a rounding rule. | None expected. | Gives the user control, which supports trust. | Ship | None. |
| Start the whole plan in one pass | One review, one risk tick, one mandate, two SIP registrations. | One UPI AutoPay mandate can fund several SIPs, up to ₹1 lakh per transaction for mutual funds without extra authentication. The mandate limit must cover the total debit. | Fewer drop-offs than two separate setups. | Ship with changes | Real mandate and SIP registration calls replace the simulation. Show the mandate limit. |
| Sign-up (mobile and OTP) | Existing Groww sign-in. | Existing rules. | None. | Prototype only | The existing sign-in replaces it. |
| KYC at the payment step | Existing KYC stack: PAN, Aadhaar, selfie, bank check. | KYC is required before a real first investment. Asking late is a product choice. To confirm with Groww compliance. | Letting people look around first may raise sign-ups. Some may drop at payment. | Ship with changes | Real KYC replaces the simulation. Resume the draft after verification. |
| Landing page | Static page. | Claims such as "Start with ₹100" must match real minimums. | First impression. | Ship | Replace sample copy with approved claims. |

### Stay invested

| Feature | Technical | Regulatory | Business | Verdict | What changes in the real world |
|---|---|---|---|---|---|
| Invest: SIP or one-time, UPI chooser, autopay | Payment and mandate rails. | Mandate rules and limits apply. | The core money flow. | Needs partner or data | Real UPI flow and mandate replace the generic tiles. |
| Skip an instalment, with undo | Needs control over the next debit. | Skips need a cutoff, about 3 business days. A pre-debit notice goes out 24 hours before. Exact cutoff to confirm with Groww compliance. | Keeps the SIP alive instead of stopped. This is the main retention lever. | Ship with changes | Read the real cutoff per mandate. The prototype counts Monday to Friday and ignores holidays. |
| Pause 1–3 months | Needs the fund house to support pauses. | Fund-house pauses have their own rules (length, number of pauses). To confirm with Groww compliance. | Same retention lever as Skip. | Needs partner or data | Show each fund house's own rules in the pause sheet. |
| Edit amount or date | Changes the SIP registration. | The mandate limit must cover a higher amount. Same cutoff as Skip. | Lets people lower an amount instead of stopping. | Ship with changes | Check the mandate limit and the cutoff before allowing the change. |
| Yearly step-up | Stored as a setting. | A higher debit may need a higher mandate limit. To confirm with Groww compliance. | Raises SIP size over time. | Ship with changes | Set the mandate limit with the step-up in mind. The prototype only stores and shows the next step-up date. |
| Stop coach | One screen, options per reason. | Must avoid dark patterns. "Stop anyway" is always visible and the same size. Which consumer-protection rules apply to a broker is to confirm with Groww compliance. | Can retain users who would have quit. The risk is pressure on people who need to stop. | Ship with changes | Measure "chose what they meant to", and watch re-stops within 7 days as a harm signal. Get a dark-pattern review before launch. |
| Weekly dip insight | Computed from holdings and a week-by-week series. | Words about a user's own holdings could be read as advice. Keep to facts and neutral wording. To confirm with Groww compliance. | Calm copy at the moment of a fall may reduce panic stops. | Ship with changes | Real prices replace the simulation. Compliance should approve the sentence templates. |
| Steady mode (big dip) | Changes the layout when a big dip is detected. | None expected. | Hides promotions and the top-up card, so it gives up some cross-sell during dips. | Ship with changes | Needs business sign-off on pausing promotions. |
| Payday Split | The user types the pay amount. The split is simple maths. | Manual today. Detecting pay automatically would need Account Aggregator consent. | A reason to open the app on payday. | Ship with changes | Keep it manual at launch. Add auto-detection later, with consent. |
| Milestone cards | Count instalments. Skips and pauses never reset anything. | None expected. | Rewards staying, not trading. No streaks. | Ship | None. |
| Notifications inbox | Derived from account events. | Transactional messages differ from promotional ones. Marketing consent rules to confirm with Groww compliance. The 24-hour pre-debit notice is a rule, not a nice-to-have. | Opt-out rate is the guardrail. | Ship | Connect to real events. Add push only with consent. |

### Understand

| Feature | Technical | Regulatory | Business | Verdict | What changes in the real world |
|---|---|---|---|---|---|
| Confidence Layer (What is this? Why am I seeing this? What happens next?) | Content per screen, plus a "why" built from the user's answers. | "Why am I seeing this?" must describe a filter, not endorse a fund. To confirm with Groww compliance. | Cheap, and on every decision screen. | Ship | Real scheme facts from scheme documents. Compliance reviews the templates. |
| Fund list, collections, filters | Catalogue API with filters. | Collections are filters. Their names must not imply a recommendation. How funds are ordered needs review. | Neutral lists may reduce clicks on top performers. | Ship | Use the real catalogue. Keep the default order neutral. |
| Fund detail | Static facts plus a sparkline. | Past-performance display rules apply to any return figure. To confirm with Groww compliance. | Where the buy decision happens. | Ship with changes | Real NAV and returns, with the required disclaimers. |
| Tap-to-explain glossary | Content only. | Definitions should match official wording. | Cuts jargon, one of the top pain points. | Ship | Content review. |
| Goals and monthly amount needed | Maths on target, date and current value. | The amount is shown "without counting returns", so no return is promised. | Gives a reason to stay invested. | Ship with changes | In real life one fund can back several goals. The prototype allows one goal per fund. |
| Plan health | Four checks on holdings and SIPs. | None expected. | Points to the next fix. | Ship with changes | It only sees money held on Groww. Label it that way. Seeing a bank-held cushion would need Account Aggregator consent. |
| Dashboard (own money only) | Reads the user's own data. | Personal data rules. | One place to see what you own and whether the plan is on track. | Ship | Real portfolio data. |
| Withdraw | Redeem order. | Settlement time depends on the fund. "1–3 working days" is a sample figure. To confirm with Groww compliance. | Easy exit builds trust. | Needs partner or data | Real redemption and exit-load rules. |

### Safety

| Feature | Technical | Regulatory | Business | Verdict | What changes in the real world |
|---|---|---|---|---|---|
| "What made you pick this?" and Tip Check | Local scoring of yes/no answers. | It never says a tip is right or wrong. It must not look like a certification. Mentioning SEBI registration is fine as a question. | Reduces tip-driven buying. May reduce volume. | Ship | Keep the wording neutral. Review the six questions. |
| Beginner stock mode (delivery only) | Hides other order types. | Hiding products is allowed. Disclose that they exist and why they are hidden. To confirm with Groww compliance. | Revenue trade-off: intraday and F&O earn brokers money, and this mode hides them. Groww would trade some of that revenue for retention. | Ship with changes | Needs business sign-off. Track the share of new users trading intraday or F&O in the first 90 days as a guardrail. |
| Stock budget cap | A percentage check before a buy. | The user sets it. It never blocks. | Lowers trading volume for users who opt in. | Ship | None. |
| 5-question quick check, then Pro | Local scoring, pass at 4 of 5. | It is not a regulatory suitability test and must not be described as one. To confirm with Groww compliance. | Pro is earned, not paid. Locked features stay visible, which is a soft promotion outside Steady mode and flows. | Ship with changes | Decide what Pro contains in the real product and whether it is free. |
| Pro tools: chart ranges, compare two funds, portfolio analytics | Needs real price history. | Past-performance rules apply. The analytics figure is a sample, not the user's own return. | Gives curious users more depth. | Needs partner or data | Real data feed. Required disclaimers. |
| Extra order types (explained only) | Text only in the prototype. | Real order types carry their own risk disclosures. | Some of these earn brokers money. | Prototype only | Real order entry would need its own build and review. |

### Feel and prototype tools

| Feature | Technical | Regulatory | Business | Verdict | What changes in the real world |
|---|---|---|---|---|---|
| Market mood and time-of-day look | A few theme tokens switched by state. | None expected. | Calmer tone after a loss. | Ship | Drive it from real market data. |
| Soft rose for the user's own losses | Colour tokens. | The loss is still shown with ▼ and a sign. | Differs from the usual red and green. May feel unfamiliar to Pro users. | Ship | Test with real users. |
| Light and dark themes | System setting. | None. | None. | Ship | None. |
| Reviewer tools (personas, scenarios, Advance one week, Unlock Pro) | Local state edits. | None. | None. | Prototype only | Would not ship. |
| Simulated market data | Fixed sample series. | All figures are labelled sample data. | None. | Prototype only | Real data, real labels. |

## Not built, on purpose

UPI round-ups, practice mode, a "Future You" projection, a yearly recap, gifting a SIP and squad pots were scored and dropped. See Appendix A in `README.md` for the scores and reasons.
