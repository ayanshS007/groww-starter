// S18 Glossary (README 7.3, 9 item 17): search, A–Z list, meaning + analogy.
// ?term=<id> opens that term and scrolls to it; ?from=<path> offers a way back.
import { useEffect, useId, useMemo, useState } from 'react';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { GLOSSARY } from '../data/glossary';
import { safeNext } from '../lib/routes';
import { searchGlossary } from '../lib/terms';

const SUGGEST = ['sip', 'nav', 'expense-ratio', 'kyc'];

export function Glossary({ query }: { query: Record<string, string> }) {
  const searchId = useId();
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | undefined>(query.term);
  const from = safeNext(query.from);
  const list = useMemo(() => searchGlossary(GLOSSARY, q), [q]);

  useEffect(() => {
    if (!query.term) return;
    setOpenId(query.term);
    const el = document.getElementById(`term-${query.term}`);
    el?.scrollIntoView({ block: 'center' });
    el?.querySelector('summary')?.focus({ preventScroll: true });
  }, [query.term]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Glossary</h1>
          <p className="mt-1 text-base text-ink-muted">{GLOSSARY.length} terms, A to Z. Tap one to open it.</p>
        </div>
        {from && (
          <ButtonLink to={from} variant="secondary">
            <Icon name="back" size={18} /> Back to where I was
          </ButtonLink>
        )}
      </header>
      <div>
        <label htmlFor={searchId} className="sr-only">
          Search terms
        </label>
        <div className="flex min-h-[52px] items-center gap-2 rounded-full border-2 border-border bg-surface px-4 focus-within:border-brand">
          <Icon name="search" className="text-ink-muted" />
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {q ? `${list.length} term${list.length === 1 ? '' : 's'} found` : ''}
      </p>
      {list.length === 0 ? (
        <div className="rounded-card bg-surface p-6 text-center">
          <p className="font-semibold text-ink">No term matches “{q}”.</p>
          <p className="mt-1 text-sm text-ink-muted">Try one of these:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGEST.map((id) => {
              const t = GLOSSARY.find((g) => g.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setQ('');
                    setOpenId(id);
                  }}
                  className="min-h-tap rounded-full border border-border px-4 text-sm font-medium text-ink hover:bg-surface2"
                >
                  {t.term}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {list.map((t) => (
            <li key={t.id} id={`term-${t.id}`} className="scroll-mt-24">
              <details
                open={openId === t.id}
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  if (isOpen) setOpenId(t.id);
                  else if (openId === t.id) setOpenId(undefined);
                }}
                className="group"
              >
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 hover:bg-surface2">
                  <span className="font-semibold text-ink">{t.term}</span>
                  <Icon name="chevronDown" size={20} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-base text-ink">{t.meaning}</p>
                  <p className="mt-3 rounded-card-sm bg-mint p-4 text-sm text-ink">
                    <span className="font-semibold">Think of it like this: </span>
                    {t.analogy}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
