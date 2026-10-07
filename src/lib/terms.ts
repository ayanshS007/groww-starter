// "Underline a Term only at its first appearance on each screen" (PLAN C8).
// A screen's TermScope keeps one owner per term id; only the owner underlines.
import type { GlossaryTerm } from '../state/types';

/**
 * Claims `termId` for `ownerId` if nobody owns it yet. Returns true when
 * `ownerId` is (or just became) the owner, so re-renders keep the underline.
 */
export function claimTerm(owners: Map<string, string>, termId: string, ownerId: string): boolean {
  const current = owners.get(termId);
  if (current === undefined) {
    owners.set(termId, ownerId);
    return true;
  }
  return current === ownerId;
}

/** Frees the claim when the owning Term unmounts. */
export function releaseTerm(owners: Map<string, string>, termId: string, ownerId: string): void {
  if (owners.get(termId) === ownerId) owners.delete(termId);
}

/** A–Z list filtered by a case-insensitive match on the term or its meaning. */
export function searchGlossary(terms: GlossaryTerm[], query: string): GlossaryTerm[] {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, 'en'));
  const q = query.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter((t) => t.term.toLowerCase().includes(q) || t.meaning.toLowerCase().includes(q));
}
