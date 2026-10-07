// S27 Tip Check (README 8.7, PLAN S27). Source + 6 yes/no questions → Red flag
// / Be careful / Fine to research further, with the answers that drove it and
// one next step. Never says whether the market call is right. Reached from
// Learn and inline from buy flows (`?next=` returns to the order).
import { useState } from 'react';
import { BackLink } from '../components/BackLink';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon, type IconName } from '../components/Icon';
import { safeNext } from '../lib/routes';
import { TIP_QUESTIONS, TIP_SOURCES, tipCheckOutcome, type TipAnswers, type TipResult, type TipSource, type TipTier } from '../lib/tipCheck';

const TIER_STYLE: Record<TipTier, { icon: IconName; card: 'caution' | 'info' | 'mint'; iconClass: string }> = {
  red_flag: { icon: 'caution', card: 'caution', iconClass: 'text-caution' },
  be_careful: { icon: 'info', card: 'info', iconClass: 'text-info' },
  fine_to_research: { icon: 'check', card: 'mint', iconClass: 'text-brand-text' },
};

function YesNo({ id, question, value, onChange, missing }: { id: string; question: string; value?: boolean; onChange: (v: boolean) => void; missing: boolean }) {
  return (
    <fieldset className={`rounded-card-sm border-2 p-4 ${missing ? 'border-caution' : 'border-border'} bg-surface`}>
      <legend className="sr-only">{question}</legend>
      <p aria-hidden className="text-base font-semibold text-ink">
        {question}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[true, false].map((v) => {
          const on = value === v;
          return (
            <label
              key={String(v)}
              className={`flex min-h-tap cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-4 font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-focus ${
                on ? 'border-brand bg-mint text-ink' : 'border-border text-ink hover:bg-surface2'
              }`}
            >
              <input type="radio" name={id} className="sr-only" checked={on} onChange={() => onChange(v)} />
              {on && <Icon name="check" size={16} />}
              {v ? 'Yes' : 'No'}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Result({ result, next, onRestart }: { result: TipResult; next?: string; onRestart: () => void }) {
  const style = TIER_STYLE[result.tier];
  return (
    <div className="space-y-5">
      <Card pad="lg" tint={style.card} aria-live="polite" aria-labelledby="tip-result">
        <p className="text-sm font-medium text-ink-muted">Result</p>
        <h2 id="tip-result" className="mt-1 flex items-center gap-2 text-2xl font-bold text-ink">
          <Icon name={style.icon} size={28} className={style.iconClass} />
          {result.label}
        </h2>
        {result.drivers.length > 0 ? (
          <>
            <p className="mt-3 text-base font-semibold text-ink">What drove it</p>
            <ul className="mt-2 space-y-1">
              {result.drivers.map((d) => (
                <li key={d} className="flex items-start gap-2 text-base text-ink">
                  <Icon name="chevronRight" size={18} className="mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-base text-ink">None of your answers raised a warning sign.</p>
        )}
        <p className="mt-4 text-base text-ink">
          <span className="font-semibold">Next step: </span>
          {result.nextStep}
        </p>
        <p className="mt-3 text-sm text-ink-muted">This checks how the tip reached you, not whether the stock or fund will go up.</p>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        {next ? (
          <ButtonLink to={next} replace className="sm:flex-1">
            Back to my order
          </ButtonLink>
        ) : (
          <ButtonLink to="/learn" className="sm:flex-1">
            Back to Learn
          </ButtonLink>
        )}
        <Button variant="secondary" className="sm:flex-1" onClick={onRestart}>
          Start over
        </Button>
      </div>
    </div>
  );
}

export function TipCheck({ query = {} }: { query?: Record<string, string> }) {
  const next = safeNext(query.next);
  const [source, setSource] = useState<TipSource>();
  const [answers, setAnswers] = useState<Partial<TipAnswers>>({});
  const [result, setResult] = useState<TipResult>();
  const [missing, setMissing] = useState<string[]>([]);

  const submit = () => {
    const o = tipCheckOutcome(answers);
    if (!o.done) return setMissing(o.missing);
    setMissing([]);
    setResult(o.result);
    window.scrollTo(0, 0);
  };
  const restart = () => {
    setSource(undefined);
    setAnswers({});
    setResult(undefined);
    setMissing([]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink fallback={next ?? '/learn'}>{next ? 'Back to my order' : 'Learn'}</BackLink>
      <header>
        <h1 className="text-3xl font-bold text-ink">Tip Check</h1>
        <p className="mt-1 text-base text-ink-muted">Heard about a stock or fund? Six quick questions about where the tip came from. About 30 seconds.</p>
      </header>

      {result ? (
        <Result result={result} next={next} onRestart={restart} />
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-5"
        >
          <fieldset>
            <legend className="text-base font-semibold text-ink">Where did you hear it? (optional)</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIP_SOURCES.map((s) => (
                <Chip key={s.id} selected={source === s.id} onClick={() => setSource(source === s.id ? undefined : s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          {TIP_QUESTIONS.map((q) => (
            <YesNo
              key={q.id}
              id={`tip-${q.id}`}
              question={q.question}
              value={answers[q.id]}
              missing={missing.includes(q.id)}
              onChange={(v) => {
                setAnswers({ ...answers, [q.id]: v });
                setMissing(missing.filter((m) => m !== q.id));
              }}
            />
          ))}
          <p aria-live="polite" className="min-h-[1.25rem] text-sm text-caution">
            {missing.length > 0 && `Answer ${missing.length === 1 ? 'the 1 question' : `the ${missing.length} questions`} marked above to see your result.`}
          </p>
          <Button type="submit" block>
            See result
          </Button>
          {next && (
            <ButtonLink to={next} replace variant="quiet" block>
              Skip, back to my order
            </ButtonLink>
          )}
        </form>
      )}
    </div>
  );
}
