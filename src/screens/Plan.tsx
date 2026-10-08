// S4 Starter plan (README 9 item 4, PLAN item 9 / C7 Adjust split).
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Button, ButtonLink } from '../components/Button';
import { Card, type Tint } from '../components/Card';
import { ConfidenceBlock } from '../components/ConfidenceBlock';
import { Icon, type IconName } from '../components/Icon';
import { Note } from '../components/Note';
import { RiskMeter } from '../components/RiskMeter';
import { SplitBar } from '../components/SplitBar';
import { SplitSlider } from '../components/SplitSlider';
import { Term } from '../components/Term';
import { FundPicker } from '../components/FundPicker';
import { WhyDrawer } from '../components/WhyDrawer';
import { fundsInPlanCategory, getFund, PLAN_CATEGORIES } from '../data/funds';
import { formatINR } from '../lib/format';
import { ROLE_LABEL, RISK_COMFORT_LABEL } from '../lib/planner';
import { bucketFundId, planAction } from '../lib/planStatus';
import { Link } from '../router';
import { useStore } from '../state/store';
import type { Fund, FundCategory, PlanBucket, PlanCategoryId, StarterPlan } from '../state/types';

export const CATEGORY_TERM: Partial<Record<FundCategory, { id: string; text: string }>> = {
  Liquid: { id: 'liquid-fund', text: 'Liquid fund' },
  Debt: { id: 'debt-fund', text: 'Debt fund' },
  Hybrid: { id: 'hybrid-fund', text: 'Hybrid fund' },
  Index: { id: 'index', text: 'Index fund' },
  Equity: { id: 'equity', text: 'Equity fund' },
};

export function CategoryLabel({ fund }: { fund: Fund }) {
  const t = CATEGORY_TERM[fund.category];
  return t ? <Term id={t.id}>{t.text}</Term> : <>{fund.category} fund</>;
}

/** "Liquid fund" as a glossary Term when the category has one. */
export function PlanCategoryLabel({ category }: { category: PlanCategoryId }) {
  const t = PLAN_CATEGORIES[category].term;
  return t ? <Term id={t.id}>{t.text}</Term> : <>{PLAN_CATEGORIES[category].label}</>;
}

const ROLE: Record<PlanBucket['role'], { title: string; sub: ReactNode; tint: Tint; icon: IconName }> = {
  cushion: { title: ROLE_LABEL.cushion, sub: <>A safety net for sudden costs, quick to <Term id="redemption">withdraw</Term></>, tint: 'sky', icon: 'shield' },
  grow: { title: ROLE_LABEL.grow, sub: 'Money you can leave alone for years to grow', tint: 'mint', icon: 'arrowUp' },
};

