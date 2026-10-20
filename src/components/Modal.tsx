import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ja } from '../i18n/ja';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons such as Cancel / Save. On phones they sit at the top so the keyboard never hides them. */
  actions?: ReactNode;
  size?: 'small' | 'medium';
  /** Accessible role: "dialog" for forms, "alertdialog" for confirmations. */
  role?: 'dialog' | 'alertdialog';
  className?: string;
  /** Close when clicking outside the dialog. Turned off for forms so typed text isn't lost. */
  dismissOnBackdrop?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, children, actions, size = 'medium', role = 'dialog', className, dismissOnBackdrop = true }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    // Only auto-focus a text field with a mouse/keyboard; on phones that would
    // pop the keyboard up before the user asked for it.
    const finePointer = window.matchMedia?.('(pointer: fine)').matches;
    const preferred = dialog?.querySelector<HTMLElement>('[data-autofocus]');
    const target = (finePointer && preferred) || dialog;
    target?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && dialog) {
        // Keep keyboard focus inside the dialog.
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal modal-${size} ${className ?? ''}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label={ja.common.close}>
            <CloseIcon />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-actions">{actions}</footer>}
      </div>
    </div>,
    document.body,
  );
}
