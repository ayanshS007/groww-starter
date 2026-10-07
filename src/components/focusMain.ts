// Moves focus to the page content after a screen or step change, so screen
// readers start at the new content. A field that autofocused itself keeps
// focus: taking it away blurred the field and showed its error before the
// user had typed anything (QA #4).
export function focusMain(): void {
  const main = document.getElementById('main');
  if (!main) return;
  const active = document.activeElement;
  if (active && active !== main && main.contains(active) && active.matches('input, select, textarea')) return;
  main.focus({ preventScroll: true });
}
