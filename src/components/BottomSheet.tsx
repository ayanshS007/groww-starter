// Secondary choices (README 10). Native <dialog> gives focus trap, Esc and
// inert background. Bottom sheet on mobile, centred dialog from 768 px.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 'right' docks the panel to the right edge (desktop reviewer panel). */
  side?: 'bottom' | 'right';
};

export function BottomSheet({ open, onClose, title, children, side = 'bottom' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) d.close();
  }, [open]);

  const position =
    side === 'right'
      ? 'ml-auto mr-0 h-full max-h-full w-[400px] max-w-full rounded-l-card-lg'
      : 'mb-[var(--kb,0px)] mt-auto w-full max-w-full rounded-t-card-lg md:mb-auto md:max-w-lg md:rounded-card-lg';

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      // --kb lifts the sheet above the on-screen keyboard (set by useKeyboardAvoidance).
      style={side === 'bottom' ? { maxHeight: 'min(85%, calc(100% - var(--kb, 0px)))' } : undefined}
      className={`${position} ${side === 'bottom' ? '' : 'max-h-[85%]'} overflow-y-auto bg-surface p-0 text-ink backdrop:bg-ink/40`}
    >
      {open && (
        <div className="pb-safe">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface px-sheet pb-2 pt-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink-muted hover:bg-surface2"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="px-sheet pb-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
