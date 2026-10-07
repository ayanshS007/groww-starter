// Desktop-only collapsible right-edge reviewer panel (README 9 item 20).
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { ReviewerTools } from './ReviewerTools';

export function ReviewerPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="fixed right-0 top-1/2 z-30 flex min-h-tap min-w-tap -translate-y-1/2 items-center justify-center rounded-l-card-sm border border-r-0 border-border bg-surface px-3 py-4 text-xs font-semibold text-ink-muted shadow-sm [writing-mode:vertical-rl] hover:text-ink"
      >
        Reviewer tools
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Reviewer tools" side="right">
        <ReviewerTools compact onDone={() => setOpen(false)} />
      </BottomSheet>
    </div>
  );
}
