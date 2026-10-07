import { describe, expect, it } from 'vitest';
import { keyboardInset, scrollDelta } from './viewport';

const view = { top: 0, bottom: 400 }; // 844 px phone with ~440 px of keyboard

describe('scrollDelta', () => {
  it('does nothing when the field is already visible', () => {
    expect(scrollDelta({ top: 100, bottom: 160 }, undefined, view)).toBe(0);
  });
  it('scrolls down just enough to show a field hidden by the keyboard', () => {
    // bottom 460 needs to reach 384 (400 − 16 margin): 76 px
    expect(scrollDelta({ top: 400, bottom: 460 }, undefined, view)).toBe(76);
  });
  it('shows the primary button too when both fit', () => {
    // field 300–360, button 380–436: both fit in 16–384, so the button's bottom is the target
    expect(scrollDelta({ top: 300, bottom: 360 }, { top: 380, bottom: 436 }, view)).toBe(52);
  });
  it('never hides the field to show the button when both do not fit', () => {
    const d = scrollDelta({ top: 200, bottom: 260 }, { top: 700, bottom: 756 }, view);
    // falls back to the field alone, which is already visible
    expect(d).toBe(0);
  });
  it('never pushes the field above the top edge', () => {
    // field is taller than the band: stop with its top at the margin
    expect(scrollDelta({ top: 50, bottom: 900 }, undefined, view)).toBe(34);
  });
  it('brings a field hidden under a sticky header back down', () => {
    expect(scrollDelta({ top: -20, bottom: 40 }, undefined, view)).toBe(-36);
  });
});

describe('keyboardInset', () => {
  it('is the layout height minus the visual viewport', () => {
    expect(keyboardInset(844, { height: 404, offsetTop: 0 })).toBe(440);
  });
  it('accounts for the visual viewport being panned', () => {
    expect(keyboardInset(844, { height: 404, offsetTop: 40 })).toBe(400);
  });
  it('is never negative', () => {
    expect(keyboardInset(800, { height: 810, offsetTop: 0 })).toBe(0);
  });
});
