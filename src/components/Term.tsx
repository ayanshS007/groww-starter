// Tap-to-explain jargon (README F3). Underlined only at its first appearance
// on each screen (PLAN C8); later appearances render as plain text.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getTerm } from '../data/glossary';
import { buildPath } from '../lib/routes';
import { claimTerm, releaseTerm } from '../lib/terms';
import { Link, useLocation } from '../router';
import { BottomSheet } from './BottomSheet';

const ScopeContext = createContext<Map<string, string> | null>(null);

/** One per screen. Key it by the screen path so it resets on navigation. */
export function TermScope({ children }: { children: ReactNode }) {
  const owners = useRef(new Map<string, string>());
  return <ScopeContext.Provider value={owners.current}>{children}</ScopeContext.Provider>;
}

type Props = { id: string; children?: ReactNode };

export function Term({ id, children }: Props) {
  const owners = useContext(ScopeContext);
  const ownerId = useId();
  const term = getTerm(id);
  const isFirst = owners ? claimTerm(owners, id, ownerId) : true;
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => () => {
    if (owners) releaseTerm(owners, id, ownerId);
  }, [owners, id, ownerId]);

  const text = children ?? term?.term ?? id;
  if (!term || !isFirst) return <>{text}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // 44 px hit area (22 px of text + 11 px padding each side); negative margins keep the line spacing.
        className="-mx-hit -my-hit inline-block cursor-help rounded-sm px-hit py-hit text-left underline decoration-brand-text decoration-dotted decoration-2 underline-offset-4 hover:decoration-solid"
        aria-haspopup="dialog"
      >
        {text}
      </button>
      {/* Portalled: a <dialog> may not sit inside the <p> that holds the term. */}
      {open &&
        createPortal(
          <BottomSheet open onClose={() => setOpen(false)} title={term.term}>
            <p className="text-base text-ink">{term.meaning}</p>
            <p className="mt-3 rounded-card-sm bg-mint p-4 text-base text-ink">
              <span className="font-semibold">Think of it like this: </span>
              {term.analogy}
            </p>
            <Link
              to={buildPath('/learn/glossary', { term: term.id, from: buildPath(loc.path, loc.query) })}
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex min-h-tap items-center font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              Open in glossary
            </Link>
          </BottomSheet>,
          document.body,
        )}
    </>
  );
}
