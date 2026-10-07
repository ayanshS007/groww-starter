// S28 Stock budget + readiness (README 8.9, PLAN S28 and C13). The budget is the
// user's own % of portfolio (default 10%); it never blocks a buy. Readiness:
// 5 questions, pass at 4/5, unlocks only the extra order-type explanations.
// F&O stays "Not available in this prototype". No scores leaderboard.
import { useState } from 'react';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { OptionTiles } from '../components/OptionTile';
import { StepperInput } from '../components/StepperInput';
import { Term } from '../components/Term';
import { useToast } from '../components/Toast';
import { READINESS_QUESTIONS } from '../data/learn';
import { formatINR, formatPct } from '../lib/format';
import { portfolioValue, stockValue } from '../lib/market';
import { scoreReadiness, type ReadinessResult } from '../lib/readiness';
import { DEFAULT_STOCK_BUDGET_PCT } from '../lib/stockBudget';
import { useStore } from '../state/store';

const PRESETS = [5, 10, 15, 20];

export function Trading() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const saved = state.prefs.stockBudgetPct;
  const [pct, setPct] = useState(saved);
  const [answers, setAnswers] = useState<(number | undefined)[]>(READINESS_QUESTIONS.map(() => undefined));
  const [result, setResult] = useState<ReadinessResult>();
  const [unanswered, setUnanswered] = useState(false);
  const total = portfolioValue(state);
  const stocks = stockValue(state);
  const nowPct = total > 0 ? (stocks / total) * 100 : 0;
  const dirty = pct !== saved;

  const save = () => {
    dispatch({ type: 'setStockBudget', pct });
    toast.show(`Stock budget saved: ${pct}% of your portfolio.`);
  };

  const check = () => {
    if (answers.some((a) => a === undefined)) return setUnanswered(true);
    setUnanswered(false);
    const r = scoreReadiness(answers);
    setResult(r);
    dispatch({ type: 'passReadiness', passed: r.passed });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink fallback="/you">You</BackLink>
      <header>
        <h1 className="text-3xl font-bold text-ink">Stocks: budget and quick check</h1>
        <p className="mt-1 text-base text-ink-muted">Your own limits for single stocks. Change them any time.</p>
      </header>

      <Card pad="lg" aria-labelledby="budget-title">
        <h2 id="budget-title" className="text-lg font-semibold text-ink">
          Stock budget
        </h2>
        <p className="mt-1 text-base text-ink">
          The most of your portfolio you want in single stocks. Going over it shows a gentle note with the numbers. It never stops a buy.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Now: stocks are {formatPct(nowPct, 0)} of your portfolio ({formatINR(stocks)} of {formatINR(total)}, sample values).
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick limits">
          {PRESETS.map((p) => (
            <Chip key={p} selected={pct === p} onClick={() => setPct(p)}>
              {p}%{p === DEFAULT_STOCK_BUDGET_PCT ? ' · default' : ''}
            </Chip>
          ))}
        </div>
        <div className="mt-4">
          <StepperInput label="Your limit" value={pct} min={1} max={100} format={(v) => `${v}%`} onChange={setPct} hint="From 1% to 100% of your portfolio." />
        </div>
        <Button className="mt-5" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} onClick={save}>
          {dirty ? 'Save budget' : 'Saved'}
        </Button>
      </Card>

      <Card pad="lg" aria-labelledby="ready-title">
        <h2 id="ready-title" className="text-lg font-semibold text-ink">
          Quick check: 5 questions
        </h2>
        <p className="mt-1 text-base text-ink">
          How single stocks behave, in five questions. It isn’t a test of you. When most answers match, the buy screen also explains more order types.
          Any you miss come with the answer and why.
        </p>
        {state.prefs.readinessPassed && !result && (
          <p className="mt-3 flex items-center gap-2 text-base font-semibold text-brand-text">
            <Icon name="check" size={20} /> Done. More order types are explained when you buy.
          </p>
        )}

        {result ? (
          <div className="mt-4 space-y-4" aria-live="polite">
            <p className="text-xl font-bold text-ink">
              {result.passed
                ? 'Done. More order types are now explained when you buy.'
                : 'Have a look at the notes below. You can go through it again any time.'}
            </p>
            {result.wrongIds.length > 0 && (
              <ul className="space-y-3">
                {READINESS_QUESTIONS.filter((q) => result.wrongIds.includes(q.id)).map((q) => (
                  <li key={q.id} className="rounded-card-sm bg-surface2 p-4 text-sm">
                    <p className="font-semibold text-ink">{q.question}</p>
                    <p className="mt-1 text-ink">Answer: {q.options[q.correctIndex]}</p>
                    <p className="mt-1 text-ink-muted">{q.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setResult(undefined);
                setAnswers(READINESS_QUESTIONS.map(() => undefined));
              }}
            >
              Retake
            </Button>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
            className="mt-4 space-y-5"
          >
            {READINESS_QUESTIONS.map((q, i) => (
              <OptionTiles
                key={q.id}
                name={`ready-${q.id}`}
                legend={`${i + 1}. ${q.question}`}
                value={answers[i]}
                onChange={(v) => {
                  const next = [...answers];
                  next[i] = v;
                  setAnswers(next);
                }}
                options={q.options.map((label, value) => ({ value, label }))}
                dense
              />
            ))}
            <p aria-live="polite" className="min-h-[1.25rem] text-sm text-caution">
              {unanswered && 'Answer all five to see your result.'}
            </p>
            <Button type="submit" variant={dirty ? 'secondary' : 'primary'}>
              Check my answers
            </Button>
          </form>
        )}
      </Card>

      <Card pad="lg" tint="info" aria-labelledby="fno-title">
        <h2 id="fno-title" className="text-base font-semibold text-ink">
          <Term id="f-and-o">F&amp;O</Term> and intraday
        </h2>
        <p className="mt-1 text-base text-ink">Not available in this prototype. Beginner mode is delivery only.</p>
      </Card>
    </div>
  );
}
