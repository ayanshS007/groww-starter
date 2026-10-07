// On-screen keyboard handling (CLAUDE.md mobile requirement). Pure geometry:
// where to scroll so the focused field, and the primary button under it, stay
// visible above the keyboard. The DOM side lives in components/useKeyboardAvoidance.

export type Box = { top: number; bottom: number };

/**
 * Returns how far to scroll the page (positive = down) so that `field` is in
 * the visible band [viewTop, viewBottom]. When `button` (the primary action
 * below the field) fits in the band together with the field, the button is
 * shown too. The field always wins: it is never pushed above `viewTop + margin`.
 */
export function scrollDelta(field: Box, button: Box | undefined, view: Box, margin = 16): number {
  const top = view.top + margin;
  const bottom = view.bottom - margin;
  const fitsBoth = button && button.bottom - field.top <= bottom - top;
  const target = fitsBoth ? button : field;
  // Too low: bring the bottom of the target (button or field) into view.
  if (target.bottom > bottom) {
    const delta = target.bottom - bottom;
    // Never scroll the field itself above the top edge.
    return Math.min(delta, field.top - top);
  }
  // Too high (under a sticky header): bring the field down.
  if (field.top < top) return field.top - top;
  return 0;
}

/** Height of the on-screen keyboard (or other bottom UI) from the visual viewport. */
export function keyboardInset(layoutHeight: number, visual: { height: number; offsetTop: number }): number {
  return Math.max(0, Math.round(layoutHeight - visual.height - visual.offsetTop));
}
