// Keeps the focused field, and the primary button under it, above the on-screen
// keyboard (CLAUDE.md mobile requirement). Geometry lives in lib/viewport.
//  • Sets --kb on <html>: the keyboard's height as the visual viewport reports it
//    (0 where the layout viewport already resizes, see interactive-widget in index.html).
//    Bottom sheets lift by it.
//  • On focus, and when the viewport changes while a field is focused, scrolls the
//    page (or the sheet it sits in) just enough to reveal the field and its button.
import { useEffect } from 'react';
import { keyboardInset, scrollDelta } from '../lib/viewport';

const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, select';
const ACTION = 'button[type=submit], button.bg-brand';

function stickyHeight(container: Element | null): number {
  const el = (container ?? document).querySelector<HTMLElement>('header.sticky, .sticky.top-0');
  return el ? Math.max(0, el.getBoundingClientRect().bottom - Math.max(0, (container?.getBoundingClientRect().top ?? 0))) : 0;
}

/** First primary action that comes after the field in the page, inside the same form, sheet or main. */
function actionAfter(field: HTMLElement): HTMLElement | undefined {
  const scope = field.closest('form, dialog, main') ?? document.body;
  return [...scope.querySelectorAll<HTMLElement>(ACTION)].find(
    (b) => !(b as HTMLButtonElement).disabled && field.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

export function revealFocusedField(): void {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !el.matches(TEXT_FIELD)) return;
  const vv = window.visualViewport;
  const container = el.closest('dialog');
  const containerBox = container?.getBoundingClientRect();
  const viewTop = Math.max(vv?.offsetTop ?? 0, containerBox?.top ?? 0) + stickyHeight(container);
  const viewBottom = Math.min(vv ? vv.offsetTop + vv.height : window.innerHeight, containerBox?.bottom ?? Infinity);
  const f = el.getBoundingClientRect();
  const b = actionAfter(el)?.getBoundingClientRect();
  const delta = scrollDelta({ top: f.top, bottom: f.bottom }, b && { top: b.top, bottom: b.bottom }, { top: viewTop, bottom: viewBottom });
  if (Math.abs(delta) < 1) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const opts: ScrollToOptions = { top: delta, behavior: reduce ? 'auto' : 'smooth' };
  if (container) container.scrollBy(opts);
  else window.scrollBy(opts);
}

export function useKeyboardAvoidance(): void {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number) => timers.push(setTimeout(revealFocusedField, ms));

    const setInset = () => root.style.setProperty('--kb', `${vv ? keyboardInset(window.innerHeight, vv) : 0}px`);
    const onViewport = () => {
      setInset();
      later(30);
    };
    // The keyboard takes ~250 ms to slide in, so reveal once early and once when it has settled.
    const onFocus = () => {
      later(60);
      later(350);
    };

    setInset();
    document.addEventListener('focusin', onFocus);
    vv?.addEventListener('resize', onViewport);
    vv?.addEventListener('scroll', setInset);
    window.addEventListener('resize', onViewport);
    return () => {
      document.removeEventListener('focusin', onFocus);
      vv?.removeEventListener('resize', onViewport);
      vv?.removeEventListener('scroll', setInset);
      window.removeEventListener('resize', onViewport);
      timers.forEach(clearTimeout);
      root.style.removeProperty('--kb');
    };
  }, []);
}
