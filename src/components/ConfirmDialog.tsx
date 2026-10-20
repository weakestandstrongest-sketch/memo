import type { ReactNode } from 'react';
import { ja } from '../i18n/ja';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="small"
      role="alertdialog"
      className="confirm-dialog"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onCancel}>
            {ja.common.cancel}
          </button>
          <button
            type="button"
            data-autofocus
            className={`button ${danger ? 'button-danger' : 'button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-message">{message}</div>
    </Modal>
  );
}