function BucketCard({ bucket, plan }: { bucket: PlanBucket; plan: StarterPlan }) {
  const { state, dispatch } = useStore();
  const cat = PLAN_CATEGORIES[bucket.category];
  const role = ROLE[bucket.role];
  // The candidates share risk and time frame (a data test checks it), so the first one speaks for the category.
  const sample = getFund(bucket.candidateFundIds[0])!;
  return (
    <Card tint={role.tint} as="article" pad="lg" aria-labelledby={`bucket-${bucket.role}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink">
            <Icon name={role.icon} size={20} />
          </span>
          <div>
            <p className="font-semibold text-ink">{role.title}</p>
            <p className="text-sm text-ink-muted">{role.sub}</p>
          </div>
        </div>
        <p className="text-right text-2xl font-bold tabular-nums text-ink">
          {formatINR(bucket.amount)}
          <span className="block text-sm font-medium text-ink-muted">a month</span>
        </p>
      </div>
      <h3 id={`bucket-${bucket.role}`} className="mt-5 text-xl font-bold text-ink">
        {cat.label}
      </h3>
      <p className="mt-1 text-base text-ink">{cat.oneLiner}.</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted">Type</dt>
          <dd className="font-medium text-ink">
            <PlanCategoryLabel category={bucket.category} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Time frame</dt>
          <dd className="font-medium text-ink">{sample.horizonLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="sr-only">Risk</dt>
          <dd>
            <RiskMeter risk={sample.risk} />
          </dd>
        </div>
      </dl>
      <WhyDrawer bucket={bucket} factors={plan.factors} />
      <div className="mt-4 rounded-card-sm bg-surface/70 p-4">
        <FundPicker
          bucket={bucket}
          name={`pick-${bucket.role}`}
          value={bucketFundId(state.sips, bucket)}
          onChange={(fundId) => dispatch({ type: 'pickPlanFund', role: bucket.role, fundId })}
        />
      </div>
    </Card>
  );
}

function OtherOptions({ plan }: { plan: StarterPlan }) {
  const alt = plan.alternativeCategory ? PLAN_CATEGORIES[plan.alternativeCategory] : undefined;
  const altFunds = plan.alternativeCategory ? fundsInPlanCategory(plan.alternativeCategory) : [];
  if (!alt) {
    return (
      <p className="text-base text-ink">
        Your answers point to one category for each part, so there isn’t another to show. Change an answer and the plan changes too.
      </p>
    );
  }
  return (
    <>
      <p className="text-sm text-ink-muted">Another category that also fits your answers, with bigger ups and downs. Filters, not advice.</p>
      <h3 className="mt-3 text-lg font-bold text-ink">{alt.label}</h3>
      <p className="text-sm text-ink-muted">{alt.oneLiner}.</p>
      <ul className="mt-3 space-y-2">
        {altFunds.map((fund) => (
          <li key={fund.id}>
            <Link to={`/fund/${fund.id}?from=plan`} className="flex min-h-tap items-center justify-between gap-3 rounded-card-sm border border-border p-4 hover:bg-surface2">
              <span>
                <span className="block font-semibold text-ink">{fund.name}</span>
                <RiskMeter risk={fund.risk} className="mt-2" />
              </span>
              <Icon name="chevronRight" className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Plan() {
  const { state, dispatch } = useStore();
  const [others, setOthers] = useState(false);
  const plan = state.plan!;
  const sipCount = plan.buckets.length;
  const action = planAction(state)!;
  const cited = plan.factors.filter((f) => f.answer === 'horizon' || f.answer === 'dipReaction' || f.answer === 'cushion');

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-text">Your starter plan</p>
          <h1 className="mt-1 text-4xl font-extrabold tabular-nums text-ink">
            {formatINR(plan.monthly)}
            <span className="text-xl font-semibold text-ink-muted"> a month</span>
          </h1>
          <p className="mt-2 inline-flex rounded-full bg-surface2 px-3 py-1 text-sm text-ink">{plan.label}</p>
          <p className="mt-2 text-sm text-ink-muted">
            <Term id="risk-comfort">Risk comfort</Term>: <span className="font-semibold text-ink">{RISK_COMFORT_LABEL[plan.riskComfort]}</span>
            , from your answer about a 10% fall.
          </p>
        </header>

        <Card pad="lg">
          <h2 className="text-lg font-semibold text-ink">{ROLE_LABEL.cushion} vs {ROLE_LABEL.grow}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            An <Term id="cushion">emergency fund</Term> covers surprises, so you never have to sell your long-term investments in a hurry.
          </p>
          <div className="mt-4">
            <SplitBar plan={plan} animate />
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <SplitSlider plan={plan} onChange={(pct) => dispatch({ type: 'setPlanSplit', cushionPct: pct })} />
          </div>
        </Card>

        {(plan.conflictNote || plan.overCeilingNote || plan.mergeNote) && (
          <div className="space-y-3">
            {plan.conflictNote && <Note tone="info">{plan.conflictNote}</Note>}
            {plan.mergeNote && <Note tone="info">{plan.mergeNote}</Note>}
            {plan.overCeilingNote && <Note tone="caution">{plan.overCeilingNote}</Note>}
          </div>
        )}

        <section aria-labelledby="plan-funds" className="space-y-4">
          <h2 id="plan-funds" className="sr-only">
            Categories in your plan
          </h2>
          {/* Reveal: the cards cascade in after the split bar fills (Stage 6a). */}
          {plan.buckets.map((b, i) => (
            <div key={b.role} className="anim-rise" style={{ '--delay': `${200 + i * 110}ms` } as CSSProperties}>
              <BucketCard bucket={b} plan={plan} />
            </div>
          ))}
        </section>

        <h2 className="sr-only">About this plan</h2>
        <ConfidenceBlock
          compact
          what={
            <>
              A starter shortlist: {sipCount === 1 ? 'one monthly' : `${sipCount} monthly`} <Term id="sip">SIP</Term>
              {sipCount === 1 ? '. It invests' : 's. Each invests'} a fixed amount on a date you pick.
            </>
          }
          why={
            <>
              Based on your answers: {cited.map((f) => f.text.charAt(0).toLowerCase() + f.text.slice(1)).join('; ')}. Change any
              answer and the plan changes too.
            </>
          }
          next={
            <>
              Pick a date, check it over, then a quick verification when you pay. Skip a month, free. Nothing is locked in.
            </>
          }
        />
      </div>

      <aside className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <Card pad="lg" className="lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-ink">{action.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{action.body}</p>
          <div className="mt-5 flex flex-col gap-3">
            <ButtonLink to={action.to} block>
              {action.cta}
            </ButtonLink>
            <ButtonLink to="/checkin/1" variant="secondary" block>
              Edit answers
            </ButtonLink>
            <Button variant="quiet" block onClick={() => setOthers(true)}>
              See other options
            </Button>
          </div>
        </Card>
      </aside>

      <BottomSheet open={others} onClose={() => setOthers(false)} title="Other options">
        <OtherOptions plan={plan} />
      </BottomSheet>
    </div>
  );
}
