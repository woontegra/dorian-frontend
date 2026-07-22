'use client';

import { useEffect, useRef } from 'react';

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    cancelRef.current?.focus();

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="admin-dialog-title" className="admin-dialog-title">
          {title}
        </h3>
        <p id="admin-dialog-description" className="admin-dialog-description">
          {description}
        </p>
        <div className="admin-dialog-actions">
          <button ref={cancelRef} type="button" className="admin-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="admin-button admin-button-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
